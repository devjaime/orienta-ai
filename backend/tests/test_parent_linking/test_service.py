"""
Tests para el modulo de parent_linking: service y router.
"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import ParentStudentLink, User, UserRole
from app.common.exceptions import ConflictError, NotFoundError, UserNotFoundError, ValidationError
from app.institutions.models import Institution, InstitutionPlan
from app.parent_linking.service import (
    create_link,
    delete_link,
    list_links_for_parent,
    list_pending_links,
    verify_link,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Linking",
        slug=f"colegio-linking-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def otra_institucion(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Otro",
        slug=f"colegio-otro-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def apoderado(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"apo-link-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Apoderado Link",
        role=UserRole.APODERADO,
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
        email=f"est-link-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Link",
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
        email=f"ori-link-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Orientador Link",
        role=UserRole.ORIENTADOR,
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
        email=f"admin-link-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Admin Link",
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
        email=f"sadmin-link-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Super Admin Link",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Service Tests: create_link
# ---------------------------------------------------------------------------


class TestCreateLink:
    async def test_crea_vinculo(
        self, db_session: AsyncSession, apoderado: User, estudiante: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)

        assert link.id is not None
        assert link.parent_id == apoderado.id
        assert link.student_id == estudiante.id
        assert link.verified is False

    async def test_error_si_estudiante_no_existe(
        self, db_session: AsyncSession, apoderado: User,
    ):
        with pytest.raises(UserNotFoundError):
            await create_link(db_session, apoderado, "noexiste@test.cl")

    async def test_error_si_vinculo_duplicado(
        self, db_session: AsyncSession, apoderado: User, estudiante: User,
    ):
        await create_link(db_session, apoderado, estudiante.email)
        with pytest.raises(ConflictError):
            await create_link(db_session, apoderado, estudiante.email)

    async def test_error_si_diferente_institucion(
        self, db_session: AsyncSession, apoderado: User, otra_institucion: Institution,
    ):
        est_otra = User(
            id=uuid.uuid4(),
            email=f"est-otra-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Estudiante Otra Inst",
            role=UserRole.ESTUDIANTE,
            institution_id=otra_institucion.id,
            is_active=True,
        )
        db_session.add(est_otra)
        await db_session.flush()

        with pytest.raises(ValidationError):
            await create_link(db_session, apoderado, est_otra.email)

    async def test_error_si_no_es_estudiante(
        self, db_session: AsyncSession, apoderado: User, orientador: User,
    ):
        """No permite vincular a un orientador."""
        with pytest.raises(UserNotFoundError):
            await create_link(db_session, apoderado, orientador.email)


# ---------------------------------------------------------------------------
# Service Tests: verify_link
# ---------------------------------------------------------------------------


class TestVerifyLink:
    async def test_verifica_vinculo(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, orientador: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)
        verified = await verify_link(db_session, link.id, orientador)

        assert verified.verified is True

    async def test_error_si_ya_verificado(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, orientador: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)
        await verify_link(db_session, link.id, orientador)

        with pytest.raises(ConflictError):
            await verify_link(db_session, link.id, orientador)

    async def test_error_si_no_existe(
        self, db_session: AsyncSession, orientador: User,
    ):
        with pytest.raises(NotFoundError):
            await verify_link(db_session, uuid.uuid4(), orientador)

    async def test_super_admin_puede_verificar_cualquiera(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, super_admin: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)
        verified = await verify_link(db_session, link.id, super_admin)
        assert verified.verified is True

    async def test_error_si_admin_de_otra_institucion(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, otra_institucion: Institution,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)

        admin_otra = User(
            id=uuid.uuid4(),
            email=f"admin-otra-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Admin Otra",
            role=UserRole.ADMIN_COLEGIO,
            institution_id=otra_institucion.id,
            is_active=True,
        )
        db_session.add(admin_otra)
        await db_session.flush()

        with pytest.raises(ValidationError):
            await verify_link(db_session, link.id, admin_otra)


# ---------------------------------------------------------------------------
# Service Tests: list_links_for_parent
# ---------------------------------------------------------------------------


class TestListLinksForParent:
    async def test_lista_vinculos(
        self, db_session: AsyncSession, apoderado: User, estudiante: User,
    ):
        await create_link(db_session, apoderado, estudiante.email)
        links = await list_links_for_parent(db_session, apoderado.id)
        assert len(links) == 1

    async def test_lista_vacia_si_no_tiene(
        self, db_session: AsyncSession, apoderado: User,
    ):
        links = await list_links_for_parent(db_session, apoderado.id)
        assert links == []


# ---------------------------------------------------------------------------
# Service Tests: list_pending_links
# ---------------------------------------------------------------------------


class TestListPendingLinks:
    async def test_lista_pendientes(
        self, db_session: AsyncSession, apoderado: User, estudiante: User,
    ):
        await create_link(db_session, apoderado, estudiante.email)
        pending = await list_pending_links(db_session)
        assert len(pending) >= 1

    async def test_no_incluye_verificados(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, orientador: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)
        await verify_link(db_session, link.id, orientador)

        pending = await list_pending_links(db_session)
        ids = {p.id for p in pending}
        assert link.id not in ids

    async def test_filtra_por_institucion(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, institution: Institution,
    ):
        await create_link(db_session, apoderado, estudiante.email)
        pending = await list_pending_links(db_session, institution_id=institution.id)
        assert len(pending) >= 1


# ---------------------------------------------------------------------------
# Service Tests: delete_link
# ---------------------------------------------------------------------------


class TestDeleteLink:
    async def test_apoderado_elimina_propio(
        self, db_session: AsyncSession, apoderado: User, estudiante: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)
        await delete_link(db_session, link.id, apoderado)

        links = await list_links_for_parent(db_session, apoderado.id)
        assert len(links) == 0

    async def test_admin_puede_eliminar(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, admin_colegio: User,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)
        await delete_link(db_session, link.id, admin_colegio)

    async def test_error_si_no_existe(
        self, db_session: AsyncSession, apoderado: User,
    ):
        with pytest.raises(NotFoundError):
            await delete_link(db_session, uuid.uuid4(), apoderado)

    async def test_otro_apoderado_no_puede_eliminar(
        self, db_session: AsyncSession, apoderado: User,
        estudiante: User, institution: Institution,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)

        otro_apoderado = User(
            id=uuid.uuid4(),
            email=f"otro-apo-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Otro Apoderado",
            role=UserRole.APODERADO,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add(otro_apoderado)
        await db_session.flush()

        with pytest.raises(ValidationError):
            await delete_link(db_session, link.id, otro_apoderado)


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestParentLinkingRouter:
    async def test_create_link_201(
        self, client, apoderado: User, estudiante: User, auth_headers,
    ):
        headers = auth_headers(apoderado)
        resp = await client.post(
            "/api/v1/parent-links",
            json={"student_email": estudiante.email},
            headers=headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["parent_id"] == str(apoderado.id)
        assert body["student_id"] == str(estudiante.id)
        assert body["verified"] is False

    async def test_my_links_200(
        self, client, apoderado: User, auth_headers,
    ):
        headers = auth_headers(apoderado)
        resp = await client.get("/api/v1/parent-links/my-links", headers=headers)
        assert resp.status_code == 200
        assert "items" in resp.json()

    async def test_pending_200_orientador(
        self, client, orientador: User, auth_headers,
    ):
        headers = auth_headers(orientador)
        resp = await client.get("/api/v1/parent-links/pending", headers=headers)
        assert resp.status_code == 200
        assert "items" in resp.json()

    async def test_pending_403_estudiante(
        self, client, estudiante: User, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/parent-links/pending", headers=headers)
        assert resp.status_code == 403

    async def test_create_link_403_estudiante(
        self, client, estudiante: User, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.post(
            "/api/v1/parent-links",
            json={"student_email": "someone@test.cl"},
            headers=headers,
        )
        assert resp.status_code == 403

    async def test_verify_link_200(
        self, client, apoderado: User, estudiante: User,
        orientador: User, auth_headers, db_session: AsyncSession,
    ):
        # Crear vinculo
        link = await create_link(db_session, apoderado, estudiante.email)

        headers = auth_headers(orientador)
        resp = await client.post(
            "/api/v1/parent-links/verify",
            json={"link_id": str(link.id)},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["verified"] is True

    async def test_delete_link_204(
        self, client, apoderado: User, estudiante: User,
        auth_headers, db_session: AsyncSession,
    ):
        link = await create_link(db_session, apoderado, estudiante.email)

        headers = auth_headers(apoderado)
        resp = await client.delete(
            f"/api/v1/parent-links/{link.id}",
            headers=headers,
        )
        assert resp.status_code == 204

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/parent-links/my-links")
        assert resp.status_code == 401
