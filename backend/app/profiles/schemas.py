"""
Vocari Backend - Schemas de Profiles (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SkillsData(BaseModel):
    """Datos de habilidades del estudiante."""

    analiticas: float = Field(default=0.0, ge=0.0, le=10.0)
    creativas: float = Field(default=0.0, ge=0.0, le=10.0)
    sociales: float = Field(default=0.0, ge=0.0, le=10.0)
    practicas: float = Field(default=0.0, ge=0.0, le=10.0)
    liderazgo: float = Field(default=0.0, ge=0.0, le=10.0)
    organizacion: float = Field(default=0.0, ge=0.0, le=10.0)


class HappinessIndicators(BaseModel):
    """Indicadores de bienestar/felicidad del estudiante."""

    nivel_general: float = Field(default=0.0, ge=0.0, le=10.0)
    motivacion_academica: float = Field(default=0.0, ge=0.0, le=10.0)
    claridad_vocacional: float = Field(default=0.0, ge=0.0, le=10.0)
    satisfaccion_orientacion: float = Field(default=0.0, ge=0.0, le=10.0)
    ultima_actualizacion: str | None = None


class ProfileUpdate(BaseModel):
    """Schema para actualizar parcialmente el perfil longitudinal."""

    skills: SkillsData | None = None
    interests: dict | None = None
    learning_patterns: dict | None = None
    happiness_indicators: HappinessIndicators | None = None


class ProfileResponse(BaseModel):
    """Schema de respuesta del perfil longitudinal."""

    id: uuid.UUID
    student_id: uuid.UUID
    institution_id: uuid.UUID
    skills: dict
    interests: dict
    learning_patterns: dict
    happiness_indicators: dict
    career_recommendations: list | dict
    riasec_history: list | dict
    data_sources: list | dict
    last_updated: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
