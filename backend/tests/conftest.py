"""
Vocari Backend - Fixtures de pytest para tests de integracion y unitarios.

Provee sesion de BD, cliente HTTP, usuarios de ejemplo y headers JWT.
"""

import uuid
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.auth.models import User, UserRole
from app.common.base_model import Base
from app.institutions.models import Institution, InstitutionPlan

# ---------------------------------------------------------------------------
# Base de datos de test
# ---------------------------------------------------------------------------

_test_db_url: str | None = None
_pg_container: Any = None


def _get_test_database_url() -> str:
    """
    Intenta usar testcontainers para PostgreSQL.
    Si no esta disponible, cae a sqlite+aiosqlite.
    """
    global _test_db_url, _pg_container
    if _test_db_url is not None:
        return _test_db_url

    try:
        from testcontainers.postgres import PostgresContainer

        pg = PostgresContainer("postgres:16-alpine", driver="asyncpg")
        pg.start()
        _pg_container = pg
        _test_db_url = pg.get_connection_url()
        return _test_db_url
    except Exception:
        _test_db_url = "sqlite+aiosqlite:///./test.db"
        return _test_db_url


@pytest.fixture(scope="session")
def test_db_url() -> str:
    """URL de la base de datos de test (session-scoped, sync)."""
    return _get_test_database_url()


@pytest_asyncio.fixture
async def test_engine(test_db_url: str) -> AsyncGenerator[AsyncEngine, None]:
    """Engine de SQLAlchemy para tests - creado por test para evitar problemas de event loop."""
    engine = create_async_engine(test_db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Sesion de BD aislada por test (con rollback automatico)."""
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session
        await session.rollback()


# ---------------------------------------------------------------------------
# Cliente HTTP
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Cliente HTTP async que inyecta la sesion de test en la app."""
    from app.common.database import get_async_session
    from app.main import create_app

    app = create_app()

    # Override de la dependencia de BD para usar la sesion de test
    async def _override_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_async_session] = _override_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Usuarios de ejemplo
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession) -> User:
    """Crea un usuario estudiante de prueba."""
    user = User(
        id=uuid.uuid4(),
        email="estudiante@test.vocari.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Estudiante Test",
        role=UserRole.ESTUDIANTE,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def sample_admin(db_session: AsyncSession) -> User:
    """Crea un usuario super_admin de prueba."""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.vocari.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Admin Test",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def sample_institution(db_session: AsyncSession) -> Institution:
    """Crea una institucion de prueba."""
    institution = Institution(
        id=uuid.uuid4(),
        name="Colegio Test",
        slug=f"colegio-test-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(institution)
    await db_session.flush()
    return institution


# ---------------------------------------------------------------------------
# Autenticacion
# ---------------------------------------------------------------------------


@pytest.fixture
def auth_headers() -> Any:
    """
    Fixture-funcion que genera headers de autorizacion JWT para un usuario.

    Uso:
        headers = auth_headers(user)
        response = await client.get("/endpoint", headers=headers)
    """
    from app.auth.service import create_access_token

    def _make_headers(user: User) -> dict[str, str]:
        token = create_access_token(user.id, user.role.value)
        return {"Authorization": f"Bearer {token}"}

    return _make_headers
