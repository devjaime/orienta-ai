"""
Vocari Backend - Conexion a Redis.
"""

from typing import Any

import structlog
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import get_settings

logger = structlog.get_logger()

_redis: Redis | None = None  # type: ignore[type-arg]


async def init_redis() -> None:
    """Inicializa la conexion a Redis."""
    global _redis
    settings = get_settings()

    client = Redis.from_url(
        settings.redis_url,
        decode_responses=True,
    )

    try:
        await client.ping()
    except RedisError as exc:
        await client.close()
        _redis = None

        if settings.redis_required:
            raise

        logger.warning(
            "Redis no disponible, continuando sin cache",
            error=str(exc),
        )
        return

    _redis = client
    logger.info("Redis conectado")


async def close_redis() -> None:
    """Cierra la conexion a Redis."""
    global _redis
    if _redis:
        await _redis.close()
        _redis = None
        logger.info("Redis desconectado")


async def get_redis_client() -> Any:
    """Dependency injection: provee el cliente Redis."""
    if _redis is None:
        raise RuntimeError("Redis no disponible o no inicializado.")
    return _redis
