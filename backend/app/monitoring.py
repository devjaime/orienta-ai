"""
Vocari Backend - Monitoring y Observabilidad.

Configuracion de Sentry, health checks, y metrics.
"""

from datetime import UTC, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.database import get_async_session
from app.config import get_settings

logger = structlog.get_logger()

router = APIRouter()
DbSessionDep = Annotated[AsyncSession, Depends(get_async_session)]


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "ok",
        "service": "vocari-backend",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/health/db")
async def health_check_db(db: DbSessionDep) -> dict:
    """Health check for database connection."""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "timestamp": datetime.now(UTC).isoformat(),
        }
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(UTC).isoformat(),
        }


@router.get("/health/redis")
async def health_check_redis() -> dict:
    """Health check for Redis connection."""
    from app.common.redis import get_redis_client

    try:
        redis = await get_redis_client()
        await redis.ping()
        return {
            "status": "ok",
            "redis": "connected",
            "timestamp": datetime.now(UTC).isoformat(),
        }
    except RuntimeError as e:
        logger.warning("Redis health check disabled", error=str(e))
        return {
            "status": "degraded",
            "redis": "disabled",
            "error": str(e),
            "timestamp": datetime.now(UTC).isoformat(),
        }
    except Exception as e:
        logger.error("Redis health check failed", error=str(e))
        return {
            "status": "error",
            "redis": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(UTC).isoformat(),
        }


@router.get("/metrics")
async def metrics_endpoint() -> dict:
    """Basic metrics endpoint."""
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "service": "vocari-backend",
    }


def setup_sentry() -> None:
    """Inicializa Sentry para tracking de errores."""
    settings = get_settings()

    if not settings.sentry_dsn:
        logger.info("Sentry DSN not configured, skipping Sentry setup")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.sentry_environment,
            traces_sample_rate=settings.sentry_sample_rate,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,
            ignore_errors=[
                "KeyboardInterrupt",
                "SystemExit",
            ],
        )
        logger.info("Sentry initialized", environment=settings.sentry_environment)
    except ImportError:
        logger.warning("sentry-sdk not installed, skipping Sentry setup")
    except Exception as e:
        logger.error("Failed to initialize Sentry", error=str(e))
