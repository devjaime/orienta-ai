"""
Vocari Backend - Cost Tracking y AI Usage Log (T3.9).

Registra tokens usados, modelo, costo estimado, latencia de cada llamada IA.
Provee funciones para loguear y consultar uso.

Referencia: specs/ai-engine.md seccion 9.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

import structlog

from app.ai_engine.openrouter_client import LLMResponse
from app.common.base_model import Base, UUIDPrimaryKeyMixin

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Modelo: ai_usage_log
# ---------------------------------------------------------------------------


class AIUsageLog(UUIDPrimaryKeyMixin, Base):
    """Registro de cada llamada a un LLM via OpenRouter."""

    __tablename__ = "ai_usage_logs"

    # Contexto
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    institution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    pipeline_name: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # ej: "session_summary", "interest_detection"
    prompt_version: Mapped[str] = mapped_column(
        String(20), nullable=False, default="1.0.0"
    )

    # LLM info
    model_requested: Mapped[str] = mapped_column(String(100), nullable=False)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Performance
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Status
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fallback_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cache_hit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    validation_retries: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<AIUsageLog pipeline={self.pipeline_name} "
            f"model={self.model_used} cost=${self.cost_usd:.5f}>"
        )


# ---------------------------------------------------------------------------
# Servicio de logging
# ---------------------------------------------------------------------------


async def log_ai_usage(
    db: AsyncSession,
    *,
    response: LLMResponse,
    pipeline_name: str,
    prompt_version: str = "1.0.0",
    model_requested: str | None = None,
    session_id: uuid.UUID | None = None,
    institution_id: uuid.UUID | None = None,
    validation_retries: int = 0,
    error_message: str | None = None,
) -> AIUsageLog:
    """
    Registra una llamada LLM en la tabla ai_usage_logs.

    Args:
        db: Sesion de BD async
        response: LLMResponse del cliente OpenRouter
        pipeline_name: Nombre del pipeline (ej: "session_summary")
        prompt_version: Version del prompt template
        model_requested: Modelo que se solicito (puede diferir del usado si hubo fallback)
        session_id: ID de la sesion de orientacion (si aplica)
        institution_id: ID de la institucion
        validation_retries: Numero de reintentos por validacion fallida
        error_message: Mensaje de error si fallo
    """
    entry = AIUsageLog(
        session_id=session_id,
        institution_id=institution_id,
        pipeline_name=pipeline_name,
        prompt_version=prompt_version,
        model_requested=model_requested or response.model_used,
        model_used=response.model_used,
        input_tokens=response.input_tokens,
        output_tokens=response.output_tokens,
        total_tokens=response.total_tokens,
        latency_ms=response.latency_ms,
        cost_usd=response.cost_usd,
        success=error_message is None,
        fallback_used=response.fallback_used,
        cache_hit=response.cache_hit,
        validation_retries=validation_retries,
        error_message=error_message[:500] if error_message else None,
    )
    db.add(entry)

    logger.info(
        "AI usage registrado",
        pipeline=pipeline_name,
        model=response.model_used,
        tokens=response.total_tokens,
        cost_usd=round(response.cost_usd, 5),
        latency_ms=round(response.latency_ms, 1),
        fallback=response.fallback_used,
        cache_hit=response.cache_hit,
    )

    return entry


async def log_ai_error(
    db: AsyncSession,
    *,
    pipeline_name: str,
    model_requested: str,
    error_message: str,
    session_id: uuid.UUID | None = None,
    institution_id: uuid.UUID | None = None,
    latency_ms: float = 0.0,
) -> AIUsageLog:
    """Registra un error en una llamada LLM."""
    entry = AIUsageLog(
        session_id=session_id,
        institution_id=institution_id,
        pipeline_name=pipeline_name,
        prompt_version="1.0.0",
        model_requested=model_requested,
        model_used=model_requested,
        input_tokens=0,
        output_tokens=0,
        total_tokens=0,
        latency_ms=latency_ms,
        cost_usd=0.0,
        success=False,
        fallback_used=False,
        cache_hit=False,
        validation_retries=0,
        error_message=error_message[:500],
    )
    db.add(entry)

    logger.warning(
        "AI error registrado",
        pipeline=pipeline_name,
        model=model_requested,
        error=error_message[:200],
    )

    return entry


# ---------------------------------------------------------------------------
# Consultas de uso (para dashboard super-admin)
# ---------------------------------------------------------------------------


async def get_daily_cost(
    db: AsyncSession,
    date: datetime,
    institution_id: uuid.UUID | None = None,
) -> float:
    """Retorna el costo total IA de un dia."""
    query = select(func.coalesce(func.sum(AIUsageLog.cost_usd), 0.0)).where(
        func.date(AIUsageLog.created_at) == date.date()
    )
    if institution_id:
        query = query.where(AIUsageLog.institution_id == institution_id)

    result = await db.execute(query)
    return float(result.scalar() or 0.0)


async def get_session_cost(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> float:
    """Retorna el costo total IA de procesar una sesion."""
    query = select(func.coalesce(func.sum(AIUsageLog.cost_usd), 0.0)).where(
        AIUsageLog.session_id == session_id
    )
    result = await db.execute(query)
    return float(result.scalar() or 0.0)
