"""
Vocari Backend - Modelo de Notification.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin


class NotificationType(str, enum.Enum):
    """Tipos de notificacion."""

    SESSION_SCHEDULED = "session_scheduled"
    SESSION_REMINDER = "session_reminder"
    SESSION_COMPLETED = "session_completed"
    AI_ANALYSIS_READY = "ai_analysis_ready"
    TEST_COMPLETED = "test_completed"
    CONSENT_REQUIRED = "consent_required"
    PARENT_LINK_REQUEST = "parent_link_request"
    PARENT_LINK_VERIFIED = "parent_link_verified"
    GENERAL = "general"
    SYSTEM = "system"


class Notification(UUIDPrimaryKeyMixin, Base):
    """Notificacion para un usuario."""

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", create_constraint=True),
        nullable=False,
        default=NotificationType.GENERAL,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Notification {self.id} type={self.notification_type.value} read={self.is_read}>"
