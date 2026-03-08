"""
Vocari Backend - Conexion a Redis.
"""

from typing import Any

import structlog
from redis.asyncio import Redis

from app.config import get_settings

logger = structlog.get_logger()

_redis: Redis | None = None  # type: ignore[type-arg]


async def init_redis() -> None:
    """Inicializa la conexion a Redis."""
    global _redis
    settings = get_settings()

    _redis = Redis.from_url(
        settings.redis_url,
        decode_responses=True,
    )

    # Verificar conexion
    await _redis.ping()
    logger.info("Redis conectado", url=settings.redis_url)


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
        raise RuntimeError("Redis no inicializado. Llamar a init_redis() primero.")
    return _redis
