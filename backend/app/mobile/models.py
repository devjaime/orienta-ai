"""
Vocari Backend - Modelos del recorrido movil.
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON_DOCUMENT = JSON().with_variant(JSONB(), "postgresql")


class MobileGuest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Identidad recuperable de invitado movil."""

    __tablename__ = "mobile_guests"

    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    claimed_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LearningPath(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Catalogo versionado de recorridos."""

    __tablename__ = "learning_paths"

    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    audience: Mapped[str] = mapped_column(String(40), nullable=False, default="adult")
    version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class JourneyNode(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Nodo de un recorrido."""

    __tablename__ = "journey_nodes"
    __table_args__ = (
        UniqueConstraint("path_id", "slug", name="uq_journey_node_path_slug"),
    )

    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    node_type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    prerequisites: Mapped[list] = mapped_column(JSON_DOCUMENT, nullable=False, default=list)
    content_version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=6)


class UserJourney(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Progreso de un invitado o usuario sobre un recorrido."""

    __tablename__ = "user_journeys"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    guest_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mobile_guests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_node_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("journey_nodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="in_progress")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="America/Santiago")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class NodeAttempt(UUIDPrimaryKeyMixin, Base):
    """Intento de completar un nodo, idempotente."""

    __tablename__ = "node_attempts"
    __table_args__ = (
        UniqueConstraint("journey_id", "idempotency_key", name="uq_node_attempt_idempotency"),
    )

    journey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("journey_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    answers_json: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False, default=dict)
    result_json: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False, default=dict)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )


class XpLedger(UUIDPrimaryKeyMixin, Base):
    """Libro de XP canónico en servidor."""

    __tablename__ = "xp_ledger"
    __table_args__ = (
        UniqueConstraint("journey_id", "event_type", "event_id", name="uq_xp_ledger_event"),
    )

    journey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    event_id: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class UserStreak(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Racha flexible por recorrido."""

    __tablename__ = "user_streaks"
    __table_args__ = (UniqueConstraint("journey_id", name="uq_user_streak_journey"),)

    journey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="America/Santiago")
    current_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    freeze_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Achievement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Catalogo de logros conductuales."""

    __tablename__ = "achievements"

    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")


class UserAchievement(UUIDPrimaryKeyMixin, Base):
    """Asignacion auditable de un logro."""

    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("journey_id", "achievement_id", name="uq_user_achievement"),
    )

    journey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("achievements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class ActionPlanItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Accion verificable del plan de 30 dias."""

    __tablename__ = "action_plan_items"

    journey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    route_slug: Mapped[str | None] = mapped_column(String(80), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="pending")
    evidence_json: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False, default=dict)


class DevicePushToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Token de notificaciones, almacenado hasheado."""

    __tablename__ = "device_push_tokens"
    __table_args__ = (UniqueConstraint("token_hash", name="uq_device_push_token_hash"),)

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    guest_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mobile_guests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(16), nullable=False, default="es-CL")
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
