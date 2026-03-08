"""
Vocari Backend - Modelos de Careers: Career, CareerSimulation.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Career(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Modelo de carrera universitaria/tecnica."""

    __tablename__ = "careers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    area: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    holland_codes: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    salary_range: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    employability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    saturation_index: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    mineduc_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"<Career {self.name}>"


class CareerSimulation(UUIDPrimaryKeyMixin, Base):
    """Simulacion de un dia en una carrera generada por IA."""

    __tablename__ = "career_simulations"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("careers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    simulation_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ai_narrative: Mapped[str] = mapped_column(Text, nullable=False)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<CareerSimulation student_id={self.student_id} career_id={self.career_id}>"
