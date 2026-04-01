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
        import app.leads.models
        import app.orientador.models
        import app.followups.models
        import app.reconversion.models
        
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
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            # institution_plan enum y columna plan
            "DO $$ BEGIN CREATE TYPE institution_plan AS ENUM ('free','basic','premium'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
            "ALTER TABLE institutions ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NOT NULL DEFAULT 'free'",
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
            # leads: tabla para capturar contacto + test + encuesta final
            """CREATE TABLE IF NOT EXISTS leads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nombre VARCHAR(255) NOT NULL DEFAULT 'Sin nombre',
                email VARCHAR(255) NOT NULL,
                whatsapp VARCHAR(30),
                interes VARCHAR(100) NOT NULL DEFAULT 'carreras',
                source VARCHAR(100) NOT NULL DEFAULT 'web',
                share_token VARCHAR(64) NOT NULL UNIQUE,
                holland_code VARCHAR(20),
                test_answers JSONB NOT NULL DEFAULT '{}',
                survey_response JSONB NOT NULL DEFAULT '{}',
                ai_report_text TEXT,
                ai_report_generated_at TIMESTAMPTZ,
                clarity_score FLOAT,
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )""",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS nombre VARCHAR(255) NOT NULL DEFAULT 'Sin nombre'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS interes VARCHAR(100) NOT NULL DEFAULT 'carreras'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100) NOT NULL DEFAULT 'web'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS share_token VARCHAR(64)",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS holland_code VARCHAR(20)",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS test_answers JSONB NOT NULL DEFAULT '{}'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS survey_response JSONB NOT NULL DEFAULT '{}'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_report_text TEXT",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_report_generated_at TIMESTAMPTZ",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS clarity_score FLOAT",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            "UPDATE leads SET share_token = replace(gen_random_uuid()::text, '-', '') WHERE share_token IS NULL OR share_token = ''",
            "ALTER TABLE leads ALTER COLUMN share_token SET NOT NULL",
            "CREATE INDEX IF NOT EXISTS ix_leads_email ON leads (email)",
            "CREATE INDEX IF NOT EXISTS ix_leads_holland_code ON leads (holland_code)",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_leads_share_token ON leads (share_token)",
            "CREATE INDEX IF NOT EXISTS ix_leads_created_at ON leads (created_at DESC)",
            # ai_reports: historial auditable de informes IA
            """CREATE TABLE IF NOT EXISTS ai_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID REFERENCES users(id) ON DELETE SET NULL,
                lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
                report_text TEXT NOT NULL,
                report_json JSONB NOT NULL DEFAULT '{}',
                holland_code VARCHAR(20),
                clarity_score FLOAT,
                model_name VARCHAR(120) NOT NULL DEFAULT 'fallback-local',
                prompt_version VARCHAR(40) NOT NULL DEFAULT 'v1',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )""",
            "CREATE INDEX IF NOT EXISTS ix_ai_reports_student_id ON ai_reports (student_id)",
            "CREATE INDEX IF NOT EXISTS ix_ai_reports_lead_id ON ai_reports (lead_id)",
            "CREATE INDEX IF NOT EXISTS ix_ai_reports_created_at ON ai_reports (created_at DESC)",
            # followup_events: seguimiento automático post-test
            """CREATE TABLE IF NOT EXISTS followup_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
                student_id UUID REFERENCES users(id) ON DELETE SET NULL,
                journey_step VARCHAR(20) NOT NULL,
                channel VARCHAR(20) NOT NULL DEFAULT 'email',
                status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
                scheduled_at TIMESTAMPTZ NOT NULL,
                sent_at TIMESTAMPTZ,
                retry_count INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                payload JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )""",
            "CREATE INDEX IF NOT EXISTS ix_followup_events_lead_id ON followup_events (lead_id)",
            "CREATE INDEX IF NOT EXISTS ix_followup_events_student_id ON followup_events (student_id)",
            "CREATE INDEX IF NOT EXISTS ix_followup_events_status_scheduled ON followup_events (status, scheduled_at)",
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
        try:
            async with engine.begin() as conn:
                await conn.execute(text(
                    "DO $$ BEGIN CREATE TYPE institution_plan AS ENUM ('free','basic','premium'); "
                    "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
                ))
        except Exception:
            pass
        try:
            async with engine.begin() as conn:
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

        # ---------------------------------------------------------------
        # FASE 5: Seed de carreras si la tabla está vacía
        # ---------------------------------------------------------------
        # Asegurarse que la tabla careers tiene columna updated_at (TimestampMixin)
        for col_sql in [
            "ALTER TABLE careers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            "ALTER TABLE careers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            "ALTER TABLE careers ADD COLUMN IF NOT EXISTS mineduc_data JSONB NOT NULL DEFAULT '{}'",
        ]:
            try:
                async with engine.begin() as conn:
                    await conn.execute(text(col_sql))
            except Exception:
                pass

        try:
            import json as _json
            import uuid as _uuid_mod
            async with engine.begin() as _conn:
                count_row = await _conn.execute(text("SELECT COUNT(*) FROM careers"))
                # Re-seed if less than 10 careers (ensure we have enough)
                # First delete existing to avoid conflicts
                if (count_row.scalar() or 0) < 10:
                    await _conn.execute(text("DELETE FROM careers"))
                    careers_data = [
                        # Perfil Realista (R)
                        ("Ingeniería Civil Mecánica", "Ingeniería", ["R", "I", "C"],
                         "Diseño y mantenimiento de sistemas mecánicos.",
                         {"min": 1000000, "max": 3500000, "median": 1800000, "currency": "CLP"}, 0.90, 0.25),
                        ("Ingeniería en Electricidad", "Ingeniería", ["R", "I", "C"],
                         "Sistemas eléctricos y generación de energía.",
                         {"min": 950000, "max": 3200000, "median": 1700000, "currency": "CLP"}, 0.88, 0.22),
                        ("Técnico en Mecánica Automotriz", "Técnico", ["R", "C"],
                         "Reparación y mantenimiento de vehículos.",
                         {"min": 500000, "max": 1200000, "median": 750000, "currency": "CLP"}, 0.82, 0.35),
                        # Perfil Investigador (I)
                        ("Ingeniería en Informática", "Tecnología", ["I", "R", "C"],
                         "Desarrollo de software, sistemas y soluciones tecnológicas.",
                         {"min": 900000, "max": 3500000, "median": 2000000, "currency": "CLP"}, 0.95, 0.20),
                        ("Medicina", "Salud", ["I", "S", "R"],
                         "Diagnóstico, tratamiento y prevención de enfermedades.",
                         {"min": 1500000, "max": 5000000, "median": 2800000, "currency": "CLP"}, 0.92, 0.30),
                        ("Biología", "Ciencias", ["I", "R", "S"],
                         "Estudio de organismos vivos y ecosistemas.",
                         {"min": 600000, "max": 2000000, "median": 1100000, "currency": "CLP"}, 0.72, 0.40),
                        # Perfil Artístico (A)
                        ("Diseño Gráfico", "Arte y Diseño", ["A", "I", "E"],
                         "Comunicación visual, diseño de identidades y medios digitales.",
                         {"min": 500000, "max": 1800000, "median": 900000, "currency": "CLP"}, 0.65, 0.50),
                        ("Arquitectura", "Diseño y Construcción", ["A", "R", "I"],
                         "Diseño de espacios habitables, edificios e infraestructura.",
                         {"min": 700000, "max": 2500000, "median": 1300000, "currency": "CLP"}, 0.72, 0.40),
                        ("Comunicación Audiovisual", "Comunicación", ["A", "S", "E"],
                         "Producción de contenido audiovisual y multimedia.",
                         {"min": 550000, "max": 2000000, "median": 950000, "currency": "CLP"}, 0.68, 0.52),
                        # Perfil Social (S)
                        ("Psicología", "Ciencias Sociales", ["S", "A", "I"],
                         "Estudio del comportamiento humano y los procesos mentales.",
                         {"min": 600000, "max": 2000000, "median": 1100000, "currency": "CLP"}, 0.78, 0.45),
                        ("Trabajo Social", "Ciencias Sociales", ["S", "C", "A"],
                         "Intervención social y apoyo a comunidades.",
                         {"min": 500000, "max": 1200000, "median": 750000, "currency": "CLP"}, 0.75, 0.38),
                        ("Pedagogía en Matemáticas", "Educación", ["I", "S", "C"],
                         "Enseñanza de matemáticas en educación básica y media.",
                         {"min": 600000, "max": 1500000, "median": 900000, "currency": "CLP"}, 0.85, 0.25),
                        # Perfil Emprendedor (E)
                        ("Derecho", "Ciencias Jurídicas", ["E", "S", "C"],
                         "Estudio del sistema legal, defensa de derechos y justicia.",
                         {"min": 700000, "max": 3000000, "median": 1400000, "currency": "CLP"}, 0.70, 0.55),
                        ("Administración de Empresas", "Negocios", ["E", "C", "S"],
                         "Gestión organizacional, finanzas y estrategia empresarial.",
                         {"min": 600000, "max": 2500000, "median": 1200000, "currency": "CLP"}, 0.80, 0.48),
                        ("Ingeniería Comercial", "Negocios", ["E", "C", "I"],
                         "Gestión empresarial con enfoque tecnológico.",
                         {"min": 800000, "max": 2800000, "median": 1500000, "currency": "CLP"}, 0.83, 0.42),
                        # Perfil Convencional (C)
                        ("Contador Auditor", "Negocios", ["C", "E", "S"],
                         "Gestión financiera y auditoría contable.",
                         {"min": 600000, "max": 2000000, "median": 1000000, "currency": "CLP"}, 0.77, 0.45),
                        ("Ingeniería en Administración", "Negocios", ["E", "C", "S"],
                         "Administración y gestión de organizaciones.",
                         {"min": 700000, "max": 2500000, "median": 1300000, "currency": "CLP"}, 0.81, 0.46),
                        ("Técnico en Contabilidad", "Técnico", ["C", "R"],
                         "Apoyo contable y gestión de información financiera.",
                         {"min": 450000, "max": 900000, "median": 650000, "currency": "CLP"}, 0.79, 0.32),
                    ]
                    insert_sql = text(
                        "INSERT INTO careers (id, name, area, holland_codes, description, "
                        "salary_range, employability, saturation_index, mineduc_data, is_active) "
                        "VALUES (:id, :name, :area, CAST(:hc AS jsonb), :desc, "
                        "CAST(:sr AS jsonb), :emp, :sat, CAST(:md AS jsonb), true)"
                    )
                    for (name, area, codes, desc, salary, emp, sat) in careers_data:
                        await _conn.execute(insert_sql, {
                            "id": str(_uuid_mod.uuid4()),
                            "name": name, "area": area,
                            "hc": _json.dumps(codes),
                            "desc": desc,
                            "sr": _json.dumps(salary),
                            "emp": emp, "sat": sat,
                            "md": "{}",
                        })
                    logger.info("Carreras de seed insertadas")
        except Exception as careers_err:
            logger.warning("Error en seed de carreras", error=str(careers_err)[:400])

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

    from app.admin.router import router as admin_router
    from app.audit.router import router as audit_router
    from app.ai.router import router as ai_router
    from app.auth.router import router as auth_router
    from app.careers.router import router as careers_router
    from app.consent.router import router as consent_router
    from app.dashboards.router import router as dashboards_router
    from app.games.router import router as games_router
    from app.followups.router import router as followups_router
    from app.institutions.router import router as institutions_router
    from app.leads.router import router as leads_router
    from app.notifications.router import router as notifications_router
    from app.parent_linking.router import router as parent_linking_router
    from app.orientador.router import router as orientador_router
    from app.profiles.router import router as profiles_router
    from app.reports.router import router as reports_router
    from app.reconversion.router import router as reconversion_router
    from app.sessions.router import router as sessions_router
    from app.student_import.router import router as student_import_router
    from app.students.router import router as students_router
    from app.tests_vocational.router import router as tests_router

    app.include_router(auth_router, prefix=f"{prefix}/auth", tags=["auth"])
    app.include_router(ai_router, prefix=f"{prefix}/ai", tags=["ai"])
    app.include_router(leads_router, prefix=f"{prefix}", tags=["leads"])
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
    app.include_router(students_router, prefix=f"{prefix}/students", tags=["students"])
    app.include_router(orientador_router, prefix=f"{prefix}/orientador", tags=["orientador"])
    app.include_router(admin_router, prefix=f"{prefix}/admin", tags=["admin"])
    app.include_router(followups_router, prefix=f"{prefix}/followups", tags=["followups"])
    app.include_router(games_router, prefix=f"{prefix}/games", tags=["games"])
    app.include_router(reports_router, prefix=f"{prefix}/reports", tags=["reports"])
    app.include_router(reconversion_router, prefix=f"{prefix}/reconversion", tags=["reconversion"])

    from app.chat.router import router as chat_router
    app.include_router(chat_router, prefix=f"{prefix}/chat", tags=["chat"])
