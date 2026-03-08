"""
Tests para el modulo profiles: service + router.
"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.common.exceptions import NotFoundError
from app.institutions.models import Institution, InstitutionPlan
from app.profiles.schemas import ProfileUpdate, SkillsData
from app.profiles.service import (
    append_riasec_to_history,
    get_or_create_profile,
    get_profile_by_student_id,
    update_profile,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Perfiles",
        slug=f"colegio-perfiles-{uuid.uuid4().hex[:6]}",
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
        name="Estudiante Perfiles",
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
        name="Orientador Perfiles",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def admin(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Super Admin Perfiles",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Service Tests
# ---------------------------------------------------------------------------


class TestGetOrCreateProfile:
    async def test_crea_perfil_nuevo(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        profile = await get_or_create_profile(
            db_session, estudiante.id, institution.id
        )

        assert profile.id is not None
        assert profile.student_id == estudiante.id
        assert profile.institution_id == institution.id
        assert profile.skills == {}
        assert profile.interests == {}
        assert profile.riasec_history == []
        assert profile.data_sources == []

    async def test_retorna_perfil_existente(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        p1 = await get_or_create_profile(
            db_session, estudiante.id, institution.id
        )
        p2 = await get_or_create_profile(
            db_session, estudiante.id, institution.id
        )
        assert p1.id == p2.id


class TestGetProfileByStudentId:
    async def test_obtiene_perfil_existente(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        created = await get_or_create_profile(
            db_session, estudiante.id, institution.id
        )
        found = await get_profile_by_student_id(
            db_session, estudiante.id, institution.id
        )
        assert found.id == created.id

    async def test_no_encontrado_lanza_error(self, db_session: AsyncSession):
        with pytest.raises(NotFoundError):
            await get_profile_by_student_id(db_session, uuid.uuid4())

    async def test_tenant_isolation(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        await get_or_create_profile(db_session, estudiante.id, institution.id)
        otra_inst_id = uuid.uuid4()
        with pytest.raises(NotFoundError):
            await get_profile_by_student_id(
                db_session, estudiante.id, otra_inst_id
            )


class TestUpdateProfile:
    async def test_actualiza_skills(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        await get_or_create_profile(db_session, estudiante.id, institution.id)

        skills = SkillsData(
            analiticas=8.0,
            creativas=7.5,
            sociales=6.0,
            practicas=5.0,
            liderazgo=4.0,
            organizacion=3.0,
        )
        data = ProfileUpdate(skills=skills)
        updated = await update_profile(
            db_session, estudiante.id, data, institution.id
        )

        assert updated.skills["analiticas"] == 8.0
        assert updated.skills["creativas"] == 7.5
        assert updated.last_updated is not None

    async def test_update_parcial_no_borra_otros_campos(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        profile = await get_or_create_profile(
            db_session, estudiante.id, institution.id
        )
        # Primero setear interests
        data1 = ProfileUpdate(interests={"ciencia": 0.8})
        await update_profile(db_session, estudiante.id, data1, institution.id)

        # Luego actualizar solo skills
        skills = SkillsData(
            analiticas=9.0, creativas=0, sociales=0,
            practicas=0, liderazgo=0, organizacion=0,
        )
        data2 = ProfileUpdate(skills=skills)
        updated = await update_profile(
            db_session, estudiante.id, data2, institution.id
        )

        # interests debe seguir
        assert updated.interests == {"ciencia": 0.8}
        assert updated.skills["analiticas"] == 9.0


class TestAppendRIASECToHistory:
    async def test_agrega_resultado_al_historial(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        riasec_data = {"codigo": "RIA", "R": 25, "I": 20, "A": 18}
        profile = await append_riasec_to_history(
            db_session, estudiante.id, institution.id, riasec_data
        )

        assert len(profile.riasec_history) == 1
        assert profile.riasec_history[0]["codigo"] == "RIA"
        assert "fecha" in profile.riasec_history[0]
        assert "riasec_test" in profile.data_sources

    async def test_agrega_multiples_sin_duplicar_source(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        for i in range(3):
            await append_riasec_to_history(
                db_session, estudiante.id, institution.id,
                {"codigo": f"R{i}A", "run": i},
            )

        profile = await get_or_create_profile(
            db_session, estudiante.id, institution.id
        )
        assert len(profile.riasec_history) == 3
        # data_sources no debe duplicar "riasec_test"
        assert profile.data_sources.count("riasec_test") == 1


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestProfilesRouter:
    async def test_get_me_crea_perfil(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/profiles/me", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["student_id"] == str(estudiante.id)
        assert body["skills"] == {}

    async def test_get_me_sin_institucion_422(
        self, client, sample_user: User, auth_headers
    ):
        headers = auth_headers(sample_user)
        resp = await client.get("/api/v1/profiles/me", headers=headers)
        assert resp.status_code == 422

    async def test_patch_me(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        # Primero crear
        await client.get("/api/v1/profiles/me", headers=headers)

        # Luego actualizar
        payload = {
            "interests": {"ciencia": 0.9, "arte": 0.5},
        }
        resp = await client.patch("/api/v1/profiles/me", json=payload, headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["interests"]["ciencia"] == 0.9

    async def test_get_student_profile_requiere_rol(
        self, client, estudiante: User, auth_headers
    ):
        """Estudiante no puede ver perfiles de otros."""
        headers = auth_headers(estudiante)
        resp = await client.get(
            f"/api/v1/profiles/{uuid.uuid4()}", headers=headers
        )
        assert resp.status_code == 403

    async def test_orientador_puede_ver_perfil_estudiante(
        self, client, orientador: User, estudiante: User, institution: Institution,
        db_session: AsyncSession, auth_headers,
    ):
        # Crear perfil para el estudiante
        await get_or_create_profile(db_session, estudiante.id, institution.id)

        headers = auth_headers(orientador)
        resp = await client.get(
            f"/api/v1/profiles/{estudiante.id}", headers=headers
        )
        assert resp.status_code == 200

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/profiles/me")
        assert resp.status_code == 401
