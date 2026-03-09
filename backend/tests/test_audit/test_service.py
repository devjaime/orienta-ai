"""
Tests para el modulo de audit: service y router.
"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.models import AuditLog
from app.audit.service import create_audit_log, list_audit_logs, log_action
from app.audit.schemas import AuditLogCreate
from app.auth.models import User, UserRole
from app.common.pagination import PaginationParams
from app.institutions.models import Institution, InstitutionPlan


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Audit",
        slug=f"colegio-audit-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def admin_colegio(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin-audit-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Admin Audit",
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
        email=f"sadmin-audit-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Super Admin Audit",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"est-audit-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Audit",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Service Tests: create_audit_log
# ---------------------------------------------------------------------------


class TestCreateAuditLog:
    async def test_crea_registro(
        self, db_session: AsyncSession, admin_colegio: User, institution: Institution,
    ):
        data = AuditLogCreate(
            user_id=admin_colegio.id,
            institution_id=institution.id,
            action="create_student",
            resource_type="user",
            details={"student_email": "test@test.cl"},
        )
        log = await create_audit_log(db_session, data)

        assert log.id is not None
        assert log.action == "create_student"
        assert log.resource_type == "user"
        assert log.user_id == admin_colegio.id
        assert log.institution_id == institution.id

    async def test_crea_con_resource_id(
        self, db_session: AsyncSession, admin_colegio: User,
    ):
        resource_id = uuid.uuid4()
        data = AuditLogCreate(
            user_id=admin_colegio.id,
            action="update_session",
            resource_type="session",
            resource_id=resource_id,
        )
        log = await create_audit_log(db_session, data)
        assert log.resource_id == resource_id


# ---------------------------------------------------------------------------
# Service Tests: log_action
# ---------------------------------------------------------------------------


class TestLogAction:
    async def test_atajo_log_action(
        self, db_session: AsyncSession, admin_colegio: User, institution: Institution,
    ):
        log = await log_action(
            db_session,
            user_id=admin_colegio.id,
            action="delete_student",
            resource_type="user",
            institution_id=institution.id,
            details={"reason": "solicitud del apoderado"},
            ip_address="192.168.1.1",
        )
        assert log.id is not None
        assert log.action == "delete_student"
        assert log.ip_address == "192.168.1.1"
        assert log.details == {"reason": "solicitud del apoderado"}


# ---------------------------------------------------------------------------
# Service Tests: list_audit_logs
# ---------------------------------------------------------------------------


class TestListAuditLogs:
    async def test_lista_logs(
        self, db_session: AsyncSession, admin_colegio: User, institution: Institution,
    ):
        # Crear algunos logs
        for action in ["login", "create_student", "update_session"]:
            await log_action(
                db_session,
                user_id=admin_colegio.id,
                action=action,
                resource_type="user",
                institution_id=institution.id,
            )

        pagination = PaginationParams(page=1, per_page=20)
        result = await list_audit_logs(db_session, pagination)
        assert result.total >= 3

    async def test_filtra_por_action(
        self, db_session: AsyncSession, admin_colegio: User, institution: Institution,
    ):
        await log_action(
            db_session,
            user_id=admin_colegio.id,
            action="login",
            resource_type="auth",
            institution_id=institution.id,
        )
        await log_action(
            db_session,
            user_id=admin_colegio.id,
            action="create_student",
            resource_type="user",
            institution_id=institution.id,
        )

        pagination = PaginationParams(page=1, per_page=20)
        result = await list_audit_logs(
            db_session, pagination, action_filter="login"
        )
        assert result.total >= 1
        for item in result.items:
            assert item.action == "login"

    async def test_filtra_por_user_id(
        self, db_session: AsyncSession, admin_colegio: User, super_admin: User,
        institution: Institution,
    ):
        await log_action(
            db_session,
            user_id=admin_colegio.id,
            action="action_admin",
            resource_type="user",
            institution_id=institution.id,
        )
        await log_action(
            db_session,
            user_id=super_admin.id,
            action="action_super",
            resource_type="user",
        )

        pagination = PaginationParams(page=1, per_page=20)
        result = await list_audit_logs(
            db_session, pagination, user_id_filter=admin_colegio.id
        )
        for item in result.items:
            assert item.user_id == admin_colegio.id

    async def test_filtra_por_resource_type(
        self, db_session: AsyncSession, admin_colegio: User, institution: Institution,
    ):
        await log_action(
            db_session,
            user_id=admin_colegio.id,
            action="create",
            resource_type="session",
            institution_id=institution.id,
        )

        pagination = PaginationParams(page=1, per_page=20)
        result = await list_audit_logs(
            db_session, pagination, resource_type_filter="session"
        )
        assert result.total >= 1
        for item in result.items:
            assert item.resource_type == "session"

    async def test_paginacion(
        self, db_session: AsyncSession, admin_colegio: User, institution: Institution,
    ):
        for i in range(5):
            await log_action(
                db_session,
                user_id=admin_colegio.id,
                action=f"action_{i}",
                resource_type="test",
                institution_id=institution.id,
            )

        pagination = PaginationParams(page=1, per_page=2)
        result = await list_audit_logs(db_session, pagination)
        assert result.total >= 5
        assert len(result.items) == 2


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestAuditRouter:
    async def test_list_logs_admin_200(
        self, client, admin_colegio: User, institution: Institution,
        db_session: AsyncSession, auth_headers,
    ):
        # Crear un log
        await log_action(
            db_session,
            user_id=admin_colegio.id,
            action="test_action",
            resource_type="test",
            institution_id=institution.id,
        )

        headers = auth_headers(admin_colegio)
        resp = await client.get("/api/v1/audit", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body

    async def test_list_logs_super_admin_200(
        self, client, super_admin: User, auth_headers,
    ):
        headers = auth_headers(super_admin)
        resp = await client.get("/api/v1/audit", headers=headers)
        assert resp.status_code == 200

    async def test_list_logs_estudiante_403(
        self, client, estudiante: User, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/audit", headers=headers)
        assert resp.status_code == 403

    async def test_list_logs_con_filtros(
        self, client, admin_colegio: User, auth_headers,
    ):
        headers = auth_headers(admin_colegio)
        resp = await client.get(
            "/api/v1/audit?action=login&resource_type=auth",
            headers=headers,
        )
        assert resp.status_code == 200

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/audit")
        assert resp.status_code == 401
