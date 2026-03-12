"""
Tests de integracion para endpoint de next actions del estudiante.
"""

from __future__ import annotations

import uuid

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.games.models import Game, GameDifficulty, GameResult
from app.institutions.models import Institution, InstitutionPlan
from app.sessions.models import Session  # noqa: F401
from app.tests_vocational.models import TestResult as _TestResultModel


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Next Actions",
        slug=f"colegio-next-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=100,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"student-next-{uuid.uuid4().hex[:8]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Next Actions",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


class TestStudentsNextActions:
    async def test_sin_riasec_prioriza_test(self, client, estudiante: User, auth_headers):
        response = await client.get(
            "/api/v1/students/me/next-actions",
            headers=auth_headers(estudiante),
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) >= 1
        assert body["items"][0]["action_type"] == "test"
        assert body["items"][0]["target_url"] == "/estudiante/tests"

    async def test_con_riasec_y_dos_juegos_prioriza_carreras(
        self,
        client,
        db_session: AsyncSession,
        institution: Institution,
        estudiante: User,
        auth_headers,
    ):
        test_result = _TestResultModel(
            user_id=estudiante.id,
            institution_id=institution.id,
            test_type="riasec",
            answers={},
            scores={"R": 12, "I": 10, "A": 8, "S": 6, "E": 4, "C": 2},
            result_code="RIA",
            certainty=0.8,
            test_metadata={},
        )
        game = Game(
            name="Mapa de Intereses",
            slug=f"mapa-intereses-{uuid.uuid4().hex[:6]}",
            description="Juego test",
            skills_evaluated=["autoconocimiento"],
            duration_minutes=5,
            difficulty=GameDifficulty.EASY,
            config={},
            is_active=True,
        )
        db_session.add_all([test_result, game])
        await db_session.flush()

        db_session.add_all(
            [
                GameResult(
                    game_id=game.id,
                    student_id=estudiante.id,
                    institution_id=institution.id,
                    metrics={"score": 80},
                    skills_scores={"autoconocimiento": 80},
                    duration_seconds=120,
                ),
                GameResult(
                    game_id=game.id,
                    student_id=estudiante.id,
                    institution_id=institution.id,
                    metrics={"score": 85},
                    skills_scores={"autoconocimiento": 85},
                    duration_seconds=110,
                ),
            ]
        )
        await db_session.commit()

        response = await client.get(
            "/api/v1/students/me/next-actions",
            headers=auth_headers(estudiante),
        )
        assert response.status_code == 200
        body = response.json()
        assert body["items"][0]["action_type"] == "careers"
        assert body["items"][0]["target_url"] == "/estudiante/carreras"
