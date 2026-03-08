"""
Vocari Backend - Modelos de Games: Game, GameResult.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin


class GameDifficulty(str, enum.Enum):
    """Niveles de dificultad de un juego."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Game(UUIDPrimaryKeyMixin, Base):
    """Modelo de juego vocacional."""

    __tablename__ = "games"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills_evaluated: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty: Mapped[GameDifficulty] = mapped_column(
        Enum(GameDifficulty, name="game_difficulty", create_constraint=True),
        nullable=False,
        default=GameDifficulty.MEDIUM,
    )
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Game {self.slug}>"


class GameResult(UUIDPrimaryKeyMixin, Base):
    """Resultado de un juego vocacional."""

    __tablename__ = "game_results"

    game_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
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
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    skills_scores: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<GameResult game_id={self.game_id} student_id={self.student_id}>"
