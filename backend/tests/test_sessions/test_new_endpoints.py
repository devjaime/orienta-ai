"""
Tests para los nuevos endpoints de sessions: orientadores, stats, retry-transcript.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.sessions.models import Session, SessionAIAnalysis, SessionStatus
from app.sessions.service import get_orientador_stats, list_orientadores_for_student


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Sessions",
        slug=f"colegio-sessions-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"est-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Sessions",
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
        email=f"ori-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Orientador Sessions",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def orientador2(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"ori2-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Orientador 2",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Service Tests: list_orientadores_for_student
# ---------------------------------------------------------------------------


class TestListOrientadoresForStudent:
    async def test_lista_orientadores_de_institucion(
        self, db_session: AsyncSession, estudiante: User,
        orientador: User, orientador2: User,
    ):
        result = await list_orientadores_for_student(db_session, estudiante)
        assert len(result) == 2
        names = {u.name for u in result}
        assert orientador.name in names
        assert orientador2.name in names

    async def test_no_incluye_estudiantes(
        self, db_session: AsyncSession, estudiante: User, orientador: User,
    ):
        result = await list_orientadores_for_student(db_session, estudiante)
        ids = {u.id for u in result}
        assert estudiante.id not in ids

    async def test_sin_institucion_retorna_vacio(self, db_session: AsyncSession):
        user_sin_inst = User(
            id=uuid.uuid4(),
            email=f"sin-inst-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Sin Institucion",
            role=UserRole.ESTUDIANTE,
            institution_id=None,
            is_active=True,
        )
        db_session.add(user_sin_inst)
        await db_session.flush()

        result = await list_orientadores_for_student(db_session, user_sin_inst)
        assert result == []

    async def test_no_incluye_orientadores_inactivos(
        self, db_session: AsyncSession, estudiante: User,
        orientador: User, institution: Institution,
    ):
        # Crear orientador inactivo
        inactive = User(
            id=uuid.uuid4(),
            email=f"inactive-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Orientador Inactivo",
            role=UserRole.ORIENTADOR,
            institution_id=institution.id,
            is_active=False,
        )
        db_session.add(inactive)
        await db_session.flush()

        result = await list_orientadores_for_student(db_session, estudiante)
        ids = {u.id for u in result}
        assert inactive.id not in ids
        assert orientador.id in ids


# ---------------------------------------------------------------------------
# Service Tests: get_orientador_stats
# ---------------------------------------------------------------------------


class TestGetOrientadorStats:
    async def test_stats_vacias(
        self, db_session: AsyncSession, orientador: User,
    ):
        stats = await get_orientador_stats(db_session, orientador)
        assert stats["sesiones_hoy"] == 0
        assert stats["reviews_pendientes"] == 0
        assert stats["estudiantes_asignados"] == 0
        assert stats["alertas_activas"] == 0

    async def test_cuenta_sesiones_de_hoy(
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
            status=SessionStatus.SCHEDULED,
        )
        db_session.add(session)
        await db_session.flush()

        stats = await get_orientador_stats(db_session, orientador)
        assert stats["sesiones_hoy"] == 1

    async def test_cuenta_estudiantes_unicos(
        self, db_session: AsyncSession, orientador: User,
        institution: Institution,
    ):
        now = datetime.now(timezone.utc)
        # Crear 2 estudiantes con 3 sesiones (2 del mismo)
        est1 = User(
            id=uuid.uuid4(),
            email=f"e1-{uuid.uuid4().hex[:6]}@t.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Est 1",
            role=UserRole.ESTUDIANTE,
            institution_id=institution.id,
            is_active=True,
        )
        est2 = User(
            id=uuid.uuid4(),
            email=f"e2-{uuid.uuid4().hex[:6]}@t.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Est 2",
            role=UserRole.ESTUDIANTE,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add_all([est1, est2])
        await db_session.flush()

        for est in [est1, est1, est2]:
            db_session.add(Session(
                institution_id=institution.id,
                student_id=est.id,
                orientador_id=orientador.id,
                scheduled_at=now,
                duration_minutes=30,
                status=SessionStatus.COMPLETED,
            ))
        await db_session.flush()

        stats = await get_orientador_stats(db_session, orientador)
        assert stats["estudiantes_asignados"] == 2

    async def test_cuenta_reviews_pendientes(
        self, db_session: AsyncSession, orientador: User,
        estudiante: User, institution: Institution,
    ):
        now = datetime.now(timezone.utc)
        # Crear sesion completada
        session = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=now,
            duration_minutes=30,
            status=SessionStatus.COMPLETED,
            completed_at=now,
        )
        db_session.add(session)
        await db_session.flush()

        # Crear analisis sin revisar
        analysis = SessionAIAnalysis(
            session_id=session.id,
            summary="Resumen test",
            interests_detected=[],
            skills_detected=[],
            emotional_sentiment={},
            suggested_tests=[],
            suggested_games=[],
            model_used="test-model",
            tokens_used=100,
            processing_time_seconds=1.5,
            reviewed_by_orientador=False,
        )
        db_session.add(analysis)
        await db_session.flush()

        stats = await get_orientador_stats(db_session, orientador)
        assert stats["reviews_pendientes"] == 1

    async def test_cuenta_alertas_no_show(
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
            status=SessionStatus.NO_SHOW,
        )
        db_session.add(session)
        await db_session.flush()

        stats = await get_orientador_stats(db_session, orientador)
        assert stats["alertas_activas"] == 1


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestSessionsNewEndpoints:
    async def test_get_orientadores_200(
        self, client, estudiante: User, orientador: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/sessions/orientadores", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) >= 1
        assert body[0]["name"] == orientador.name

    async def test_get_orientadores_requiere_estudiante(
        self, client, orientador: User, auth_headers
    ):
        """Orientador no puede acceder a este endpoint."""
        headers = auth_headers(orientador)
        resp = await client.get("/api/v1/sessions/orientadores", headers=headers)
        assert resp.status_code == 403

    async def test_get_stats_orientador_200(
        self, client, orientador: User, auth_headers
    ):
        headers = auth_headers(orientador)
        resp = await client.get(
            "/api/v1/sessions/stats/orientador", headers=headers
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "sesiones_hoy" in body
        assert "reviews_pendientes" in body
        assert "estudiantes_asignados" in body
        assert "alertas_activas" in body

    async def test_get_stats_requiere_rol_orientador(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        resp = await client.get(
            "/api/v1/sessions/stats/orientador", headers=headers
        )
        assert resp.status_code == 403

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/sessions/orientadores")
        assert resp.status_code == 401

        resp2 = await client.get("/api/v1/sessions/stats/orientador")
        assert resp2.status_code == 401
