"""
Vocari Backend - FastAPI Application Factory.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.common.database import close_db, init_db
from app.common.error_handlers import register_error_handlers
from app.common.logging import setup_logging
from app.common.redis import close_redis, init_redis
from app.config import get_settings
from app.monitoring import router as monitoring_router, setup_sentry

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Ciclo de vida de la aplicacion: startup y shutdown."""
    settings = get_settings()
    logger.info("Iniciando Vocari Backend", env=settings.app_env)

    # Startup
    await init_db()
    
    # Crear tablas si no existen (añadir columnas faltantes)
    try:
        from app.common.database import get_engine
        from app.common.base_model import Base
        
        # Forzar importación de TODOS los modelos
        import app.auth.models
        import app.institutions.models
        import app.sessions.models
        import app.tests_vocational.models
        import app.games.models
        import app.careers.models
        import app.profiles.models
        import app.consent.models
        import app.audit.models
        import app.notifications.models
        
        engine = get_engine()

        from sqlalchemy import text

        # ---------------------------------------------------------------
        # FASE 0: Si test_results tiene el schema viejo (columna user_email),
        #         dropearlo para que create_all lo recree limpio.
        # ---------------------------------------------------------------
        async with engine.begin() as _conn:
            old_col = await _conn.execute(text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='test_results' AND column_name='user_email'"
            ))
            if old_col.scalar():
                await _conn.execute(text("DROP TABLE IF EXISTS test_results CASCADE"))
                logger.info("Tabla test_results vieja eliminada para recrear con schema nuevo")

        # ---------------------------------------------------------------
        # FASE 1: Migraciones de schema drift — cada una en su propia TX
        # ---------------------------------------------------------------
        schema_migrations = [
            # institutions: columnas del modelo nuevo
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS slug VARCHAR(100)",
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS domain VARCHAR(255)",
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS google_workspace_config JSONB",
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true",
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS max_students INTEGER NOT NULL DEFAULT 50",
            "UPDATE institutions SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') WHERE slug IS NULL",
            """DO $$ BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='institutions_slug_key')
              THEN ALTER TABLE institutions ADD CONSTRAINT institutions_slug_key UNIQUE (slug);
              END IF; END $$""",
            # test_results: renombrar columnas español → inglés
            "ALTER TABLE test_results RENAME COLUMN codigo_holland TO result_code",
            "ALTER TABLE test_results RENAME COLUMN certeza TO certainty",
            "ALTER TABLE test_results RENAME COLUMN puntajes TO scores",
            "ALTER TABLE test_results RENAME COLUMN respuestas TO answers",
            "ALTER TABLE test_results RENAME COLUMN duracion_minutos TO duration_minutes_old",
            # test_results: añadir columnas nuevas
            "ALTER TABLE test_results ADD COLUMN IF NOT EXISTS test_type VARCHAR(100)",
            "ALTER TABLE test_results ADD COLUMN IF NOT EXISTS test_metadata JSONB NOT NULL DEFAULT '{}'",
            "UPDATE test_results SET test_type = 'riasec' WHERE test_type IS NULL",
            "ALTER TABLE test_results ALTER COLUMN test_type SET NOT NULL",
            "ALTER TABLE test_results ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL",
            # test_results: arreglar tipos
            "ALTER TABLE test_results ALTER COLUMN user_email DROP NOT NULL",
            "UPDATE test_results SET certainty = '0.9' WHERE certainty = 'Alta'",
            "UPDATE test_results SET certainty = '0.6' WHERE certainty = 'Media'",
            "UPDATE test_results SET certainty = '0.4' WHERE certainty = 'Exploratoria'",
            "UPDATE test_results SET certainty = '0.5' WHERE certainty IS NOT NULL AND certainty ~ '^[A-Za-z]'",
            "ALTER TABLE test_results ALTER COLUMN certainty TYPE FLOAT USING certainty::FLOAT",
        ]
        for sql in schema_migrations:
            try:
                async with engine.begin() as _conn:
                    await _conn.execute(text(sql))
            except Exception as migration_err:
                err_msg = str(migration_err)
                if "already exists" not in err_msg and "does not exist" not in err_msg:
                    logger.warning("Migration warning", sql=sql[:60], error=err_msg[:120])

        # ---------------------------------------------------------------
        # FASE 2: Crear tablas nuevas que no existen
        # ---------------------------------------------------------------
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # ---------------------------------------------------------------
        # FASE 3: Añadir plan enum a institutions si falta
        # ---------------------------------------------------------------
        async with engine.begin() as conn:
            try:
                await conn.execute(text(
                    "DO $$ BEGIN CREATE TYPE institution_plan AS ENUM ('free','basic','premium'); "
                    "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
                ))
                await conn.execute(text(
                    "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS plan institution_plan NOT NULL DEFAULT 'free'"
                ))
            except Exception:
                pass

        # ---------------------------------------------------------------
        # FASE 4: Seed de juegos si la tabla está vacía
        # ---------------------------------------------------------------
        async with engine.begin() as conn:
            count_row = await conn.execute(text("SELECT COUNT(*) FROM games"))
            if (count_row.scalar() or 0) == 0:
                await conn.execute(text("""
                    INSERT INTO games (id, name, slug, description, skills_evaluated,
                        duration_minutes, difficulty, config, is_active)
                    VALUES
                    (gen_random_uuid(), 'Torre de Decisiones', 'torre-decisiones',
                     'Construye una torre tomando decisiones bajo presión. Evalúa lógica y perseverancia.',
                     '["logica","perseverancia","toma_decisiones"]'::jsonb, 7, 'MEDIUM',
                     '{}'::jsonb, true),
                    (gen_random_uuid(), 'Mapa de Intereses', 'mapa-intereses',
                     'Explora un mapa visual y selecciona actividades que te motivan. Detecta tus intereses vocacionales.',
                     '["autoconocimiento","intereses_vocacionales","creatividad"]'::jsonb, 5, 'EASY',
                     '{}'::jsonb, true),
                    (gen_random_uuid(), 'Simulador de Carrera', 'simulador-carrera',
                     'Gestiona recursos y toma decisiones en un escenario profesional. Evalúa planificación y liderazgo.',
                     '["planificacion","liderazgo","resolucion_problemas"]'::jsonb, 10, 'HARD',
                     '{}'::jsonb, true)
                """))
                logger.info("Juegos de seed insertados")

        logger.info("Setup de tablas completado")
    except Exception as e:
        logger.warning("Error en setup de tablas", error=str(e))
    
    await init_redis()
    setup_sentry()
    logger.info("Servicios inicializados correctamente")

    yield

    # Shutdown
    await close_redis()
    await close_db()
    logger.info("Vocari Backend detenido")


