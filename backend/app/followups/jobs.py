"""Jobs RQ para procesamiento de followups pendientes."""

from __future__ import annotations

import asyncio

import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.followups.service import process_due_followups

logger = structlog.get_logger()


def process_due_followups_job(limit: int = 100) -> dict:
    """Job sincrónico para RQ, invoca procesamiento async."""
    return asyncio.run(_process_due_followups_async(limit=limit))


async def _process_due_followups_async(limit: int = 100) -> dict:
    settings = get_settings()
    engine = create_async_engine(
        settings.database_url,
        pool_size=2,
        max_overflow=0,
        pool_pre_ping=True,
    )
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    try:
        async with session_factory() as db:
            result = await process_due_followups(db, limit=limit)
            await db.commit()
            logger.info("Followups procesados por worker", **result)
            return result
    finally:
        await engine.dispose()

