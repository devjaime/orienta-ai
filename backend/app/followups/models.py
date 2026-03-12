"""Modelos de seguimiento automático (D0/D7/D21)."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class FollowupChannel(enum.StrEnum):
    EMAIL = "email"
    IN_APP = "in_app"


class FollowupStatus(enum.StrEnum):
    SCHEDULED = "scheduled"
    SENT = "sent"
    FAILED = "failed"
    CANCELED = "canceled"


class FollowupEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "followup_events"

    lead_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    student_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    journey_step: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    channel: Mapped[FollowupChannel] = mapped_column(
        Enum(FollowupChannel, name="followup_channel", create_constraint=True),
        nullable=False,
        default=FollowupChannel.EMAIL,
    )
    status: Mapped[FollowupStatus] = mapped_column(
        Enum(FollowupStatus, name="followup_status", create_constraint=True),
        nullable=False,
        default=FollowupStatus.SCHEDULED,
        index=True,
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

