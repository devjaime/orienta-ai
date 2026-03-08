"""
Vocari Backend - Modelo de ConsentRecord.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin


class ConsentType(str, enum.Enum):
    """Tipos de consentimiento."""

    RECORDING = "recording"
    AI_PROCESSING = "ai_processing"
    DATA_STORAGE = "data_storage"


class ConsentMethod(str, enum.Enum):
    """Metodo de otorgamiento del consentimiento."""

    DIGITAL = "digital"
    PHYSICAL = "physical"


class ConsentRecord(UUIDPrimaryKeyMixin, Base):
    """Registro de consentimiento informado."""

    __tablename__ = "consent_records"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    granted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType, name="consent_type", create_constraint=True),
        nullable=False,
    )
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    method: Mapped[ConsentMethod] = mapped_column(
        Enum(ConsentMethod, name="consent_method", create_constraint=True),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<ConsentRecord student_id={self.student_id} type={self.consent_type.value}>"
