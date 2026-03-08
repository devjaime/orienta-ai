"""
Tests para el modulo tests_vocational: service + router.
"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.common.exceptions import NotFoundError
from app.common.pagination import PaginationParams
from app.institutions.models import Institution, InstitutionPlan
from app.tests_vocational.schemas import RIASECScores, TestResultCreate
from app.tests_vocational.service import (
    get_latest_riasec_result,
    get_test_result_by_id,
    list_test_results_by_user,
    save_riasec_result,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio RIASEC",
        slug=f"colegio-riasec-{uuid.uuid4().hex[:6]}",
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
        name="Estudiante RIASEC",
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
        name="Orientador Test",
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
        name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


def _make_riasec_data(**overrides) -> TestResultCreate:
    defaults = {
        "codigo_holland": "RIA",
        "certeza": "Alta",
        "puntajes": RIASECScores(R=25, I=20, A=18, S=10, E=8, C=5),
        "respuestas": {i: (i % 5) + 1 for i in range(1, 37)},
        "duracion_minutos": 15,
    }
    defaults.update(overrides)
    return TestResultCreate(**defaults)


# ---------------------------------------------------------------------------
# Service Tests
# ---------------------------------------------------------------------------


class TestSaveRIASECResult:
    async def test_save_riasec_result_basico(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data()
        result = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )

        assert result.id is not None
        assert result.user_id == estudiante.id
        assert result.institution_id == institution.id
        assert result.test_type == "riasec"
        assert result.result_code == "RIA"
        assert result.certainty == 0.9  # "Alta" -> 0.9
        assert result.scores["R"] == 25
        assert result.scores["I"] == 20

    async def test_certeza_media(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data(certeza="Media")
        result = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )
        assert result.certainty == 0.6

    async def test_certeza_exploratoria(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data(certeza="Exploratoria")
        result = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )
        assert result.certainty == 0.3

    async def test_certeza_desconocida_usa_default(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data(certeza="OtraDesconocida")
        result = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )
        assert result.certainty == 0.5

    async def test_metadata_contiene_duracion(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data(duracion_minutos=20)
        result = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )
        assert result.test_metadata["duracion_minutos"] == 20
        assert result.test_metadata["total_preguntas"] == 36


class TestGetTestResultById:
    async def test_obtiene_resultado_existente(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data()
        saved = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )

        found = await get_test_result_by_id(db_session, saved.id, institution.id)
        assert found.id == saved.id

    async def test_resultado_no_existe_lanza_error(self, db_session: AsyncSession):
        with pytest.raises(NotFoundError):
            await get_test_result_by_id(db_session, uuid.uuid4())

    async def test_tenant_filter_excluye_otra_institucion(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        data = _make_riasec_data()
        saved = await save_riasec_result(
            db_session, estudiante.id, institution.id, data
        )

        otra_inst_id = uuid.uuid4()
        with pytest.raises(NotFoundError):
            await get_test_result_by_id(db_session, saved.id, otra_inst_id)


class TestListTestResultsByUser:
    async def test_lista_resultados_de_usuario(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        # Guardar 3 resultados
        for _ in range(3):
            await save_riasec_result(
                db_session, estudiante.id, institution.id, _make_riasec_data()
            )

        pagination = PaginationParams(page=1, per_page=10)
        result = await list_test_results_by_user(
            db_session, estudiante.id, pagination, tenant_institution_id=institution.id
        )

        assert result.total == 3
        assert len(result.items) == 3

    async def test_filtra_por_test_type(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        await save_riasec_result(
            db_session, estudiante.id, institution.id, _make_riasec_data()
        )

        pagination = PaginationParams(page=1, per_page=10)

        result = await list_test_results_by_user(
            db_session, estudiante.id, pagination, test_type="riasec",
            tenant_institution_id=institution.id,
        )
        assert result.total == 1

        result_none = await list_test_results_by_user(
            db_session, estudiante.id, pagination, test_type="otro_test",
            tenant_institution_id=institution.id,
        )
        assert result_none.total == 0

    async def test_paginacion(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        for _ in range(5):
            await save_riasec_result(
                db_session, estudiante.id, institution.id, _make_riasec_data()
            )

        pagination = PaginationParams(page=1, per_page=2)
        result = await list_test_results_by_user(
            db_session, estudiante.id, pagination,
            tenant_institution_id=institution.id,
        )
        assert result.total == 5
        assert len(result.items) == 2
        assert result.page == 1


class TestGetLatestRIASECResult:
    async def test_retorna_ultimo_resultado(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        await save_riasec_result(
            db_session, estudiante.id, institution.id,
            _make_riasec_data(codigo_holland="RIA"),
        )
        await save_riasec_result(
            db_session, estudiante.id, institution.id,
            _make_riasec_data(codigo_holland="SIA"),
        )

        latest = await get_latest_riasec_result(
            db_session, estudiante.id, institution.id
        )
        assert latest is not None
        assert latest.result_code == "SIA"

    async def test_retorna_none_sin_resultados(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        result = await get_latest_riasec_result(
            db_session, estudiante.id, institution.id
        )
        assert result is None


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestTestsVocationalRouter:
    async def test_post_riasec_201(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        payload = {
            "codigo_holland": "RIA",
            "certeza": "Alta",
            "puntajes": {"R": 25, "I": 20, "A": 18, "S": 10, "E": 8, "C": 5},
            "respuestas": {str(i): (i % 5) + 1 for i in range(1, 37)},
            "duracion_minutos": 15,
        }
        resp = await client.post("/api/v1/tests/riasec", json=payload, headers=headers)
        assert resp.status_code == 201
        body = resp.json()
        assert body["test_type"] == "riasec"
        assert body["result_code"] == "RIA"

    async def test_post_riasec_sin_institucion_422(
        self, client, sample_user: User, auth_headers
    ):
        """Estudiante sin institution_id recibe error."""
        headers = auth_headers(sample_user)
        payload = {
            "codigo_holland": "RIA",
            "certeza": "Alta",
            "puntajes": {"R": 25, "I": 20, "A": 18, "S": 10, "E": 8, "C": 5},
            "respuestas": {str(i): (i % 5) + 1 for i in range(1, 37)},
            "duracion_minutos": 15,
        }
        resp = await client.post("/api/v1/tests/riasec", json=payload, headers=headers)
        assert resp.status_code == 422

    async def test_get_latest_riasec_none(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/tests/riasec/latest", headers=headers)
        assert resp.status_code == 200
        assert resp.json() is None

    async def test_get_me_list(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/tests/me", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body

    async def test_get_student_results_requiere_rol(
        self, client, estudiante: User, auth_headers
    ):
        """Estudiante no puede ver resultados de otros estudiantes."""
        headers = auth_headers(estudiante)
        resp = await client.get(
            f"/api/v1/tests/student/{uuid.uuid4()}", headers=headers
        )
        assert resp.status_code == 403

    async def test_orientador_puede_ver_resultados_estudiante(
        self, client, orientador: User, estudiante: User, auth_headers
    ):
        headers = auth_headers(orientador)
        resp = await client.get(
            f"/api/v1/tests/student/{estudiante.id}", headers=headers
        )
        assert resp.status_code == 200

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/tests/me")
        assert resp.status_code == 401
