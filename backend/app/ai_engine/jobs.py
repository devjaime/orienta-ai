"""
Vocari Backend - Job de Analisis IA (T3.5).

Funcion `transcript_analysis_job` que el rq worker ejecuta.

Flujo:
  1. Cargar sesion + transcripcion de BD (sync SQLAlchemy, rq es sync)
  2. Ejecutar TranscriptAnalysisPipeline (async via asyncio.run)
  3. Almacenar resultados en session_ai_analyses
  4. Registrar uso en ai_usage_logs
  5. Log de resultado

Referencia: specs/backend.md seccion 6.1, tasks/milestone-03-ai-engine.md T3.5
"""

from __future__ import annotations

import asyncio
import uuid

import structlog

logger = structlog.get_logger()


def transcript_analysis_job(session_id: str) -> dict:
    """
    Job principal de analisis IA para una sesion.

    Es invocado por rq (sincrono). Internamente corre el pipeline
    async via asyncio.run().

    Args:
        session_id: UUID de la sesion (como string, rq serializa primitivos)

    Returns:
        dict con resultado del job
    """
    logger.info("Iniciando job de analisis IA", session_id=session_id)

    try:
        result = asyncio.run(_async_analysis(uuid.UUID(session_id)))
        return result
    except Exception as exc:
        logger.error(
            "Job de analisis IA fallo",
            session_id=session_id,
            error=str(exc),
            exc_info=True,
        )
        # Registrar error en BD si es posible
        try:
            asyncio.run(_log_job_error(uuid.UUID(session_id), str(exc)))
        except Exception:
            pass
        raise


async def _async_analysis(session_id: uuid.UUID) -> dict:
    """
    Ejecuta el pipeline completo de analisis de forma async.

    Crea su propio engine/session ya que rq corre en proceso separado.
    """
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.ai_engine.cost_tracking import log_ai_usage
    from app.ai_engine.pipelines import TranscriptAnalysisPipeline
    from app.config import get_settings
    from app.sessions.models import (
        Session,
        SessionAIAnalysis,
        SessionTranscript,
    )

    settings = get_settings()

    # Crear engine local (el worker es un proceso separado, no comparte el del API)
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
            # ----- 1. Cargar sesion y transcripcion -----
            session_result = await db.execute(
                select(Session).where(Session.id == session_id)
            )
            session = session_result.scalar_one_or_none()

            if not session:
                raise ValueError(f"Sesion {session_id} no encontrada")

            transcript_result = await db.execute(
                select(SessionTranscript).where(
                    SessionTranscript.session_id == session_id
                )
            )
            transcript = transcript_result.scalar_one_or_none()

            if not transcript:
                raise ValueError(
                    f"Transcripcion no disponible para sesion {session_id}"
                )

            logger.info(
                "Datos cargados para analisis",
                session_id=str(session_id),
                word_count=transcript.word_count,
            )

            # ----- 2. Ejecutar pipeline -----
            pipeline = TranscriptAnalysisPipeline()
            pipeline_result = await pipeline.run(
                transcript_text=transcript.full_text,
                session_date=str(session.scheduled_at.date()) if session.scheduled_at else "",
                duration_minutes=session.duration_minutes,
                student_grade="",  # TODO: obtener del perfil del estudiante
            )

            if not pipeline_result.success:
                error_msg = "; ".join(pipeline_result.errors) or "Pipeline sin resumen"
                raise RuntimeError(f"Pipeline fallo: {error_msg}")

            # ----- 3. Almacenar resultados en session_ai_analyses -----
            # Verificar si ya existe un analisis previo
            existing_result = await db.execute(
                select(SessionAIAnalysis).where(
                    SessionAIAnalysis.session_id == session_id
                )
            )
            existing = existing_result.scalar_one_or_none()

            if existing:
                # Actualizar analisis existente
                existing.summary = pipeline_result.summary
                existing.interests_detected = pipeline_result.interests
                existing.skills_detected = pipeline_result.skills
                existing.emotional_sentiment = pipeline_result.sentiment
                existing.suggested_tests = pipeline_result.suggested_tests
                existing.suggested_games = pipeline_result.suggested_games
                existing.model_used = pipeline_result.primary_model
                existing.tokens_used = pipeline_result.total_tokens
                existing.processing_time_seconds = pipeline_result.processing_time_seconds
                existing.reviewed_by_orientador = False

                logger.info(
                    "Analisis IA actualizado",
                    session_id=str(session_id),
                )
            else:
                # Crear nuevo analisis
                analysis = SessionAIAnalysis(
                    session_id=session_id,
                    summary=pipeline_result.summary,
                    interests_detected=pipeline_result.interests,
                    skills_detected=pipeline_result.skills,
                    emotional_sentiment=pipeline_result.sentiment,
                    suggested_tests=pipeline_result.suggested_tests,
                    suggested_games=pipeline_result.suggested_games,
                    model_used=pipeline_result.primary_model,
                    tokens_used=pipeline_result.total_tokens,
                    processing_time_seconds=pipeline_result.processing_time_seconds,
                    reviewed_by_orientador=False,
                )
                db.add(analysis)

                logger.info(
                    "Analisis IA creado",
                    session_id=str(session_id),
                )

            # ----- 4. Registrar uso de IA -----
            for llm_response in pipeline_result.llm_responses:
                await log_ai_usage(
                    db,
                    response=llm_response,
                    pipeline_name=_infer_pipeline_name(llm_response, pipeline_result),
                    session_id=session_id,
                    institution_id=session.institution_id,
                )

            await db.commit()

            # ----- 5. Resultado del job -----
            job_result = {
                "session_id": str(session_id),
                "success": True,
                "summary_length": len(pipeline_result.summary),
                "interests_count": len(pipeline_result.interests),
                "skills_count": len(pipeline_result.skills),
                "total_tokens": pipeline_result.total_tokens,
                "total_cost_usd": round(pipeline_result.total_cost_usd, 5),
                "processing_time_seconds": round(pipeline_result.processing_time_seconds, 2),
                "errors": pipeline_result.errors,
            }

            logger.info(
                "Job de analisis IA completado",
                **job_result,
            )

            return job_result

    finally:
        await engine.dispose()


async def _log_job_error(session_id: uuid.UUID, error_message: str) -> None:
    """Registra un error de job en ai_usage_logs."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.ai_engine.cost_tracking import log_ai_error
    from app.config import get_settings
    from app.sessions.models import Session

    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_size=1)
    session_factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with session_factory() as db:
            # Intentar obtener institution_id
            from sqlalchemy import select

            result = await db.execute(
                select(Session.institution_id).where(Session.id == session_id)
            )
            institution_id = result.scalar_one_or_none()

            await log_ai_error(
                db,
                pipeline_name="transcript_analysis",
                model_requested="unknown",
                error_message=error_message,
                session_id=session_id,
                institution_id=institution_id,
            )
            await db.commit()
    finally:
        await engine.dispose()


def _infer_pipeline_name(
    response: "LLMResponse",
    pipeline_result: "PipelineResult",
) -> str:
    """
    Infiere el nombre del pipeline basado en la posicion del response
    en la lista de responses del pipeline.
    """
    from app.ai_engine.pipelines import PipelineResult

    responses = pipeline_result.llm_responses
    try:
        idx = responses.index(response)
    except ValueError:
        return "unknown"

    # El orden es: summary(0), interests(1), skills(2), sentiment(3), suggestions(4)
    names = [
        "session_summary",
        "interest_detection",
        "skills_detection",
        "sentiment_analysis",
        "test_game_suggestions",
    ]
    if idx < len(names):
        return names[idx]
    return "unknown"
