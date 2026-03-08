"""
Vocari Backend - Schemas de Sessions (Pydantic v2).

Cubre: agendamiento, transcripcion, analisis IA, grabacion.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.sessions.models import RecordingStatus, SessionStatus, TranscriptSource


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class SessionCreate(BaseModel):
    """Crear una nueva sesion (rol: estudiante)."""

    orientador_id: uuid.UUID
    preferred_datetime: datetime
    notes: str | None = Field(default=None, max_length=2000)


class SessionUpdate(BaseModel):
    """Actualizar una sesion existente."""

    scheduled_at: datetime | None = None
    notes_by_student: str | None = Field(default=None, max_length=2000)


class SessionCompleteRequest(BaseModel):
    """Marcar sesion como completada (rol: orientador)."""

    notes: str | None = Field(default=None, max_length=5000)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class SessionResponse(BaseModel):
    """Respuesta basica de una sesion."""

    id: uuid.UUID
    institution_id: uuid.UUID
    student_id: uuid.UUID
    orientador_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int
    status: SessionStatus
    google_meet_link: str | None
    notes_by_student: str | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionDetailResponse(SessionResponse):
    """Respuesta detallada incluyendo grabacion, transcripcion y analisis."""

    recording: RecordingResponse | None = None
    transcript: TranscriptSummaryResponse | None = None
    analysis: AnalysisSummaryResponse | None = None


class RecordingResponse(BaseModel):
    """Metadata de grabacion de sesion."""

    id: uuid.UUID
    session_id: uuid.UUID
    google_drive_file_id: str
    duration_seconds: int
    file_size_bytes: int
    status: RecordingStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptSegment(BaseModel):
    """Un segmento de transcripcion con speaker y timestamp."""

    speaker: str
    text: str
    timestamp: str


class TranscriptSummaryResponse(BaseModel):
    """Resumen de transcripcion (sin texto completo)."""

    id: uuid.UUID
    session_id: uuid.UUID
    language: str
    word_count: int
    source: TranscriptSource
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptFullResponse(TranscriptSummaryResponse):
    """Transcripcion completa con segmentos."""

    full_text: str
    segments: list[TranscriptSegment]


class AnalysisSummaryResponse(BaseModel):
    """Resumen del analisis IA."""

    id: uuid.UUID
    session_id: uuid.UUID
    model_used: str
    tokens_used: int
    processing_time_seconds: float
    reviewed_by_orientador: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class InterestDetected(BaseModel):
    """Un interes detectado por la IA."""

    interest: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str
    holland_category: str | None = None
    explicit: bool = True
    is_new: bool = True


class SkillDetected(BaseModel):
    """Una habilidad detectada por la IA."""

    skill: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str
    skill_type: str  # "hard" | "soft"
    level: str  # "basico" | "intermedio" | "avanzado"


class EmotionalSentiment(BaseModel):
    """Analisis de sentimiento emocional."""

    overall: str  # "positivo" | "neutro" | "negativo" | "mixto"
    score: float = Field(ge=-1.0, le=1.0)
    engagement: str  # "alto" | "medio" | "bajo"
    anxiety_indicators: list[str] = []
    motivation: str  # "alta" | "media" | "baja"
    key_moments: list[str] = []


class SuggestedTest(BaseModel):
    """Un test sugerido por la IA."""

    test_id: str
    test_name: str
    reason: str
    priority: str  # "alta" | "media" | "baja"


class SuggestedGame(BaseModel):
    """Un juego sugerido por la IA."""

    game_id: str
    game_name: str
    reason: str
    priority: str  # "alta" | "media" | "baja"


class AnalysisFullResponse(AnalysisSummaryResponse):
    """Analisis IA completo de la sesion."""

    summary: str
    interests_detected: list[InterestDetected]
    skills_detected: list[SkillDetected]
    emotional_sentiment: EmotionalSentiment
    suggested_tests: list[SuggestedTest]
    suggested_games: list[SuggestedGame]
    orientador_edits: dict | None = None


class SessionCompleteResponse(BaseModel):
    """Respuesta al completar una sesion."""

    session_id: uuid.UUID
    status: SessionStatus
    completed_at: datetime
    job_id: str | None = None  # ID del job de analisis IA encolado


# ---------------------------------------------------------------------------
# List response
# ---------------------------------------------------------------------------


class SessionListResponse(BaseModel):
    """Lista paginada de sesiones."""

    items: list[SessionResponse]
    total: int
    page: int
    per_page: int


class OrientadorListItem(BaseModel):
    """Orientador disponible para agendar sesion."""

    id: uuid.UUID
    name: str
    email: str

    model_config = {"from_attributes": True}


class OrientadorStatsResponse(BaseModel):
    """Estadisticas del dashboard del orientador."""

    sesiones_hoy: int = 0
    reviews_pendientes: int = 0
    estudiantes_asignados: int = 0
    alertas_activas: int = 0
