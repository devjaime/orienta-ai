"""
Vocari Backend - Schemas de Parent-Student Linking (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LinkCreateRequest(BaseModel):
    """Solicitud de vinculacion apoderado-estudiante."""

    student_email: str = Field(..., description="Email del estudiante a vincular")


class LinkVerifyRequest(BaseModel):
    """Solicitud de verificacion de vinculo (por admin u orientador)."""

    link_id: uuid.UUID


class ParentStudentLinkResponse(BaseModel):
    """Respuesta de un vinculo apoderado-estudiante."""

    id: uuid.UUID
    parent_id: uuid.UUID
    student_id: uuid.UUID
    verified: bool
    created_at: datetime
    parent_name: str | None = None
    parent_email: str | None = None
    student_name: str | None = None
    student_email: str | None = None

    model_config = {"from_attributes": True}


class LinkListResponse(BaseModel):
    """Respuesta de lista de vinculos."""

    items: list[ParentStudentLinkResponse]
    total: int
