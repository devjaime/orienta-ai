"""
Vocari Backend - Job de retry de extraccion de transcripcion.

Ejecutado por rq worker con delay (backoff exponencial).
Busca la transcripcion de Google Meet en Drive y, si la encuentra,
la extrae y encola el job de analisis IA.
"""

from __future__ import annotations

import asyncio
import uuid

import structlog

logger = structlog.get_logger()


def retry_transcript_extraction_job(session_id: str, attempt: int) -> dict:
    """
    Job de retry para extraccion de transcripcion.

    Args:
        session_id: UUID de la sesion (como string)
        attempt: Numero de intento actual (1-based)

    Returns:
        dict con resultado del retry
    """
    logger.info(
        "Ejecutando retry de transcripcion",
        session_id=session_id,
        attempt=attempt,
    )

    try:
        result = asyncio.run(_async_retry(uuid.UUID(session_id), attempt))
        return result
    except Exception as exc:
        logger.error(
            "Retry de transcripcion fallo",
            session_id=session_id,
            attempt=attempt,
            error=str(exc),
        )
        raise


async def _async_retry(session_id: uuid.UUID, attempt: int) -> dict:
    """Ejecuta el retry de forma async con su propia session de BD."""
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.config import get_settings
    from app.sessions.google_meet import extract_transcript_from_doc, find_meet_transcript_doc
    from app.sessions.models import (
        Session,
        SessionTranscript,
        TranscriptSource,
    )
    from app.sessions.service import MAX_TRANSCRIPT_RETRIES, _enqueue_ai_analysis, _enqueue_transcript_retry

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
            # 1. Cargar sesion
            result = await db.execute(
                select(Session).where(Session.id == session_id)
            )
            session = result.scalar_one_or_none()

            if not session:
                return {"status": "error", "message": f"Sesion {session_id} no encontrada"}

            if not session.google_meet_link:
                return {"status": "skip", "message": "Sesion sin link Meet"}

            # 2. Verificar que no se haya extraido ya
            existing = await db.execute(
                select(SessionTranscript).where(
                    SessionTranscript.session_id == session_id
                )
            )
            if existing.scalar_one_or_none():
                logger.info(
                    "Transcripcion ya existe, omitiendo retry",
                    session_id=str(session_id),
                )
                return {"status": "already_exists"}

            # 3. Intentar buscar documento
            meet_code = session.google_meet_link.rstrip("/").split("/")[-1]
            doc_id = find_meet_transcript_doc(meet_code=meet_code)

            if not doc_id:
                # Aun no disponible, encolar siguiente retry
                if attempt < MAX_TRANSCRIPT_RETRIES:
                    _enqueue_transcript_retry(session_id, attempt + 1)
                    return {
                        "status": "not_found",
                        "message": f"Transcripcion no disponible, reintento {attempt + 1} encolado",
                    }
                else:
                    logger.warning(
                        "Transcripcion no encontrada tras todos los reintentos",
                        session_id=str(session_id),
                        attempts=attempt,
                    )
                    return {
                        "status": "exhausted",
                        "message": f"Transcripcion no encontrada tras {attempt} reintentos",
                    }

            # 4. Extraer transcripcion
            transcript_data = extract_transcript_from_doc(google_docs_id=doc_id)

            transcript = SessionTranscript(
                session_id=session_id,
                google_docs_id=doc_id,
                full_text=transcript_data["full_text"],
                segments=transcript_data["segments"],
                word_count=transcript_data["word_count"],
                language="es",
                source=TranscriptSource.GOOGLE_MEET_AUTO,
            )
            db.add(transcript)
            await db.commit()

            # 5. Encolar analisis IA
            job_id = _enqueue_ai_analysis(session_id)

            logger.info(
                "Transcripcion extraida en retry",
                session_id=str(session_id),
                attempt=attempt,
                word_count=transcript_data["word_count"],
                ai_job_id=job_id,
            )

            return {
                "status": "success",
                "attempt": attempt,
                "word_count": transcript_data["word_count"],
                "ai_job_id": job_id,
            }

    finally:
        await engine.dispose()
