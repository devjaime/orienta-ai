"""
Vocari Backend - Rate limiting en memoria para endpoints publicos.
"""

import time
from collections import defaultdict

from fastapi import Request

from app.common.exceptions import RateLimitError
from app.config import get_settings

_hits: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


async def enforce_public_rate_limit(
    request: Request,
    bucket: str,
    per_minute: int | None = None,
) -> None:
    """Limita solicitudes publicas por IP y cubeta."""
    settings = get_settings()
    limit = per_minute or settings.rate_limit_per_minute
    now = time.monotonic()
    key = f"{bucket}:{_client_ip(request)}"
    window = [stamp for stamp in _hits[key] if now - stamp < 60]
    if len(window) >= limit:
        raise RateLimitError()
    window.append(now)
    _hits[key] = window