def create_app() -> FastAPI:
    """Factory para crear la aplicacion FastAPI."""
    settings = get_settings()

    # Configurar logging antes de cualquier otra cosa
    setup_logging(log_level=settings.log_level, log_format=settings.log_format)

    app = FastAPI(
        title="Vocari API",
        description="API de la plataforma de orientacion vocacional Vocari",
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # --- Error Handlers ---
    register_error_handlers(app)

    # --- Middleware ---
    _configure_middleware(app, settings)

    # --- Routers ---
    _include_routers(app, settings)

    # --- Health check ---
    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok", "service": "vocari-backend"}

    app.include_router(monitoring_router, tags=["monitoring"])

    return app


def _configure_middleware(app: FastAPI, settings: object) -> None:
    """Configura la pila de middleware."""
    settings = get_settings()

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Trusted Host (solo en produccion)
    if settings.is_production:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["api.vocari.cl", "*.vocari.cl", "*.fly.dev", "vocari-api.fly.dev"],
        )


def _include_routers(app: FastAPI, settings: object) -> None:
    """Registra todos los routers de la API."""
    settings = get_settings()
    prefix = settings.api_v1_prefix

    from app.audit.router import router as audit_router
    from app.auth.router import router as auth_router
    from app.careers.router import router as careers_router
    from app.consent.router import router as consent_router
    from app.dashboards.router import router as dashboards_router
    from app.games.router import router as games_router
    from app.institutions.router import router as institutions_router
    from app.notifications.router import router as notifications_router
    from app.parent_linking.router import router as parent_linking_router
    from app.profiles.router import router as profiles_router
    from app.reports.router import router as reports_router
    from app.sessions.router import router as sessions_router
    from app.student_import.router import router as student_import_router
    from app.tests_vocational.router import router as tests_router

    app.include_router(auth_router, prefix=f"{prefix}/auth", tags=["auth"])
    app.include_router(
        institutions_router, prefix=f"{prefix}/institutions", tags=["institutions"]
    )
    app.include_router(sessions_router, prefix=f"{prefix}/sessions", tags=["sessions"])
    app.include_router(consent_router, prefix=f"{prefix}/consent", tags=["consent"])
    app.include_router(tests_router, prefix=f"{prefix}/tests", tags=["tests"])
    app.include_router(profiles_router, prefix=f"{prefix}/profiles", tags=["profiles"])
    app.include_router(careers_router, prefix=f"{prefix}/careers", tags=["careers"])
    app.include_router(
        dashboards_router, prefix=f"{prefix}/dashboards", tags=["dashboards"]
    )
    app.include_router(
        notifications_router, prefix=f"{prefix}/notifications", tags=["notifications"]
    )
    app.include_router(audit_router, prefix=f"{prefix}/audit", tags=["audit"])
    app.include_router(
        parent_linking_router, prefix=f"{prefix}/parent-links", tags=["parent-linking"]
    )
    app.include_router(
        student_import_router, prefix=f"{prefix}/students/csv", tags=["student-import"]
    )
    app.include_router(games_router, prefix=f"{prefix}/games", tags=["games"])
    app.include_router(reports_router, prefix=f"{prefix}/reports", tags=["reports"])
