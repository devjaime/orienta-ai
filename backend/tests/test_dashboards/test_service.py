"""
Tests para el modulo de dashboards: service y router.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import ParentStudentLink, User, UserRole
from app.careers.models import Career
from app.dashboards.service import (
    get_admin_dashboard,
    get_orientador_dashboard,
    get_parent_dashboard,
    get_student_dashboard,
    get_super_admin_dashboard,
)
from app.institutions.models import Institution, InstitutionPlan
from app.sessions.models import Session, SessionStatus
from app.tests_vocational.models import TestResult


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Dash",
        slug=f"colegio-dash-{uuid.uuid4().hex[:6]}",
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
        email=f"est-dash-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Dash",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def orientador(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"ori-dash-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Orientador Dash",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def apoderado(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"apo-dash-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Apoderado Dash",
        role=UserRole.APODERADO,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def admin_colegio(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin-dash-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Admin Colegio Dash",
        role=UserRole.ADMIN_COLEGIO,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def super_admin(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"sadmin-dash-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Super Admin Dash",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def career(db_session: AsyncSession) -> Career:
    c = Career(
        id=uuid.uuid4(),
        name="Ingenieria en Informatica",
        area="Tecnologia",
        holland_codes=["R", "I"],
        description="Carrera de informatica",
        salary_range={"min": 800000, "max": 2000000},
        employability=0.85,
        saturation_index=0.3,
        mineduc_data={},
        is_active=True,
    )
    db_session.add(c)
    await db_session.flush()
    return c


# ---------------------------------------------------------------------------
# Service Tests: Student Dashboard
# ---------------------------------------------------------------------------


class TestStudentDashboard:
    async def test_dashboard_vacio(
        self, db_session: AsyncSession, estudiante: User,
    ):
        result = await get_student_dashboard(db_session, estudiante)
        assert result.total_sessions == 0
        assert result.total_tests == 0
        assert result.upcoming_sessions == []
        assert result.recent_results == []
        assert result.profile_summary is None

    async def test_dashboard_con_sesion(
        self, db_session: AsyncSession, estudiante: User,
        orientador: User, institution: Institution,
    ):
        now = datetime.now(timezone.utc)
        session = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=now,
            duration_minutes=30,
            status=SessionStatus.SCHEDULED,
        )
        db_session.add(session)
        await db_session.flush()

        result = await get_student_dashboard(db_session, estudiante)
        assert result.total_sessions == 1

    async def test_dashboard_con_tests(
        self, db_session: AsyncSession, estudiante: User, institution: Institution,
    ):
        test = TestResult(
            user_id=estudiante.id,
            institution_id=institution.id,
            test_type="riasec",
            answers={"q1": "a"},
            scores={"R": 5, "I": 3},
            result_code="RI",
            certainty=0.8,
        )
        db_session.add(test)
        await db_session.flush()

        result = await get_student_dashboard(db_session, estudiante)
        assert result.total_tests == 1
        assert len(result.recent_results) == 1

    async def test_dashboard_con_carreras(
        self, db_session: AsyncSession, estudiante: User, career: Career,
    ):
        result = await get_student_dashboard(db_session, estudiante)
        assert len(result.recommended_careers) >= 1
        assert result.recommended_careers[0].name == "Ingenieria en Informatica"


# ---------------------------------------------------------------------------
# Service Tests: Orientador Dashboard
# ---------------------------------------------------------------------------


class TestOrientadorDashboard:
    async def test_dashboard_vacio(
        self, db_session: AsyncSession, orientador: User,
    ):
        result = await get_orientador_dashboard(db_session, orientador)
        assert result.students_assigned == 0
        assert result.upcoming_sessions == []
        assert result.pending_reviews == 0
        assert result.workload_stats.this_week == 0
        assert result.alerts == []

    async def test_cuenta_estudiantes_asignados(
        self, db_session: AsyncSession, orientador: User,
        estudiante: User, institution: Institution,
    ):
        now = datetime.now(timezone.utc)
        session = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=now,
            duration_minutes=30,
            status=SessionStatus.COMPLETED,
        )
        db_session.add(session)
        await db_session.flush()

        result = await get_orientador_dashboard(db_session, orientador)
        assert result.students_assigned == 1


# ---------------------------------------------------------------------------
# Service Tests: Parent Dashboard
# ---------------------------------------------------------------------------


class TestParentDashboard:
    async def test_dashboard_sin_hijos(
        self, db_session: AsyncSession, apoderado: User,
    ):
        result = await get_parent_dashboard(db_session, apoderado)
        assert result.children == []

    async def test_dashboard_con_hijo_vinculado(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User,
    ):
        link = ParentStudentLink(
            parent_id=apoderado.id,
            student_id=estudiante.id,
            verified=True,
        )
        db_session.add(link)
        await db_session.flush()

        result = await get_parent_dashboard(db_session, apoderado)
        assert len(result.children) == 1
        assert result.children[0].student_name == "Estudiante Dash"

    async def test_no_muestra_vinculos_no_verificados(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User,
    ):
        link = ParentStudentLink(
            parent_id=apoderado.id,
            student_id=estudiante.id,
            verified=False,
        )
        db_session.add(link)
        await db_session.flush()

        result = await get_parent_dashboard(db_session, apoderado)
        assert result.children == []


# ---------------------------------------------------------------------------
# Service Tests: Admin Dashboard
# ---------------------------------------------------------------------------


class TestAdminDashboard:
    async def test_dashboard_con_institucion(
        self, db_session: AsyncSession, admin_colegio: User,
        estudiante: User, orientador: User,
    ):
        result = await get_admin_dashboard(db_session, admin_colegio)
        assert result.institution_stats.total_students >= 1
        assert isinstance(result.orientador_stats, list)
        assert isinstance(result.engagement_trend, list)

    async def test_dashboard_sin_institucion(
        self, db_session: AsyncSession,
    ):
        user_sin_inst = User(
            id=uuid.uuid4(),
            email=f"admin-noinst-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Admin Sin Institucion",
            role=UserRole.ADMIN_COLEGIO,
            is_active=True,
            institution_id=None,
        )
        db_session.add(user_sin_inst)
        await db_session.flush()

        result = await get_admin_dashboard(db_session, user_sin_inst)
        assert result.institution_stats.total_students == 0


# ---------------------------------------------------------------------------
# Service Tests: Super Admin Dashboard
# ---------------------------------------------------------------------------


class TestSuperAdminDashboard:
    async def test_dashboard_basico(
        self, db_session: AsyncSession, institution: Institution,
        estudiante: User,
    ):
        result = await get_super_admin_dashboard(db_session)
        assert result.platform_stats.total_institutions >= 1
        assert result.platform_stats.total_users >= 1
        assert isinstance(result.active_institutions, list)


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestDashboardsRouter:
    async def test_student_dashboard_200(
        self, client, estudiante: User, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/dashboards/student", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "upcoming_sessions" in body
        assert "total_tests" in body

    async def test_student_dashboard_403_orientador(
        self, client, orientador: User, auth_headers,
    ):
        headers = auth_headers(orientador)
        resp = await client.get("/api/v1/dashboards/student", headers=headers)
        assert resp.status_code == 403

    async def test_orientador_dashboard_200(
        self, client, orientador: User, auth_headers,
    ):
        headers = auth_headers(orientador)
        resp = await client.get("/api/v1/dashboards/orientador", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "students_assigned" in body
        assert "workload_stats" in body

    async def test_parent_dashboard_200(
        self, client, apoderado: User, auth_headers,
    ):
        headers = auth_headers(apoderado)
        resp = await client.get("/api/v1/dashboards/parent", headers=headers)
        assert resp.status_code == 200
        assert "children" in resp.json()

    async def test_admin_dashboard_200(
        self, client, admin_colegio: User, auth_headers,
    ):
        headers = auth_headers(admin_colegio)
        resp = await client.get("/api/v1/dashboards/admin", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "institution_stats" in body

    async def test_super_admin_dashboard_200(
        self, client, super_admin: User, auth_headers,
    ):
        headers = auth_headers(super_admin)
        resp = await client.get("/api/v1/dashboards/super-admin", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "platform_stats" in body

    async def test_super_admin_dashboard_403_estudiante(
        self, client, estudiante: User, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/dashboards/super-admin", headers=headers)
        assert resp.status_code == 403

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/dashboards/student")
        assert resp.status_code == 401
