"""
Vocari Backend - Schemas de Careers (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CareerResponse(BaseModel):
    """Schema de respuesta de una carrera."""

    id: uuid.UUID
    name: str
    area: str
    holland_codes: list[str]
    description: str
    salary_range: dict
    employability: float
    saturation_index: float
    mineduc_data: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CareerListResponse(BaseModel):
    """Schema de respuesta de lista de carreras."""

    items: list[CareerResponse]
    total: int
    page: int
    per_page: int


class CareerRecommendation(BaseModel):
    """Una recomendacion de carrera con score de compatibilidad."""

    career: CareerResponse
    match_score: float = Field(..., ge=0.0, le=100.0, description="Compatibilidad 0-100")
    match_reasons: list[str]


class CareerRecommendationsResponse(BaseModel):
    """Respuesta del endpoint de recomendaciones."""

    holland_code: str
    recommendations: list[CareerRecommendation]
    total_careers_analyzed: int


class CareerCreate(BaseModel):
    """Schema para crear una carrera (admin/super_admin)."""

    name: str = Field(..., min_length=2, max_length=255)
    area: str = Field(..., min_length=2, max_length=255)
    holland_codes: list[str] = Field(..., min_length=1)
    description: str = Field(..., min_length=10)
    salary_range: dict = Field(default_factory=dict)
    employability: float = Field(default=0.0, ge=0.0, le=1.0)
    saturation_index: float = Field(default=0.0, ge=0.0, le=1.0)
    mineduc_data: dict = Field(default_factory=dict)


class CareerUpdate(BaseModel):
    """Schema para actualizar una carrera."""

    name: str | None = None
    area: str | None = None
    holland_codes: list[str] | None = None
    description: str | None = None
    salary_range: dict | None = None
    employability: float | None = Field(default=None, ge=0.0, le=1.0)
    saturation_index: float | None = Field(default=None, ge=0.0, le=1.0)
    mineduc_data: dict | None = None
    is_active: bool | None = None
