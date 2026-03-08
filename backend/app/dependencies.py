"""
Vocari Backend - Dependency Injection.

Provee dependencias reutilizables para los endpoints via FastAPI Depends().
"""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.database import get_async_session
from app.common.redis import get_redis_client
from app.config import Settings, get_settings

# --- Settings ---
SettingsDep = Annotated[Settings, Depends(get_settings)]

# --- Database ---
DbSession = Annotated[AsyncSession, Depends(get_async_session)]

# --- Redis ---
RedisDep = Annotated[object, Depends(get_redis_client)]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Alias para get_async_session (compatibilidad)."""
    async for session in get_async_session():
        yield session
