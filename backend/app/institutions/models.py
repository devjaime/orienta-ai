"""
Vocari Backend - Modelos de Institution.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class InstitutionPlan(str, enum.Enum):
    """Planes de suscripcion."""

    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"


class Institution(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Modelo de institucion educativa."""

    __tablename__ = "institutions"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_workspace_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    plan: Mapped[InstitutionPlan] = mapped_column(
        Enum(InstitutionPlan, name="institution_plan", create_constraint=True),
        nullable=False,
        default=InstitutionPlan.FREE,
    )
    max_students: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relaciones
    users: Mapped[list["app.auth.models.User"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="institution", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Institution {self.slug} ({self.plan.value})>"
