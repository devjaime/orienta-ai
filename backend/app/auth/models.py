"""
Vocari Backend - Modelos de Auth: User, UserProfile, ParentStudentLink.
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    """Roles de usuario en la plataforma."""

    ESTUDIANTE = "estudiante"
    APODERADO = "apoderado"
    ORIENTADOR = "orientador"
    ADMIN_COLEGIO = "admin_colegio"
    SUPER_ADMIN = "super_admin"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Modelo de usuario."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_constraint=True),
        nullable=False,
        default=UserRole.ESTUDIANTE,
    )
    institution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relaciones
    profile: Mapped["UserProfile | None"] = relationship(
        "UserProfile", back_populates="user", uselist=False, lazy="selectin"
    )
    institution: Mapped["app.institutions.models.Institution | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Institution", back_populates="users", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"


class UserProfile(UUIDPrimaryKeyMixin, Base):
    """Perfil extendido del usuario."""

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    additional_info: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    user: Mapped[User] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile user_id={self.user_id}>"


class ParentStudentLink(UUIDPrimaryKeyMixin, Base):
    """Vinculo apoderado-estudiante."""

    __tablename__ = "parent_student_links"

    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    parent: Mapped[User] = relationship("User", foreign_keys=[parent_id])
    student: Mapped[User] = relationship("User", foreign_keys=[student_id])

    def __repr__(self) -> str:
        return f"<ParentStudentLink parent={self.parent_id} student={self.student_id}>"
