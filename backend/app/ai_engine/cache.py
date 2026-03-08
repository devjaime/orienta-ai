"""
Vocari Backend - Cache Layer para respuestas IA (T3.8).

Redis cache con TTL variable por tipo de respuesta.
Segun specs/ai-engine.md seccion 7.1:

| Tipo                     | TTL    | Cacheable |
|--------------------------|--------|-----------|
| Explicacion RIASEC       | 24h    | Si        |
| Recomendacion carreras   | 1h     | Si        |
| Simulacion carrera       | 6h     | Si        |
| Sugerencias tests/juegos | 30min  | Si        |
| Resumen de sesion        | -      | No (siempre unico) |
| Analisis sentimiento     | -      | No (siempre unico) |
"""

from __future__ import annotations

import hashlib
import json
from enum import IntEnum
from functools import wraps
from typing import Any, Callable

import structlog

from app.common.redis import get_redis_client

logger = structlog.get_logger()

# Prefijo global para keys de cache IA
CACHE_PREFIX = "vocari:ai:"


# ---------------------------------------------------------------------------
# TTL por tipo de cache (en segundos)
# ---------------------------------------------------------------------------


class CacheTTL(IntEnum):
    """TTL en segundos para cada tipo de cache IA."""

    RIASEC_EXPLANATION = 86400    # 24 horas
    CAREER_RECOMMENDATION = 3600  # 1 hora
    CAREER_SIMULATION = 21600     # 6 horas
    TEST_SUGGESTIONS = 1800       # 30 minutos
    # Resumen de sesion: NO cachear
    # Analisis de sentimiento: NO cachear


# Tipos que NO se deben cachear
NON_CACHEABLE = frozenset({
    "session_summary",
    "interest_detection",
    "skills_detection",
    "sentiment_analysis",
})


# ---------------------------------------------------------------------------
# Funciones core de cache
# ---------------------------------------------------------------------------


def _make_cache_key(cache_type: str, *args: str) -> str:
    """Genera una key de cache deterministica."""
    parts = ":".join(str(a) for a in args)
    return f"{CACHE_PREFIX}{cache_type}:{parts}"


def _hash_content(content: str) -> str:
    """Genera un hash corto para contenido variable (ej: perfil)."""
    return hashlib.sha256(content.encode()).hexdigest()[:16]


async def get_cached(cache_type: str, *key_parts: str) -> str | None:
    """
    Busca un valor en cache.

    Returns:
        JSON string del valor cacheado, o None si no existe.
    """
    if cache_type in NON_CACHEABLE:
        return None

    try:
        redis = await get_redis_client()
        key = _make_cache_key(cache_type, *key_parts)
        value = await redis.get(key)

        if value is not None:
            logger.debug("Cache hit", cache_type=cache_type, key=key)
            return value

        logger.debug("Cache miss", cache_type=cache_type, key=key)
        return None

    except Exception as exc:
        # Cache errors no deben romper el pipeline
        logger.warning("Error leyendo cache", cache_type=cache_type, error=str(exc))
        return None


async def set_cached(
    cache_type: str,
    *key_parts: str,
    value: str,
    ttl: int | None = None,
) -> bool:
    """
    Almacena un valor en cache.

    Args:
        cache_type: Tipo de cache (para determinar TTL)
        key_parts: Partes de la key
        value: JSON string a almacenar
        ttl: TTL override en segundos (si None, usa default del tipo)

    Returns:
        True si se almaceno correctamente
    """
    if cache_type in NON_CACHEABLE:
        return False

    try:
        redis = await get_redis_client()
        key = _make_cache_key(cache_type, *key_parts)

        # Determinar TTL
        if ttl is None:
            ttl = _get_default_ttl(cache_type)

        if ttl <= 0:
            return False

        await redis.setex(key, ttl, value)
        logger.debug("Cache set", cache_type=cache_type, key=key, ttl=ttl)
        return True

    except Exception as exc:
        logger.warning("Error escribiendo cache", cache_type=cache_type, error=str(exc))
        return False


async def invalidate_cached(cache_type: str, *key_parts: str) -> bool:
    """Invalida una entrada de cache."""
    try:
        redis = await get_redis_client()
        key = _make_cache_key(cache_type, *key_parts)
        deleted = await redis.delete(key)
        if deleted:
            logger.debug("Cache invalidado", cache_type=cache_type, key=key)
        return bool(deleted)

    except Exception as exc:
        logger.warning("Error invalidando cache", cache_type=cache_type, error=str(exc))
        return False


async def invalidate_by_pattern(pattern: str) -> int:
    """
    Invalida todas las keys que matchean un patron.

    Ej: invalidate_by_pattern("vocari:ai:career_rec:*")
    """
    try:
        redis = await get_redis_client()
        count = 0
        async for key in redis.scan_iter(match=f"{CACHE_PREFIX}{pattern}"):
            await redis.delete(key)
            count += 1

        if count > 0:
            logger.info("Cache invalidado por patron", pattern=pattern, count=count)
        return count

    except Exception as exc:
        logger.warning("Error invalidando cache por patron", error=str(exc))
        return 0


# ---------------------------------------------------------------------------
# Decorator para cache automatico
# ---------------------------------------------------------------------------


def ai_cache(
    cache_type: str,
    key_builder: Callable[..., tuple[str, ...]] | None = None,
    ttl: int | None = None,
) -> Callable:
    """
    Decorator que agrega cache a funciones async del pipeline IA.

    Uso:
        @ai_cache("riasec_explain", key_builder=lambda code, model: (code, model))
        async def explain_riasec(code: str, model: str) -> dict:
            ...

    Args:
        cache_type: Tipo de cache (determina TTL y si es cacheable)
        key_builder: Funcion que extrae los key parts de los args
        ttl: TTL override
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Si no es cacheable, ejecutar directamente
            if cache_type in NON_CACHEABLE:
                return await func(*args, **kwargs)

            # Construir key
            if key_builder:
                key_parts = key_builder(*args, **kwargs)
            else:
                # Default: hash de todos los args
                key_parts = (_hash_content(json.dumps(str(args) + str(kwargs))),)

            # Buscar en cache
            cached = await get_cached(cache_type, *key_parts)
            if cached is not None:
                return json.loads(cached)

            # Ejecutar funcion
            result = await func(*args, **kwargs)

            # Almacenar en cache
            try:
                serialized = json.dumps(result, ensure_ascii=False, default=str)
                await set_cached(cache_type, *key_parts, value=serialized, ttl=ttl)
            except (TypeError, ValueError) as exc:
                logger.warning("No se pudo serializar resultado para cache", error=str(exc))

            return result

        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_default_ttl(cache_type: str) -> int:
    """Retorna el TTL default para un tipo de cache."""
    ttl_map: dict[str, int] = {
        "riasec_explain": CacheTTL.RIASEC_EXPLANATION,
        "riasec_explanation": CacheTTL.RIASEC_EXPLANATION,
        "career_rec": CacheTTL.CAREER_RECOMMENDATION,
        "career_recommendation": CacheTTL.CAREER_RECOMMENDATION,
        "career_sim": CacheTTL.CAREER_SIMULATION,
        "career_simulation": CacheTTL.CAREER_SIMULATION,
        "test_suggestions": CacheTTL.TEST_SUGGESTIONS,
        "game_suggestions": CacheTTL.TEST_SUGGESTIONS,
    }
    return ttl_map.get(cache_type, CacheTTL.TEST_SUGGESTIONS)
