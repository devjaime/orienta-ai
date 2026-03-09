"""
Vocari Backend - Schemas de Games (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GameBase(BaseModel):
    """Schema base de juego."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: str
    skills_evaluated: list[str] = Field(default_factory=list)
    duration_minutes: int = Field(..., ge=1, le=60)
    difficulty: str = "medium"
    config: dict = Field(default_factory=dict)


class GameCreate(GameBase):
    """Schema para crear un juego (admin)."""

    pass


class GameResponse(GameBase):
    """Schema de respuesta de un juego."""

    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class GameListResponse(BaseModel):
    """Schema de respuesta de lista de juegos."""

    items: list[GameResponse]
    total: int


class GameMetrics(BaseModel):
    """Metricas capturadas durante un juego."""

    level: int = 1
    time_seconds: int = 0
    errors: int = 0
    hints_used: int = 0
    score: int = 0
    extra: dict = Field(default_factory=dict)


class GameResultCreate(BaseModel):
    """Schema para enviar resultado de un juego."""

    game_id: uuid.UUID
    metrics: GameMetrics
    skills_scores: dict[str, float] = Field(default_factory=dict)
    duration_seconds: int = Field(..., ge=0)


class GameResultResponse(BaseModel):
    """Schema de respuesta de un resultado de juego."""

    id: uuid.UUID
    game_id: uuid.UUID
    student_id: uuid.UUID
    institution_id: uuid.UUID
    metrics: dict
    skills_scores: dict
    duration_seconds: int
    created_at: datetime

    model_config = {"from_attributes": True}


class GameResultListResponse(BaseModel):
    """Schema de respuesta de lista de resultados de juegos."""

    items: list[GameResultResponse]
    total: int
    page: int
    per_page: int


class GameSessionStartResponse(BaseModel):
    """Respuesta al iniciar una sesion de juego."""

    session_id: uuid.UUID
    game: GameResponse
    started_at: datetime
