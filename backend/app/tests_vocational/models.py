"""
Vocari Backend - Modelos de Tests Vocacionales: TestResult, AdaptiveQuestionnaire.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin


class AdaptiveQuestionnaireStatus(str, enum.Enum):
    """Estados del cuestionario adaptativo."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"


class TestResult(UUIDPrimaryKeyMixin, Base):
    """Resultado de un test vocacional."""

    __tablename__ = "test_results"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    test_type: Mapped[str] = mapped_column(String(100), nullable=False)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    scores: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    result_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    certainty: Mapped[float | None] = mapped_column(Float, nullable=True)
    test_metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<TestResult {self.id} type={self.test_type}>"


class AdaptiveQuestionnaire(UUIDPrimaryKeyMixin, Base):
    """Cuestionario adaptativo generado por IA post-sesion."""

    __tablename__ = "adaptive_questionnaires"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    questions: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    evaluation: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[AdaptiveQuestionnaireStatus] = mapped_column(
        Enum(
            AdaptiveQuestionnaireStatus,
            name="adaptive_questionnaire_status",
            create_constraint=True,
        ),
        nullable=False,
        default=AdaptiveQuestionnaireStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<AdaptiveQuestionnaire {self.id} status={self.status.value}>"
