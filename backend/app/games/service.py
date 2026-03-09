"""
Vocari Backend - Servicios de Games.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError, ValidationError
from app.games.models import Game, GameResult


async def list_games(db: AsyncSession, include_inactive: bool = False) -> list[Game]:
    """Lista todos los juegos disponibles."""
    stmt = select(Game)
    if not include_inactive:
        stmt = stmt.where(Game.is_active == True)
    stmt = stmt.order_by(Game.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_game_by_id(db: AsyncSession, game_id: uuid.UUID) -> Game:
    """Obtiene un juego por ID."""
    stmt = select(Game).where(Game.id == game_id)
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        raise NotFoundError(f"Juego no encontrado: {game_id}")
    return game


async def get_game_by_slug(db: AsyncSession, slug: str) -> Game:
    """Obtiene un juego por slug."""
    stmt = select(Game).where(Game.slug == slug)
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        raise NotFoundError(f"Juego no encontrado: {slug}")
    return game


async def create_game_result(
    db: AsyncSession,
    student_id: uuid.UUID,
    institution_id: uuid.UUID,
    game_id: uuid.UUID,
    metrics: dict[str, Any],
    skills_scores: dict[str, float],
    duration_seconds: int,
) -> GameResult:
    """Guarda el resultado de un juego."""
    game = await get_game_by_id(db, game_id)

    result = GameResult(
        game_id=game.id,
        student_id=student_id,
        institution_id=institution_id,
        metrics=metrics,
        skills_scores=skills_scores,
        duration_seconds=duration_seconds,
    )
    db.add(result)
    await db.commit()
    await db.refresh(result)

    return result


async def get_student_game_results(
    db: AsyncSession,
    student_id: uuid.UUID,
    game_id: uuid.UUID | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[GameResult], int]:
    """Obtiene los resultados de juegos de un estudiante."""
    stmt = select(GameResult).where(GameResult.student_id == student_id)
    if game_id:
        stmt = stmt.where(GameResult.game_id == game_id)
    stmt = stmt.order_by(GameResult.created_at.desc())

    count_stmt = select(GameResult).where(GameResult.student_id == student_id)
    if game_id:
        count_stmt = count_stmt.where(GameResult.game_id == game_id)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(stmt)
    return list(result.scalars().all()), total


def calculate_skills_scores(
    game_slug: str, metrics: dict[str, Any]
) -> dict[str, float]:
    """Calcula puntajes de habilidades basado en metricas del juego."""
    scores: dict[str, float] = {}

    if game_slug == "logic-puzzle":
        base_score = min(100, (metrics.get("score", 0) / 1000) * 100)
        errors_penalty = max(0, metrics.get("errors", 0) * 5)
        time_bonus = max(0, 20 - metrics.get("time_seconds", 0) / 60)
        scores["analytical_reasoning"] = max(0, min(100, base_score - errors_penalty + time_bonus))
        scores["problem_solving"] = max(0, min(100, base_score - errors_penalty))
        scores["persistence"] = max(0, min(100, 100 - errors_penalty * 2))

    elif game_slug == "pattern-recognition":
        base_score = min(100, metrics.get("score", 0))
        reaction_penalty = max(0, (metrics.get("avg_reaction_time", 5000) - 2000) / 100)
        scores["visual_perception"] = max(0, min(100, base_score + reaction_penalty))
        scores["processing_speed"] = max(0, min(100, 100 - reaction_penalty))
        scores["attention_to_detail"] = max(0, min(100, base_score - metrics.get("errors", 0) * 10))

    elif game_slug == "decision-simulator":
        scores["decision_making"] = min(100, metrics.get("score", 0))
        scores["risk_assessment"] = min(100, metrics.get("risk_score", 50))
        scores["ethical_judgment"] = min(100, metrics.get("ethics_score", 50))
        scores["leadership"] = min(100, metrics.get("leadership_score", 50))

    elif game_slug == "creativity-challenge":
        scores["creativity"] = min(100, metrics.get("originality_score", 50))
        scores["divergent_thinking"] = min(100, metrics.get("diversity_score", 50))
        scores["originality"] = min(100, metrics.get("novelty_score", 50))

    elif game_slug == "teamwork-scenario":
        scores["communication"] = min(100, metrics.get("communication_score", 50))
        scores["collaboration"] = min(100, metrics.get("collaboration_score", 50))
        scores["team_leadership"] = min(100, metrics.get("team_lead_score", 50))
        scores["conflict_resolution"] = min(100, metrics.get("conflict_score", 50))

    return scores


async def create_default_games(db: AsyncSession) -> None:
    """Crea los juegos por defecto si no existen."""
    default_games = [
        {
            "name": "Puzzle Logico",
            "slug": "logic-puzzle",
            "description": "Resuelve puzzles de logica y patrones para evaluar tu razonamiento analitico",
            "skills_evaluated": ["analytical_reasoning", "problem_solving", "persistence"],
            "duration_minutes": 10,
            "difficulty": "medium",
            "config": {"levels": 10, "time_per_level": 120},
        },
        {
            "name": "Reconocimiento de Patrones",
            "slug": "pattern-recognition",
            "description": "Identifica patrones visuales para evaluar tu velocidad de procesamiento",
            "skills_evaluated": ["visual_perception", "processing_speed", "attention_to_detail"],
            "duration_minutes": 8,
            "difficulty": "easy",
            "config": {"rounds": 20, "time_limit": 10},
        },
        {
            "name": "Simulador de Decisiones",
            "slug": "decision-simulator",
            "description": "Enfrenta escenarios de decision y evalua tu capacidad de eleccion",
            "skills_evaluated": ["decision_making", "risk_assessment", "ethical_judgment", "leadership"],
            "duration_minutes": 15,
            "difficulty": "hard",
            "config": {"scenarios": 8},
        },
        {
            "name": "Desafio Creativo",
            "slug": "creativity-challenge",
            "description": "Expresa tu creatividad con respuestas abiertas y originales",
            "skills_evaluated": ["creativity", "divergent_thinking", "originality"],
            "duration_minutes": 12,
            "difficulty": "easy",
            "config": {"prompts": 5, "time_per_prompt": 180},
        },
        {
            "name": "Escenario de Trabajo en Equipo",
            "slug": "teamwork-scenario",
            "description": "Colabora en escenarios simulados de trabajo en equipo",
            "skills_evaluated": ["communication", "collaboration", "team_leadership", "conflict_resolution"],
            "duration_minutes": 10,
            "difficulty": "medium",
            "config": {"scenarios": 6},
        },
    ]

    for game_data in default_games:
        stmt = select(Game).where(Game.slug == game_data["slug"])
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            continue

        game = Game(**game_data)
        db.add(game)

    await db.commit()
