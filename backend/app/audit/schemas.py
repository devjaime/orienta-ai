"""
Vocari Backend - Schemas de Audit Log (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AuditLogCreate(BaseModel):
    """Schema para crear un registro de auditoria (uso interno)."""

    user_id: uuid.UUID
    institution_id: uuid.UUID | None = None
    action: str = Field(..., min_length=1, max_length=255)
    resource_type: str = Field(..., min_length=1, max_length=100)
    resource_id: uuid.UUID | None = None
    details: dict = Field(default_factory=dict)
    ip_address: str = "0.0.0.0"


class AuditLogResponse(BaseModel):
    """Schema de respuesta de un registro de auditoria."""

    id: uuid.UUID
    user_id: uuid.UUID
    institution_id: uuid.UUID | None
    action: str
    resource_type: str
    resource_id: uuid.UUID | None
    details: dict
    ip_address: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Schema de respuesta de lista de registros de auditoria."""

    items: list[AuditLogResponse]
    total: int
    page: int
    per_page: int
