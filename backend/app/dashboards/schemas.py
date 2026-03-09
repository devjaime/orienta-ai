"""
Vocari Backend - Schemas de Dashboards (Pydantic).

Schemas de respuesta para los 5 dashboards por rol:
estudiante, orientador, apoderado, admin_colegio, super_admin.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# --- Schemas compartidos ---


class SessionSummary(BaseModel):
    """Resumen breve de una sesion para dashboards."""

    id: uuid.UUID
    scheduled_at: datetime
    status: str
    orientador_id: uuid.UUID
    student_id: uuid.UUID
    duration_minutes: int

    model_config = {"from_attributes": True}


class TestResultSummary(BaseModel):
    """Resumen breve de un resultado de test."""

    id: uuid.UUID
    test_type: str
    result_code: str | None
    certainty: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CareerSummary(BaseModel):
    """Resumen breve de una carrera recomendada."""

    id: uuid.UUID
    name: str
    area: str
    employability: float
    saturation_index: float

    model_config = {"from_attributes": True}


class ProfileSummary(BaseModel):
    """Resumen del perfil longitudinal de un estudiante."""

    student_id: uuid.UUID
    skills: dict = Field(default_factory=dict)
    interests: dict = Field(default_factory=dict)
    happiness_indicators: dict = Field(default_factory=dict)
    riasec_history: list = Field(default_factory=list)
    last_updated: datetime | None = None

    model_config = {"from_attributes": True}


class AIAnalysisSummary(BaseModel):
    """Resumen de un analisis IA de sesion."""

    id: uuid.UUID
    session_id: uuid.UUID
    summary: str
    reviewed_by_orientador: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard Estudiante ---


class StudentDashboardResponse(BaseModel):
    """Respuesta del dashboard de estudiante."""

    upcoming_sessions: list[SessionSummary] = Field(default_factory=list)
    pending_tests: int = 0
    recent_results: list[TestResultSummary] = Field(default_factory=list)
    profile_summary: ProfileSummary | None = None
    recommended_careers: list[CareerSummary] = Field(default_factory=list)
    total_sessions: int = 0
    total_tests: int = 0


# --- Dashboard Orientador ---


class WorkloadStats(BaseModel):
    """Estadisticas de carga de trabajo del orientador."""

    this_week: int = 0
    this_month: int = 0
    capacity: int = 40  # capacidad mensual por defecto


class StudentAlert(BaseModel):
    """Alerta sobre un estudiante."""

    student_id: uuid.UUID
    student_name: str
    alert_type: str
    message: str


class OrientadorDashboardResponse(BaseModel):
    """Respuesta del dashboard de orientador."""

    upcoming_sessions: list[SessionSummary] = Field(default_factory=list)
    students_assigned: int = 0
    recent_analyses: list[AIAnalysisSummary] = Field(default_factory=list)
    workload_stats: WorkloadStats = Field(default_factory=WorkloadStats)
    pending_reviews: int = 0
    alerts: list[StudentAlert] = Field(default_factory=list)


# --- Dashboard Apoderado ---


class ChildDashboardInfo(BaseModel):
    """Informacion de un hijo/a para el dashboard de apoderado."""

    student_id: uuid.UUID
    student_name: str
    student_email: str
    profile_summary: ProfileSummary | None = None
    recent_sessions: list[SessionSummary] = Field(default_factory=list)
    recent_tests: list[TestResultSummary] = Field(default_factory=list)
    happiness_indicator: float | None = None
    upcoming_sessions: list[SessionSummary] = Field(default_factory=list)


class ParentDashboardResponse(BaseModel):
    """Respuesta del dashboard de apoderado."""

    children: list[ChildDashboardInfo] = Field(default_factory=list)


# --- Dashboard Admin Colegio ---


class InstitutionStats(BaseModel):
    """Estadisticas de la institucion."""

    total_students: int = 0
    active_students: int = 0
    sessions_this_month: int = 0
    tests_completed_this_month: int = 0
    average_engagement: float = 0.0


class OrientadorWorkloadItem(BaseModel):
    """Estadisticas de carga de un orientador individual."""

    orientador_id: uuid.UUID
    orientador_name: str
    students_assigned: int = 0
    sessions_completed: int = 0
    workload_percentage: float = 0.0


class EngagementTrendItem(BaseModel):
    """Punto de datos de tendencia de engagement semanal."""

    week: str
    active_students: int = 0


class AdminDashboardResponse(BaseModel):
    """Respuesta del dashboard de admin de colegio."""

    institution_stats: InstitutionStats = Field(default_factory=InstitutionStats)
    orientador_stats: list[OrientadorWorkloadItem] = Field(default_factory=list)
    top_careers: list[CareerSummary] = Field(default_factory=list)
    engagement_trend: list[EngagementTrendItem] = Field(default_factory=list)


# --- Dashboard Super Admin ---


class PlatformStats(BaseModel):
    """Estadisticas globales de la plataforma."""

    total_institutions: int = 0
    active_institutions: int = 0
    total_users: int = 0
    total_students: int = 0
    total_sessions: int = 0
    total_tests: int = 0
    sessions_this_month: int = 0
    tests_this_month: int = 0


class InstitutionOverview(BaseModel):
    """Resumen de una institucion para super admin."""

    id: uuid.UUID
    name: str
    slug: str
    plan: str
    total_students: int = 0
    total_sessions: int = 0
    is_active: bool = True


class SuperAdminDashboardResponse(BaseModel):
    """Respuesta del dashboard de super admin."""

    platform_stats: PlatformStats = Field(default_factory=PlatformStats)
    active_institutions: list[InstitutionOverview] = Field(default_factory=list)
    recent_sessions_count: int = 0
    recent_tests_count: int = 0
