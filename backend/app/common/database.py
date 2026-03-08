"""
Vocari Backend - Conexion a PostgreSQL con SQLAlchemy 2.0 async.
"""

from collections.abc import AsyncGenerator

import structlog
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

logger = structlog.get_logger()

# Variables de modulo (inicializadas en startup)
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def init_db() -> None:
    """Inicializa el engine y session factory de SQLAlchemy."""
    global _engine, _session_factory
    settings = get_settings()

    _engine = create_async_engine(
        settings.database_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        echo=settings.debug and settings.is_development,
    )

    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Verificar conexion
    async with _engine.begin() as conn:
        await conn.execute(
            __import__("sqlalchemy").text("SELECT 1")
        )

    logger.info("PostgreSQL conectado", pool_size=settings.database_pool_size)


async def close_db() -> None:
    """Cierra el engine de SQLAlchemy."""
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("PostgreSQL desconectado")


def get_engine() -> AsyncEngine:
    """Retorna el engine de SQLAlchemy."""
    if _engine is None:
        raise RuntimeError("Database no inicializada. Llamar a init_db() primero.")
    return _engine


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection: provee una sesion de BD por request."""
    if _session_factory is None:
        raise RuntimeError("Database no inicializada. Llamar a init_db() primero.")

    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
