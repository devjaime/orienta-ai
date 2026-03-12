"""Tests de integración para endpoint /api/v1/admin/metrics."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest_asyncio

from app.auth.models import User, UserProfile, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.leads.models import AIReport, Lead
from app.sessions.models import Session as _SessionModel  # noqa: F401
from app.tests_vocational.models import TestResult as _TestResultModel


@pytest_asyncio.fixture
async def institution_a(db_session) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio A",
        slug=f"colegio-a-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def institution_b(db_session) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio B",
        slug=f"colegio-b-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def admin_a(db_session, institution_a: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="admin.a@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Admin A",
        role=UserRole.ADMIN_COLEGIO,
        institution_id=institution_a.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def data_metrics(
    db_session,
    institution_a: Institution,
    institution_b: Institution,
) -> None:
    # Estudiantes institución A
    st_a1 = User(
        id=uuid.uuid4(),
        email="est.a1@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante A1",
        role=UserRole.ESTUDIANTE,
        institution_id=institution_a.id,
        is_active=True,
    )
    st_a2 = User(
        id=uuid.uuid4(),
        email="est.a2@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante A2",
        role=UserRole.ESTUDIANTE,
        institution_id=institution_a.id,
        is_active=True,
    )
    # Estudiante institución B (no debe contaminar)
    st_b1 = User(
        id=uuid.uuid4(),
        email="est.b1@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante B1",
        role=UserRole.ESTUDIANTE,
        institution_id=institution_b.id,
        is_active=True,
    )
    db_session.add_all([st_a1, st_a2, st_b1])
    await db_session.flush()

    db_session.add_all(
        [
            UserProfile(user_id=st_a1.id, grade="4 Medio"),
            UserProfile(user_id=st_a2.id, grade="3 Medio"),
            UserProfile(user_id=st_b1.id, grade="4 Medio"),
        ]
    )
    await db_session.flush()

    now = datetime.now(UTC)
    db_session.add_all(
        [
            _TestResultModel(
                user_id=st_a1.id,
                institution_id=institution_a.id,
                test_type="riasec",
                answers={"1": 4},
                scores={"R": 6},
                result_code="RIA",
                certainty=0.8,
                test_metadata={},
                created_at=now,
            ),
            _TestResultModel(
                user_id=st_b1.id,
                institution_id=institution_b.id,
                test_type="riasec",
                answers={"1": 4},
                scores={"S": 7},
                result_code="SIA",
                certainty=0.8,
                test_metadata={},
                created_at=now,
            ),
        ]
    )

    lead_a1 = Lead(
        nombre=st_a1.name,
        email=st_a1.email,
        source="test",
        share_token=f"token-{uuid.uuid4().hex[:10]}",
        holland_code="RIA",
        clarity_score=2.0,
    )
    lead_b1 = Lead(
        nombre=st_b1.name,
        email=st_b1.email,
        source="test",
        share_token=f"token-{uuid.uuid4().hex[:10]}",
        holland_code="SIA",
        clarity_score=5.0,
    )
    db_session.add_all([lead_a1, lead_b1])
    await db_session.flush()

    db_session.add_all(
        [
            AIReport(
                lead_id=lead_a1.id,
                report_text="Informe A1",
                report_json={"top_careers": [{"nombre": "Ingeniería en Informática"}]},
                holland_code="RIA",
                model_name="fallback-local",
                prompt_version="v1",
            ),
            AIReport(
                lead_id=lead_b1.id,
                report_text="Informe B1",
                report_json={"top_careers": [{"nombre": "Psicología"}]},
                holland_code="SIA",
                model_name="fallback-local",
                prompt_version="v1",
            ),
        ]
    )
    await db_session.flush()


class TestAdminMetricsRouter:
    async def test_metrics_filtra_por_institucion(
        self,
        client,
        auth_headers,
        admin_a: User,
        data_metrics,
    ) -> None:
        response = await client.get("/api/v1/admin/metrics", headers=auth_headers(admin_a))
        assert response.status_code == 200
        data = response.json()

        assert data["summary"]["total_students"] == 2
        assert data["summary"]["students_with_test"] == 1
        assert data["summary"]["completion_rate"] == 50.0
        assert data["summary"]["average_clarity"] == 2.0
        assert data["summary"]["indecision_index"] == 100.0

        top_names = [item["career_name"] for item in data["top_careers"]]
        assert "Ingeniería en Informática" in top_names
        assert "Psicología" not in top_names

    async def test_metrics_filtra_por_curso(
        self,
        client,
        auth_headers,
        admin_a: User,
        data_metrics,
    ) -> None:
        response = await client.get(
            "/api/v1/admin/metrics?curso=4%20Medio",
            headers=auth_headers(admin_a),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["total_students"] == 1
        assert data["filters"]["curso"] == "4 Medio"
        assert data["riasec_distribution_by_course"][0]["curso"] == "4 Medio"
