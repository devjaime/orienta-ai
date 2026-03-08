"""
Vocari Backend - Modelos de Session: Session, SessionRecording, SessionTranscript, SessionAIAnalysis.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin


class SessionStatus(str, enum.Enum):
    """Estados posibles de una sesion."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class RecordingStatus(str, enum.Enum):
    """Estados de la grabacion de una sesion."""

    AVAILABLE = "available"
    DOWNLOADING = "downloading"
    DOWNLOADED = "downloaded"
    DELETED = "deleted"


class TranscriptSource(str, enum.Enum):
    """Fuente de la transcripcion."""

    GOOGLE_MEET_AUTO = "google_meet_auto"
    MANUAL = "manual"
    WHISPER = "whisper"


class Session(UUIDPrimaryKeyMixin, Base):
    """Modelo de sesion de orientacion."""

    __tablename__ = "sessions"

    institution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    orientador_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status", create_constraint=True),
        nullable=False,
        default=SessionStatus.SCHEDULED,
    )
    google_calendar_event_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    google_meet_link: Mapped[str | None] = mapped_column(String(512), nullable=True)
    notes_by_student: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Session {self.id} status={self.status.value}>"


class SessionRecording(UUIDPrimaryKeyMixin, Base):
    """Grabacion de una sesion de orientacion."""

    __tablename__ = "session_recordings"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    google_drive_file_id: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[RecordingStatus] = mapped_column(
        Enum(RecordingStatus, name="recording_status", create_constraint=True),
        nullable=False,
        default=RecordingStatus.AVAILABLE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<SessionRecording session_id={self.session_id}>"


class SessionTranscript(UUIDPrimaryKeyMixin, Base):
    """Transcripcion de una sesion de orientacion."""

    __tablename__ = "session_transcripts"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    google_docs_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_text: Mapped[str] = mapped_column(Text, nullable=False)
    segments: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="es")
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[TranscriptSource] = mapped_column(
        Enum(TranscriptSource, name="transcript_source", create_constraint=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<SessionTranscript session_id={self.session_id}>"


class SessionAIAnalysis(UUIDPrimaryKeyMixin, Base):
    """Analisis de IA de una sesion de orientacion."""

    __tablename__ = "session_ai_analyses"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    interests_detected: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    skills_detected: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    emotional_sentiment: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    suggested_tests: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    suggested_games: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    tokens_used: Mapped[int] = mapped_column(Integer, nullable=False)
    processing_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    reviewed_by_orientador: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    orientador_edits: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<SessionAIAnalysis session_id={self.session_id}>"
