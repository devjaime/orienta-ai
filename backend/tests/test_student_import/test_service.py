"""
Tests para el modulo de student_import: service y router.
"""

from __future__ import annotations

import io
import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.student_import.service import import_students, preview_csv


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Import",
        slug=f"colegio-import-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=100,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def admin_colegio(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin-import-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Admin Import",
        role=UserRole.ADMIN_COLEGIO,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def estudiante_existente(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="existente@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Existente",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _csv(lines: list[str]) -> str:
    """Helper para generar contenido CSV."""
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Service Tests: preview_csv
# ---------------------------------------------------------------------------


class TestPreviewCSV:
    async def test_preview_basico(self):
        content = _csv([
            "nombre,email,curso",
            "Juan Perez,juan@test.cl,4to Medio",
            "Maria Lopez,maria@test.cl,3ro Medio",
        ])
        result = await preview_csv(content)

        assert result.total_rows == 2
        assert result.valid_rows == 2
        assert result.invalid_rows == 0
        assert len(result.rows) == 2
        assert result.rows[0].name == "Juan Perez"
        assert result.rows[0].email == "juan@test.cl"

    async def test_preview_con_errores(self):
        content = _csv([
            "nombre,email,curso",
            ",sin-email-valido,4to",
            "Maria Lopez,maria@test.cl,3ro",
        ])
        result = await preview_csv(content)

        assert result.total_rows == 2
        assert result.valid_rows == 1
        assert result.invalid_rows == 1
        assert result.rows[0].valid is False

    async def test_preview_csv_vacio(self):
        result = await preview_csv("")
        assert result.total_rows == 0

    async def test_preview_headers_alternativos(self):
        """Detecta columnas con nombres alternativos."""
        content = _csv([
            "nombre_completo,correo,grado",
            "Pedro Gomez,pedro@test.cl,4to",
        ])
        result = await preview_csv(content)
        assert result.total_rows == 1
        assert result.valid_rows == 1
        assert result.rows[0].name == "Pedro Gomez"

    async def test_preview_email_invalido(self):
        content = _csv([
            "nombre,email",
            "Juan,no-es-email",
        ])
        result = await preview_csv(content)
        assert result.rows[0].valid is False
        assert any("Email" in e for e in result.rows[0].errors)

    async def test_preview_nombre_muy_corto(self):
        content = _csv([
            "nombre,email",
            "A,a@test.cl",
        ])
        result = await preview_csv(content)
        assert result.rows[0].valid is False
        assert any("2 caracteres" in e for e in result.rows[0].errors)

    async def test_preview_salta_filas_vacias(self):
        content = _csv([
            "nombre,email",
            "Juan Perez,juan@test.cl",
            ",,",
            "Maria Lopez,maria@test.cl",
        ])
        result = await preview_csv(content)
        assert result.total_rows == 2  # fila vacia se salta

    async def test_preview_sin_headers_reconocibles(self):
        """Si no detecta headers de nombre/email, retorna 0 rows."""
        content = _csv([
            "columna_rara,otra_columna",
            "dato,otro_dato",
        ])
        result = await preview_csv(content)
        assert result.total_rows == 0


# ---------------------------------------------------------------------------
# Service Tests: import_students
# ---------------------------------------------------------------------------


class TestImportStudents:
    async def test_import_basico(
        self, db_session: AsyncSession, institution: Institution,
    ):
        content = _csv([
            "nombre,email",
            "Estudiante Nuevo,nuevo@import.cl",
        ])
        result = await import_students(db_session, content, institution.id)

        assert result.total_processed == 1
        assert result.successful == 1
        assert result.failed == 0
        assert result.results[0].success is True
        assert result.results[0].activation_code is not None

    async def test_import_multiples(
        self, db_session: AsyncSession, institution: Institution,
    ):
        content = _csv([
            "nombre,email,curso",
            "Est 1,e1@import.cl,4to",
            "Est 2,e2@import.cl,4to",
            "Est 3,e3@import.cl,3ro",
        ])
        result = await import_students(db_session, content, institution.id)

        assert result.total_processed == 3
        assert result.successful == 3

    async def test_import_email_duplicado(
        self, db_session: AsyncSession, institution: Institution,
        estudiante_existente: User,
    ):
        content = _csv([
            "nombre,email",
            "Existente,existente@test.cl",
        ])
        result = await import_students(db_session, content, institution.id)

        assert result.total_processed == 1
        assert result.failed == 1
        assert "Ya existe" in result.results[0].error

    async def test_import_con_filas_invalidas(
        self, db_session: AsyncSession, institution: Institution,
    ):
        content = _csv([
            "nombre,email",
            "Valido,valido@import.cl",
            ",invalido",
        ])
        result = await import_students(db_session, content, institution.id)

        assert result.successful == 1
        assert result.failed == 1

    async def test_activation_codes_unicos(
        self, db_session: AsyncSession, institution: Institution,
    ):
        content = _csv([
            "nombre,email",
            "Est A,a@unique.cl",
            "Est B,b@unique.cl",
        ])
        result = await import_students(db_session, content, institution.id)

        codes = [r.activation_code for r in result.results if r.success]
        assert len(codes) == 2
        assert codes[0] != codes[1]


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestStudentImportRouter:
    async def test_preview_200(
        self, client, admin_colegio: User, auth_headers,
    ):
        csv_content = "nombre,email\nJuan Perez,juan@router.cl\n"
        headers = auth_headers(admin_colegio)

        resp = await client.post(
            "/api/v1/students/csv/preview",
            files={"file": ("students.csv", csv_content.encode(), "text/csv")},
            headers=headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_rows"] == 1
        assert body["valid_rows"] == 1

    async def test_import_200(
        self, client, admin_colegio: User, auth_headers,
    ):
        csv_content = "nombre,email\nNuevo Router,nuevo-router@test.cl\n"
        headers = auth_headers(admin_colegio)

        resp = await client.post(
            "/api/v1/students/csv/import",
            files={"file": ("students.csv", csv_content.encode(), "text/csv")},
            headers=headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["successful"] == 1

    async def test_preview_requiere_admin(
        self, client, auth_headers, db_session: AsyncSession,
    ):
        """Estudiante no puede usar preview."""
        est = User(
            id=uuid.uuid4(),
            email=f"est-nocsv-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"g-{uuid.uuid4().hex[:12]}",
            name="Est No CSV",
            role=UserRole.ESTUDIANTE,
            is_active=True,
        )
        db_session.add(est)
        await db_session.flush()

        headers = auth_headers(est)
        csv_content = "nombre,email\nTest,test@test.cl\n"
        resp = await client.post(
            "/api/v1/students/csv/preview",
            files={"file": ("students.csv", csv_content.encode(), "text/csv")},
            headers=headers,
        )
        assert resp.status_code == 403

    async def test_import_rechaza_no_csv(
        self, client, admin_colegio: User, auth_headers,
    ):
        """Rechaza archivos que no son CSV."""
        headers = auth_headers(admin_colegio)
        resp = await client.post(
            "/api/v1/students/csv/preview",
            files={"file": ("data.txt", b"not csv", "text/plain")},
            headers=headers,
        )
        # El backend valida que sea .csv
        assert resp.status_code in (422, 400)

    async def test_sin_auth_401(self, client):
        csv_content = "nombre,email\nTest,test@test.cl\n"
        resp = await client.post(
            "/api/v1/students/csv/preview",
            files={"file": ("students.csv", csv_content.encode(), "text/csv")},
        )
        assert resp.status_code == 401
