"""
Tests para el modulo careers: service + router + recommendation engine.
"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.careers.models import Career
from app.careers.recommendation import calcular_compatibilidad, generar_razones_match
from app.careers.schemas import CareerCreate
from app.careers.service import (
    create_career,
    get_career_by_id,
    get_recommendations,
    list_careers,
    update_career,
)
from app.common.exceptions import CareerNotFoundError
from app.common.pagination import PaginationParams
from app.institutions.models import Institution, InstitutionPlan


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Carreras",
        slug=f"colegio-carreras-{uuid.uuid4().hex[:6]}",
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
        name="Estudiante Carreras",
        role=UserRole.ESTUDIANTE,
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
        name="Super Admin Carreras",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


def _career_data(**overrides) -> CareerCreate:
    defaults = {
        "name": "Ingenieria Civil Informatica",
        "area": "Ingenieria y Tecnologia",
        "holland_codes": ["RIA", "RIS"],
        "description": "Carrera de tecnologia y computacion.",
        "salary_range": {"min": 800000, "max": 2500000, "currency": "CLP"},
        "employability": 0.85,
        "saturation_index": 0.3,
        "mineduc_data": {"codigo": "12345"},
    }
    defaults.update(overrides)
    return CareerCreate(**defaults)


async def _create_sample_careers(db: AsyncSession, count: int = 5) -> list[Career]:
    """Crea varias carreras para tests."""
    careers_data = [
        ("Ingenieria Civil Informatica", "Ingenieria", ["RIA", "RIC"]),
        ("Psicologia", "Ciencias Sociales", ["SIA", "SAI"]),
        ("Medicina", "Salud", ["ISR", "IRS"]),
        ("Diseno Grafico", "Arte y Diseno", ["ARI", "ARE"]),
        ("Ingenieria Comercial", "Negocios", ["ECS", "ESC"]),
        ("Enfermeria", "Salud", ["SIR", "SIC"]),
        ("Arquitectura", "Arte y Diseno", ["AIR", "AIS"]),
    ]
    created = []
    for i, (name, area, codes) in enumerate(careers_data[:count]):
        career = Career(
            name=name,
            area=area,
            holland_codes=codes,
            description=f"Descripcion de {name}",
            salary_range={"min": 600000 + i * 100000, "max": 2000000},
            employability=0.7 + i * 0.03,
            saturation_index=0.2 + i * 0.05,
            mineduc_data={},
            is_active=True,
        )
        db.add(career)
        created.append(career)
    await db.flush()
    return created


# ---------------------------------------------------------------------------
# Recommendation Engine Tests (pure functions, no DB)
# ---------------------------------------------------------------------------


class TestCalcularCompatibilidad:
    def test_match_exacto_3_posiciones(self):
        # RIA vs RIA => 40 + 25 + 15 = 80
        score = calcular_compatibilidad("RIA", ["RIA"])
        assert score == 80.0

    def test_sin_match(self):
        # RIA vs SEC => 0 (ningun match)
        score = calcular_compatibilidad("RIA", ["SEC"])
        assert score == 0.0

    def test_match_parcial(self):
        # RIA vs AIR => R en pos 0 vs A -> R in "AIR" -> +10
        #               I en pos 1 vs I -> match exacto -> +25
        #               A en pos 2 vs R -> A in "AIR" -> +10
        score = calcular_compatibilidad("RIA", ["AIR"])
        assert score == 45.0

    def test_primer_codigo_match_segundo_no(self):
        # Solo usa primer codigo de la lista
        score = calcular_compatibilidad("RIA", ["SEC", "RIA"])
        assert score == 0.0

    def test_codigo_vacio(self):
        assert calcular_compatibilidad("", ["RIA"]) == 0.0
        assert calcular_compatibilidad("RIA", []) == 0.0
        assert calcular_compatibilidad("RI", ["RIA"]) == 0.0
        assert calcular_compatibilidad("RIA", ["RI"]) == 0.0

    def test_match_solo_primera_posicion(self):
        # RIA vs RSE => R match pos 0 (40), I!=S and I not in "RSE" (0), A!=E and A not in "RSE" (0)
        score = calcular_compatibilidad("RIA", ["RSE"])
        assert score == 40.0

    def test_max_100(self):
        # RIA vs RIA = 80 (no llega a 100 con solo 3 posiciones)
        score = calcular_compatibilidad("RIA", ["RIA"])
        assert score <= 100.0


class TestGenerarRazonesMatch:
    def test_match_completo_genera_3_razones(self):
        razones = generar_razones_match("RIA", ["RIA"], "Informatica")
        assert len(razones) == 3
        assert "principal" in razones[0].lower()

    def test_sin_match_da_razon_generica(self):
        razones = generar_razones_match("RIA", ["SEC"], "Administracion")
        assert len(razones) >= 1
        assert "horizonte" in razones[0].lower()

    def test_match_parcial_tiene_razones(self):
        razones = generar_razones_match("RIA", ["AIR"], "Arquitectura")
        assert len(razones) >= 1

    def test_codigos_vacios(self):
        razones = generar_razones_match("RIA", [], "Test")
        assert razones == []


# ---------------------------------------------------------------------------
# Service Tests
# ---------------------------------------------------------------------------


class TestCreateCareer:
    async def test_crea_carrera(self, db_session: AsyncSession):
        data = _career_data()
        career = await create_career(db_session, data)

        assert career.id is not None
        assert career.name == "Ingenieria Civil Informatica"
        assert career.area == "Ingenieria y Tecnologia"
        assert career.holland_codes == ["RIA", "RIS"]
        assert career.is_active is True


class TestGetCareerById:
    async def test_obtiene_carrera(self, db_session: AsyncSession):
        data = _career_data()
        created = await create_career(db_session, data)
        found = await get_career_by_id(db_session, created.id)
        assert found.name == created.name

    async def test_no_existe_lanza_error(self, db_session: AsyncSession):
        with pytest.raises(CareerNotFoundError):
            await get_career_by_id(db_session, uuid.uuid4())


class TestListCareers:
    async def test_lista_carreras(self, db_session: AsyncSession):
        await _create_sample_careers(db_session, 3)
        pagination = PaginationParams(page=1, per_page=10)
        result = await list_careers(db_session, pagination)

        assert result.total == 3
        assert len(result.items) == 3

    async def test_filtra_por_area(self, db_session: AsyncSession):
        await _create_sample_careers(db_session, 5)
        pagination = PaginationParams(page=1, per_page=10)
        result = await list_careers(db_session, pagination, area="Salud")

        assert result.total == 1
        assert result.items[0].area == "Salud"

    async def test_paginacion(self, db_session: AsyncSession):
        await _create_sample_careers(db_session, 5)
        pagination = PaginationParams(page=1, per_page=2)
        result = await list_careers(db_session, pagination)

        assert result.total == 5
        assert len(result.items) == 2


class TestUpdateCareer:
    async def test_actualiza_nombre(self, db_session: AsyncSession):
        from app.careers.schemas import CareerUpdate

        career = await create_career(db_session, _career_data())
        update_data = CareerUpdate(name="Ingenieria Civil Industrial")
        updated = await update_career(db_session, career.id, update_data)
        assert updated.name == "Ingenieria Civil Industrial"

    async def test_desactiva_carrera(self, db_session: AsyncSession):
        from app.careers.schemas import CareerUpdate

        career = await create_career(db_session, _career_data())
        update_data = CareerUpdate(is_active=False)
        updated = await update_career(db_session, career.id, update_data)
        assert updated.is_active is False


class TestGetRecommendations:
    async def test_recomendaciones_basicas(self, db_session: AsyncSession):
        await _create_sample_careers(db_session, 5)
        result = await get_recommendations(db_session, "RIA", limit=5)

        assert result.holland_code == "RIA"
        assert len(result.recommendations) <= 5
        assert result.total_careers_analyzed == 5

    async def test_orden_por_score_descendente(self, db_session: AsyncSession):
        await _create_sample_careers(db_session, 5)
        result = await get_recommendations(db_session, "RIA", limit=5)

        scores = [r.match_score for r in result.recommendations]
        assert scores == sorted(scores, reverse=True)

    async def test_recomendaciones_con_limite(self, db_session: AsyncSession):
        await _create_sample_careers(db_session, 7)
        result = await get_recommendations(db_session, "SIA", limit=3)

        assert len(result.recommendations) == 3

    async def test_recomendaciones_sin_carreras(self, db_session: AsyncSession):
        result = await get_recommendations(db_session, "RIA", limit=5)

        assert result.total_careers_analyzed == 0
        assert len(result.recommendations) == 0


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestCareersRouter:
    async def test_list_careers_200(
        self, client, db_session: AsyncSession, estudiante: User, auth_headers
    ):
        await _create_sample_careers(db_session, 3)
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/careers", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 3

    async def test_list_careers_filter_area(
        self, client, db_session: AsyncSession, estudiante: User, auth_headers
    ):
        await _create_sample_careers(db_session, 5)
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/careers?area=Salud", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    async def test_get_career_by_id(
        self, client, db_session: AsyncSession, estudiante: User, auth_headers
    ):
        careers = await _create_sample_careers(db_session, 1)
        headers = auth_headers(estudiante)
        resp = await client.get(
            f"/api/v1/careers/{careers[0].id}", headers=headers
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == careers[0].name

    async def test_get_recommendations_default(
        self, client, db_session: AsyncSession, estudiante: User, auth_headers
    ):
        await _create_sample_careers(db_session, 5)
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/careers/recommendations", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "holland_code" in body
        assert "recommendations" in body

    async def test_get_recommendations_by_code(
        self, client, db_session: AsyncSession, estudiante: User, auth_headers
    ):
        await _create_sample_careers(db_session, 5)
        headers = auth_headers(estudiante)
        resp = await client.get(
            "/api/v1/careers/recommendations/RIA", headers=headers
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["holland_code"] == "RIA"

    async def test_create_career_requiere_super_admin(
        self, client, estudiante: User, auth_headers
    ):
        headers = auth_headers(estudiante)
        payload = {
            "name": "Test Career",
            "area": "Test",
            "holland_codes": ["RIA"],
            "description": "Test",
            "salary_range": {},
            "employability": 0.5,
            "saturation_index": 0.5,
            "mineduc_data": {},
        }
        resp = await client.post("/api/v1/careers", json=payload, headers=headers)
        assert resp.status_code == 403

    async def test_super_admin_puede_crear_carrera(
        self, client, admin: User, auth_headers
    ):
        headers = auth_headers(admin)
        payload = {
            "name": "Nueva Carrera Admin",
            "area": "Ciencias",
            "holland_codes": ["ISR"],
            "description": "Creada por admin",
            "salary_range": {"min": 500000, "max": 1500000},
            "employability": 0.75,
            "saturation_index": 0.4,
            "mineduc_data": {},
        }
        resp = await client.post("/api/v1/careers", json=payload, headers=headers)
        assert resp.status_code == 201
        assert resp.json()["name"] == "Nueva Carrera Admin"

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/careers")
        assert resp.status_code == 401
