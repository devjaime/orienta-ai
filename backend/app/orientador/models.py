"""
Modelos de orientador: notas y tareas por estudiante.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AdvisorTaskStatus(enum.StrEnum):
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class AdvisorNote(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "advisor_notes"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    orientador_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)


class AdvisorTask(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "advisor_tasks"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    orientador_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[AdvisorTaskStatus] = mapped_column(
        Enum(AdvisorTaskStatus, name="advisor_task_status", create_constraint=True),
        nullable=False,
        default=AdvisorTaskStatus.PENDIENTE,
    )
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
