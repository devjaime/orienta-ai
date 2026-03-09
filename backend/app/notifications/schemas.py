"""
Vocari Backend - Schemas de Notifications (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.notifications.models import NotificationType


class NotificationCreate(BaseModel):
    """Schema para crear una notificacion (uso interno)."""

    user_id: uuid.UUID
    notification_type: NotificationType = NotificationType.GENERAL
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    extra_data: dict = Field(default_factory=dict)

class NotificationResponse(BaseModel):
    """Schema de respuesta de una notificacion."""

    id: uuid.UUID
    user_id: uuid.UUID
    notification_type: NotificationType
    title: str
    message: str
    is_read: bool
    extra_data: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Schema de respuesta de lista de notificaciones."""

    items: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    per_page: int


class MarkReadRequest(BaseModel):
    """Schema para marcar notificaciones como leidas."""

    notification_ids: list[uuid.UUID] = Field(..., min_length=1, max_length=100)
