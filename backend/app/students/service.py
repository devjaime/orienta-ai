"""
Vocari Backend - Servicio de recomendaciones de siguiente accion para estudiantes.
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.games.models import Game, GameResult
from app.leads.models import Lead
from app.students.schemas import NextActionItem
from app.tests_vocational.models import TestResult


def _game_slug_by_holland(holland_code: str | None, available_slugs: Sequence[str]) -> str | None:
    if not available_slugs:
        return None

    first = (holland_code or "").strip()[:1].upper()
    preferred_map = {
        "R": "torre-decisiones",
        "I": "mapa-intereses",
        "A": "mapa-intereses",
        "S": "mapa-intereses",
        "E": "simulador-carrera",
        "C": "simulador-carrera",
    }
    preferred = preferred_map.get(first)
    if preferred and preferred in available_slugs:
        return preferred
    if "mapa-intereses" in available_slugs:
        return "mapa-intereses"
    return available_slugs[0]


def _dedupe_actions(actions: list[NextActionItem]) -> list[NextActionItem]:
    seen: set[tuple[str, str]] = set()
    unique: list[NextActionItem] = []
    for action in actions:
        key = (action.action_type, action.target_url)
        if key in seen:
            continue
        seen.add(key)
        unique.append(action)
    return unique


async def get_next_actions_for_user(
    db: AsyncSession,
    user: User,
) -> list[NextActionItem]:
    """Genera una lista corta de siguientes acciones segun estado del estudiante."""
    latest_test_result = await db.execute(
        select(TestResult)
        .where(TestResult.user_id == user.id, TestResult.test_type == "riasec")
        .order_by(TestResult.created_at.desc())
        .limit(1)
    )
    riasec = latest_test_result.scalar_one_or_none()
    holland_code = (riasec.result_code if riasec else "") or ""

    game_count_result = await db.execute(
        select(func.count(GameResult.id)).where(GameResult.student_id == user.id)
    )
    games_completed = int(game_count_result.scalar() or 0)

    available_games_result = await db.execute(
        select(Game.slug).where(Game.is_active == True).order_by(Game.name)
    )
    available_slugs = [row[0] for row in available_games_result.all()]
    suggested_game_slug = _game_slug_by_holland(holland_code, available_slugs)

    latest_clarity_result = await db.execute(
        select(Lead.clarity_score)
        .where(Lead.email == user.email, Lead.clarity_score.is_not(None))
        .order_by(Lead.created_at.desc())
        .limit(1)
    )
    clarity_score = latest_clarity_result.scalar_one_or_none()

    actions: list[NextActionItem] = []

    if not riasec:
        actions.extend(
            [
                NextActionItem(
                    action_type="test",
                    target_url="/estudiante/tests",
                    label="Realizar test RIASEC",
                    reason="Aun no tienes un perfil vocacional base para personalizar recomendaciones.",
                    priority=1,
                ),
                NextActionItem(
                    action_type="chat",
                    target_url="/estudiante/orientador-virtual",
                    label="Hablar con Valeria",
                    reason="Valeria puede prepararte para interpretar mejor tu resultado del test.",
                    priority=2,
                ),
            ]
        )
        if suggested_game_slug:
            actions.append(
                NextActionItem(
                    action_type="game",
                    target_url=f"/estudiante/juegos/{suggested_game_slug}",
                    label="Explorar juego recomendado",
                    reason="Un juego inicial te ayuda a detectar habilidades antes de decidir.",
                    priority=3,
                )
            )
        return _dedupe_actions(actions)

    if clarity_score is not None and clarity_score <= 2:
        if suggested_game_slug:
            actions.append(
                NextActionItem(
                    action_type="game",
                    target_url=f"/estudiante/juegos/{suggested_game_slug}",
                    label="Jugar para ganar claridad",
                    reason="Tu nivel de claridad es bajo; un juego guiado ayuda a destrabar decisiones.",
                    priority=1,
                )
            )
        actions.extend(
            [
                NextActionItem(
                    action_type="chat",
                    target_url="/estudiante/orientador-virtual",
                    label="Profundizar con Valeria",
                    reason="Valeria puede ayudarte a traducir tus dudas en pasos concretos.",
                    priority=2,
                ),
                NextActionItem(
                    action_type="careers",
                    target_url="/estudiante/carreras",
                    label="Comparar carreras",
                    reason="Comparar opciones reduce la indecision y mejora tu criterio.",
                    priority=3,
                ),
            ]
        )
        return _dedupe_actions(actions)

    if games_completed == 0:
        if suggested_game_slug:
            actions.append(
                NextActionItem(
                    action_type="game",
                    target_url=f"/estudiante/juegos/{suggested_game_slug}",
                    label="Comenzar juego recomendado",
                    reason="Con tu perfil RIASEC, este juego entrega senales utiles de habilidades.",
                    priority=1,
                )
            )
        actions.extend(
            [
                NextActionItem(
                    action_type="chat",
                    target_url="/estudiante/orientador-virtual",
                    label="Interpretar resultado con Valeria",
                    reason="Valeria te ayuda a unir test + habilidades en un plan simple.",
                    priority=2,
                ),
                NextActionItem(
                    action_type="careers",
                    target_url="/estudiante/carreras",
                    label="Explorar carreras compatibles",
                    reason="Ya tienes base RIASEC, ahora conviene contrastar carreras reales.",
                    priority=3,
                ),
            ]
        )
        return _dedupe_actions(actions)

    if games_completed >= 2:
        actions.extend(
            [
                NextActionItem(
                    action_type="careers",
                    target_url="/estudiante/carreras",
                    label="Comparar tus opciones top",
                    reason="Con dos o mas juegos completados ya tienes datos para decidir mejor.",
                    priority=1,
                ),
                NextActionItem(
                    action_type="chat",
                    target_url="/estudiante/orientador-virtual",
                    label="Pedir plan de accion a Valeria",
                    reason="Valeria puede proponerte un siguiente paso concreto segun tus resultados.",
                    priority=2,
                ),
            ]
        )
        return _dedupe_actions(actions)

    if suggested_game_slug:
        actions.append(
            NextActionItem(
                action_type="game",
                target_url=f"/estudiante/juegos/{suggested_game_slug}",
                label="Continuar ruta de juegos",
                reason="Aun falta evidencia de habilidades para afinar la recomendacion.",
                priority=1,
            )
        )
    actions.extend(
        [
            NextActionItem(
                action_type="careers",
                target_url="/estudiante/carreras",
                label="Revisar carreras sugeridas",
                reason="Te permite convertir tus resultados en opciones academicas reales.",
                priority=2,
            ),
            NextActionItem(
                action_type="chat",
                target_url="/estudiante/orientador-virtual",
                label="Conversar siguiente paso",
                reason="Una conversacion corta puede ordenar tu ruta final.",
                priority=3,
            ),
        ]
    )
    return _dedupe_actions(actions)

