"""Tests de integración para endpoint /api/v1/admin/insights."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest_asyncio

from app.auth.models import User, UserProfile, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.leads.models import AIReport, Lead
from app.sessions.models import Session as _SessionModel  # noqa: F401
from app.tests_vocational.models import TestResult as _TestResultModel  # noqa: F401


@pytest_asyncio.fixture
async def institution_primary(db_session) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Insights",
        slug=f"colegio-insights-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def institution_other(db_session) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Otro",
        slug=f"colegio-otro-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def admin_user(db_session, institution_primary: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="admin.insights@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Admin Insights",
        role=UserRole.ADMIN_COLEGIO,
        institution_id=institution_primary.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def seed_insights_data(db_session, institution_primary: Institution, institution_other: Institution) -> None:
    now = datetime.now(UTC)

    st1 = User(
        id=uuid.uuid4(),
        email="insight.st1@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante Uno",
        role=UserRole.ESTUDIANTE,
        institution_id=institution_primary.id,
        is_active=True,
    )
    st2 = User(
        id=uuid.uuid4(),
        email="insight.st2@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante Dos",
        role=UserRole.ESTUDIANTE,
        institution_id=institution_primary.id,
        is_active=True,
    )
    st_other = User(
        id=uuid.uuid4(),
        email="insight.other@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante Otro",
        role=UserRole.ESTUDIANTE,
        institution_id=institution_other.id,
        is_active=True,
    )
    db_session.add_all([st1, st2, st_other])
    await db_session.flush()

    db_session.add_all(
        [
            UserProfile(user_id=st1.id, grade="4 Medio"),
            UserProfile(user_id=st2.id, grade="3 Medio"),
            UserProfile(user_id=st_other.id, grade="4 Medio"),
        ]
    )
    await db_session.flush()

    lead_st1 = Lead(
        nombre=st1.name,
        email=st1.email,
        source="test",
        share_token=f"token-{uuid.uuid4().hex[:10]}",
        holland_code="RIA",
        clarity_score=1.0,
        updated_at=now,
    )
    lead_st2 = Lead(
        nombre=st2.name,
        email=st2.email,
        source="test",
        share_token=f"token-{uuid.uuid4().hex[:10]}",
        holland_code="SAC",
        clarity_score=4.0,
        updated_at=now,
    )
    lead_other = Lead(
        nombre=st_other.name,
        email=st_other.email,
        source="test",
        share_token=f"token-{uuid.uuid4().hex[:10]}",
        holland_code="IAS",
        clarity_score=5.0,
        updated_at=now,
    )
    db_session.add_all([lead_st1, lead_st2, lead_other])
    await db_session.flush()

    db_session.add_all(
        [
            AIReport(
                lead_id=lead_st1.id,
                report_text="Reporte st1",
                report_json={"top_careers": [{"nombre": "Ingeniería Civil"}]},
                holland_code="RIA",
                model_name="fallback-local",
                prompt_version="v1",
                created_at=now,
            ),
            AIReport(
                lead_id=lead_st2.id,
                report_text="Reporte st2",
                report_json={"top_careers": [{"nombre": "Psicología"}]},
                holland_code="SAC",
                model_name="fallback-local",
                prompt_version="v1",
                created_at=now,
            ),
            AIReport(
                lead_id=lead_other.id,
                report_text="Reporte other",
                report_json={"top_careers": [{"nombre": "Medicina"}]},
                holland_code="IAS",
                model_name="fallback-local",
                prompt_version="v1",
                created_at=now,
            ),
        ]
    )
    await db_session.flush()


class TestAdminInsightsRouter:
    async def test_insights_retorna_alertas_y_cohortes(
        self,
        client,
        auth_headers,
        admin_user: User,
        seed_insights_data,
    ) -> None:
        response = await client.get("/api/v1/admin/insights", headers=auth_headers(admin_user))
        assert response.status_code == 200
        data = response.json()

        assert data["summary"]["total_students"] == 2
        assert data["summary"]["students_with_high_indecision"] == 1
        assert data["summary"]["high_indecision_rate"] == 50.0
        assert len(data["clarity_trend"]) >= 1
        assert len(data["indecision_alerts"]) == 1
        assert data["indecision_alerts"][0]["student_email"] == "insight.st1@test.cl"

        # Cohorte no debe incluir datos de otra institución.
        all_career_names = [
            career["career_name"]
            for cohort in data["career_interest_by_course"]
            for career in cohort["careers"]
        ]
        assert "Medicina" not in all_career_names

    async def test_insights_filtra_por_curso(
        self,
        client,
        auth_headers,
        admin_user: User,
        seed_insights_data,
    ) -> None:
        response = await client.get(
            "/api/v1/admin/insights?curso=4%20Medio",
            headers=auth_headers(admin_user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["curso"] == "4 Medio"
        assert data["summary"]["total_students"] == 1
        assert all(item["curso"] == "4 Medio" for item in data["career_interest_by_course"])

