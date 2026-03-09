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
            allowed_hosts=["api.vocari.cl", "*.vocari.cl"],
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
