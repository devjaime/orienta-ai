"""
Vocari Backend - Schemas de Institutions (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.institutions.models import InstitutionPlan


class InstitutionCreate(BaseModel):
    """Schema para crear una institucion."""

    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    domain: str | None = None
    plan: InstitutionPlan = InstitutionPlan.FREE
    max_students: int = Field(default=50, ge=1, le=10000)


class InstitutionUpdate(BaseModel):
    """Schema para actualizar una institucion."""

    name: str | None = None
    domain: str | None = None
    plan: InstitutionPlan | None = None
    max_students: int | None = Field(default=None, ge=1, le=10000)
    is_active: bool | None = None


class InstitutionResponse(BaseModel):
    """Schema de respuesta de una institucion."""

    id: uuid.UUID
    name: str
    slug: str
    domain: str | None
    plan: InstitutionPlan
    max_students: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InstitutionListResponse(BaseModel):
    """Schema de respuesta de lista de instituciones."""

    items: list[InstitutionResponse]
    total: int
    page: int
    per_page: int
