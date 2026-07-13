"""
Vocari Backend - Modelos para reconversion vocacional de adultos.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSON, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AdultReconversionSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Sesion publica de reconversion vocacional para adulto."""

    __tablename__ = "adult_reconversion_sessions"

    share_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    profesion_actual: Mapped[str] = mapped_column(String(255), nullable=False)
    edad: Mapped[int] = mapped_column(Integer, nullable=False)
    pais: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ciudad: Mapped[str | None] = mapped_column(String(120), nullable=True)
    nivel_educativo: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ingreso_actual_aprox: Mapped[float | None] = mapped_column(Float, nullable=True)
    nivel_ingles: Mapped[str | None] = mapped_column(String(60), nullable=True)
    situacion_actual: Mapped[str | None] = mapped_column(String(120), nullable=True)
    disponibilidad_para_estudiar: Mapped[str | None] = mapped_column(String(120), nullable=True)
    disponibilidad_para_relocalizarse: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="in_progress")
    current_phase: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    summary_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class AdultReconversionPhaseResult(UUIDPrimaryKeyMixin, Base):
    """Resultado persistido por fase del flujo de reconversion."""

    __tablename__ = "adult_reconversion_phase_results"
    __table_args__ = (
        UniqueConstraint("session_id", "phase_key", name="uq_adult_reconversion_phase"),
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("adult_reconversion_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    phase_key: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    answers_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    derived_scores_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )


class AdultReconversionReport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Reporte final de reconversion vocacional."""

    __tablename__ = "adult_reconversion_reports"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("adult_reconversion_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    report_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    model_name: Mapped[str] = mapped_column(String(120), nullable=False, default="pending")
    prompt_version: Mapped[str] = mapped_column(String(40), nullable=False, default="adult-reconversion-v1")
