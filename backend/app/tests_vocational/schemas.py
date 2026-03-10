"""
Vocari Backend - Schemas de Tests Vocacionales (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RIASECScores(BaseModel):
    """Puntajes RIASEC (6-30 cada dimension)."""

    R: int = Field(..., ge=0, le=30, description="Realista")
    I: int = Field(..., ge=0, le=30, description="Investigador")
    A: int = Field(..., ge=0, le=30, description="Artistico")
    S: int = Field(..., ge=0, le=30, description="Social")
    E: int = Field(..., ge=0, le=30, description="Emprendedor")
    C: int = Field(..., ge=0, le=30, description="Convencional")


class TestResultCreate(BaseModel):
    """Schema para guardar resultado de un test RIASEC."""

    codigo_holland: str = Field(
        ..., min_length=3, max_length=6, description="Codigo Holland (ej: RIA)"
    )
    certeza: str = Field(..., description="Alta, Media o Exploratoria")
    puntajes: RIASECScores
    respuestas: dict[int, int] = Field(
        ..., description="Mapa pregunta_id -> valor (1-5)"
    )
    duracion_minutos: int = Field(..., ge=1, le=120, description="Duracion del test en minutos")


class TestResultResponse(BaseModel):
    """Schema de respuesta de un resultado de test."""

    id: uuid.UUID
    user_id: uuid.UUID
    institution_id: uuid.UUID | None = None
    test_type: str
    scores: dict
    result_code: str | None
    certainty: float | None
    test_metadata: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class TestResultListResponse(BaseModel):
    """Schema de respuesta de lista de resultados."""

    items: list[TestResultResponse]
    total: int
    page: int
    per_page: int
