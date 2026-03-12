"""
Tests de integración para endpoints de orientador.
"""

import uuid

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.leads.models import Lead  # noqa: F401
from app.orientador.models import AdvisorNote, AdvisorTask  # noqa: F401
from app.sessions.models import Session  # noqa: F401
from app.tests_vocational.models import TestResult as _TestResultModel  # noqa: F401


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Orientador",
        slug=f"colegio-orientador-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def orientador(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="orientador.panel@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Orientador Panel",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="estudiante.panel@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante Panel",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


class TestOrientadorRouter:
    async def test_lista_estudiantes(
        self,
        client,
        db_session: AsyncSession,
        orientador: User,
        estudiante: User,
        auth_headers,
    ) -> None:
        db_session.add(
            Lead(
                nombre=estudiante.name,
                email=estudiante.email,
                source="test",
                share_token=f"token-{uuid.uuid4().hex[:10]}",
                holland_code="ISA",
                clarity_score=4.0,
            )
        )
        await db_session.flush()

        response = await client.get(
            "/api/v1/orientador/students",
            headers=auth_headers(orientador),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["email"] == estudiante.email for item in data["items"])

    async def test_crea_nota_y_tarea(
        self,
        client,
        orientador: User,
        estudiante: User,
        auth_headers,
    ) -> None:
        note_res = await client.post(
            f"/api/v1/orientador/students/{estudiante.id}/notes",
            json={"note": "Caso con indecisión vocacional"},
            headers=auth_headers(orientador),
        )
        assert note_res.status_code == 201
        note_data = note_res.json()
        assert note_data["student_id"] == str(estudiante.id)

        task_res = await client.post(
            f"/api/v1/orientador/students/{estudiante.id}/tasks",
            json={"title": "Agendar reunión con estudiante"},
            headers=auth_headers(orientador),
        )
        assert task_res.status_code == 201
        task_data = task_res.json()
        assert task_data["title"] == "Agendar reunión con estudiante"

        detail_res = await client.get(
            f"/api/v1/orientador/students/{estudiante.id}",
            headers=auth_headers(orientador),
        )
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert len(detail_data["notes"]) >= 1
        assert len(detail_data["tasks"]) >= 1
