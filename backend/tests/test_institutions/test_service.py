"""
Vocari Backend - Tests del servicio de instituciones.
"""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, InstitutionNotFoundError
from app.common.pagination import PaginationParams
from app.institutions.models import Institution, InstitutionPlan
from app.institutions.schemas import InstitutionCreate
from app.institutions.service import (
    create_institution,
    get_institution_by_id,
    list_institutions,
)


class TestCreateInstitution:
    """Tests para create_institution."""

    async def test_create_institution(self, db_session: AsyncSession) -> None:
        """Crea una institucion y verifica que los campos sean correctos."""
        data = InstitutionCreate(
            name="Colegio Santiago",
            slug="colegio-santiago",
            domain="santiago.cl",
            plan=InstitutionPlan.BASIC,
            max_students=200,
        )

        institution = await create_institution(db_session, data)

        assert institution.id is not None
        assert institution.name == "Colegio Santiago"
        assert institution.slug == "colegio-santiago"
        assert institution.domain == "santiago.cl"
        assert institution.plan == InstitutionPlan.BASIC
        assert institution.max_students == 200
        assert institution.is_active is True

    async def test_create_institution_duplicate_slug(
        self, db_session: AsyncSession
    ) -> None:
        """Crear una institucion con slug duplicado lanza ConflictError."""
        slug = f"duplicado-{uuid.uuid4().hex[:6]}"

        data1 = InstitutionCreate(name="Colegio A", slug=slug)
        await create_institution(db_session, data1)

        data2 = InstitutionCreate(name="Colegio B", slug=slug)
        with pytest.raises(ConflictError):
            await create_institution(db_session, data2)


class TestListInstitutions:
    """Tests para list_institutions."""

    async def test_list_institutions(self, db_session: AsyncSession) -> None:
        """Lista instituciones con paginacion."""
        # Crear varias instituciones
        for i in range(3):
            data = InstitutionCreate(
                name=f"Colegio List {i}",
                slug=f"colegio-list-{i}-{uuid.uuid4().hex[:6]}",
            )
            await create_institution(db_session, data)

        pagination = PaginationParams(page=1, per_page=10)
        result = await list_institutions(db_session, pagination)

        assert result.total >= 3
        assert len(result.items) >= 3
        assert result.page == 1


class TestGetInstitutionById:
    """Tests para get_institution_by_id."""

    async def test_get_institution_by_id(self, db_session: AsyncSession) -> None:
        """Obtiene una institucion por su ID."""
        data = InstitutionCreate(
            name="Colegio GetById",
            slug=f"colegio-getbyid-{uuid.uuid4().hex[:6]}",
        )
        created = await create_institution(db_session, data)

        found = await get_institution_by_id(db_session, created.id)

        assert found.id == created.id
        assert found.name == "Colegio GetById"

    async def test_get_institution_not_found(self, db_session: AsyncSession) -> None:
        """Buscar una institucion inexistente lanza InstitutionNotFoundError."""
        fake_id = uuid.uuid4()

        with pytest.raises(InstitutionNotFoundError):
            await get_institution_by_id(db_session, fake_id)


class TestTenantIsolation:
    """Tests de aislamiento multi-tenant."""

    async def test_tenant_isolation(self, db_session: AsyncSession) -> None:
        """Un usuario de institucion A no puede ver la institucion B."""
        data_a = InstitutionCreate(
            name="Institucion A",
            slug=f"inst-a-{uuid.uuid4().hex[:6]}",
        )
        inst_a = await create_institution(db_session, data_a)

        data_b = InstitutionCreate(
            name="Institucion B",
            slug=f"inst-b-{uuid.uuid4().hex[:6]}",
        )
        inst_b = await create_institution(db_session, data_b)

        # Con tenant_institution_id de A, no deberia poder ver B
        with pytest.raises(InstitutionNotFoundError):
            await get_institution_by_id(
                db_session,
                inst_b.id,
                tenant_institution_id=inst_a.id,
            )

        # Pero si puede ver A
        found = await get_institution_by_id(
            db_session,
            inst_a.id,
            tenant_institution_id=inst_a.id,
        )
        assert found.id == inst_a.id
