"""
Vocari Backend - Modelo de Leads.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Lead(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Lead capturado desde landings y flujos de test."""

    __tablename__ = "leads"

    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    interes: Mapped[str] = mapped_column(String(100), nullable=False, default="carreras")
    source: Mapped[str] = mapped_column(String(100), nullable=False, default="web")
    share_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    holland_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    test_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    survey_response: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ai_report_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_report_generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)

    def __repr__(self) -> str:
        return f"<Lead {self.email} source={self.source}>"


class AIReport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Histórico auditable de informes IA por lead/estudiante."""

    __tablename__ = "ai_reports"

    student_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lead_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    report_text: Mapped[str] = mapped_column(Text, nullable=False)
    report_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    holland_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False, default="fallback-local")
    prompt_version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")
