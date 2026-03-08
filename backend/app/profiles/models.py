"""
Vocari Backend - Modelo de StudentLongitudinalProfile.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin


class StudentLongitudinalProfile(UUIDPrimaryKeyMixin, Base):
    """Perfil longitudinal del estudiante que agrega datos de multiples fuentes."""

    __tablename__ = "student_longitudinal_profiles"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skills: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    interests: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    learning_patterns: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    happiness_indicators: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    career_recommendations: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    riasec_history: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    data_sources: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<StudentLongitudinalProfile student_id={self.student_id}>"
