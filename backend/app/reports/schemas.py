"""
Vocari Backend - Schemas de Reports (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ReportData(BaseModel):
    """Datos incluidos en un reporte."""

    student_name: str
    student_email: str
    institution_name: str
    riasec_results: dict | None = None
    profile_summary: dict | None = None
    career_recommendations: list[dict] = Field(default_factory=list)
    game_results: list[dict] = Field(default_factory=list)
    session_history: list[dict] = Field(default_factory=list)


class ReportCreate(BaseModel):
    """Schema para crear un reporte."""

    report_type: str = "comprehensive"
    include_riasec: bool = True
    include_profile: bool = True
    include_careers: bool = True
    include_games: bool = True
    include_sessions: bool = True


class ReportResponse(BaseModel):
    """Schema de respuesta de un reporte."""

    id: uuid.UUID
    student_id: uuid.UUID
    report_type: str
    file_url: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    """Schema de respuesta de lista de reportes."""

    items: list[ReportResponse]
    total: int
    page: int
    per_page: int
