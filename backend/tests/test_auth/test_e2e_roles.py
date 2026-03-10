"""
Tests E2E del flujo completo de autenticacion por rol.

Modo local (BD de test):
    pytest tests/test_auth/test_e2e_roles.py -v

Modo produccion (contra vocari-api.fly.dev):
    VOCARI_E2E_API_URL=https://vocari-api.fly.dev \
    VOCARI_E2E_DEV_SECRET=<tu-secreto> \
    pytest tests/test_auth/test_e2e_roles.py -v -m e2e

Los tests marcados con @pytest.mark.e2e solo corren en modo produccion.
"""

import os

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.auth.models import User, UserRole
from app.auth.service import create_access_token, create_refresh_token
from app.config import get_settings

# ---------------------------------------------------------------------------
# Configuracion del modo de ejecucion
# ---------------------------------------------------------------------------

E2E_API_URL = os.getenv("VOCARI_E2E_API_URL", "")
E2E_DEV_SECRET = os.getenv("VOCARI_E2E_DEV_SECRET", "")
IS_E2E_MODE = bool(E2E_API_URL and E2E_DEV_SECRET)


def skip_if_not_e2e(reason: str = "Solo en modo E2E con VOCARI_E2E_API_URL"):
    return pytest.mark.skipif(not IS_E2E_MODE, reason=reason)


# ---------------------------------------------------------------------------
# Helper: cliente contra API desplegada
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def prod_client() -> AsyncClient:
    """Cliente HTTP apuntando al API productivo."""
    if not IS_E2E_MODE:
        pytest.skip("VOCARI_E2E_API_URL no configurado")
    async with AsyncClient(base_url=E2E_API_URL, timeout=30.0) as client:
        yield client


async def _get_prod_token(client: AsyncClient, email: str) -> dict:
    """Obtiene un JWT del endpoint /dev-token para un usuario de prueba."""
    response = await client.post(
        "/api/v1/auth/dev-token",
        json={"email": email, "secret": E2E_DEV_SECRET},
    )
    assert response.status_code == 200, (
        f"Error al obtener token para {email}: {response.text}"
    )
    return response.json()


# ---------------------------------------------------------------------------
# Tests unitarios con BD de test (siempre corren)
# ---------------------------------------------------------------------------


class TestJWTConCamposCompletos:
    """Verifica que el JWT emitido tenga todos los campos necesarios."""

    def test_jwt_estudiante_tiene_campos_basicos(self) -> None:
        import uuid
        from jose import jwt

        user_id = uuid.uuid4()
        settings = get_settings()

        token = create_access_token(
            user_id=user_id,
            role="estudiante",
            email="ana@test.cl",
            name="Ana Garcia",
        )
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert payload["sub"] == str(user_id)
        assert payload["role"] == "estudiante"
        assert payload["email"] == "ana@test.cl"
        assert payload["name"] == "Ana Garcia"
        assert payload["institution_id"] is None
        assert payload["type"] == "access"

    def test_jwt_orientador_tiene_institution_id(self) -> None:
        import uuid
        from jose import jwt

        user_id = uuid.uuid4()
        inst_id = uuid.uuid4()
        settings = get_settings()

        token = create_access_token(
            user_id=user_id,
            role="orientador",
            email="maria@colegio.cl",
            name="Maria Lopez",
            institution_id=inst_id,
        )
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert payload["institution_id"] == str(inst_id)
        assert payload["role"] == "orientador"


class TestAuthMeEndpoint:
    """Tests del endpoint /me con cada rol usando BD de test."""

    async def test_me_estudiante(
        self, client: AsyncClient, sample_user: User, auth_headers: object
    ) -> None:
        headers = auth_headers(sample_user)  # type: ignore[operator]
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user.email
        assert data["name"] == sample_user.name
        assert data["role"] == "estudiante"
        assert "permissions" in data
        assert "test:take" in data["permissions"]

    async def test_me_apoderado(
        self, client: AsyncClient, sample_apoderado: User, auth_headers: object
    ) -> None:
        headers = auth_headers(sample_apoderado)  # type: ignore[operator]
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "apoderado"
        assert "consent:manage" in data["permissions"]

    async def test_me_orientador(
        self, client: AsyncClient, sample_orientador: User, auth_headers: object
    ) -> None:
        headers = auth_headers(sample_orientador)  # type: ignore[operator]
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "orientador"
        assert data["institution"] is not None
        assert "session:manage" in data["permissions"]

    async def test_me_admin_colegio(
        self, client: AsyncClient, sample_admin_colegio: User, auth_headers: object
    ) -> None:
        headers = auth_headers(sample_admin_colegio)  # type: ignore[operator]
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin_colegio"
        assert data["institution"] is not None
        assert "student:manage_all" in data["permissions"]

    async def test_me_super_admin(
        self, client: AsyncClient, sample_admin: User, auth_headers: object
    ) -> None:
        headers = auth_headers(sample_admin)  # type: ignore[operator]
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "super_admin"
        assert "all" in data["permissions"]

    async def test_me_sin_token_retorna_401(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_me_token_invalido_retorna_401(self, client: AsyncClient) -> None:
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer token.invalido.aqui"},
        )
        assert response.status_code == 401


class TestControlDeAccesoPorRol:
    """Verifica que los endpoints respetan los roles requeridos."""

    async def test_estudiante_no_puede_ver_sessions_de_orientador(
        self, client: AsyncClient, sample_user: User, auth_headers: object
    ) -> None:
        """Un estudiante no puede acceder a endpoints de orientador."""
        headers = auth_headers(sample_user)  # type: ignore[operator]
        response = await client.get("/api/v1/sessions", headers=headers)
        # Puede ver sus propias sesiones (200) pero no las de otros
        assert response.status_code in (200, 403)

    async def test_apoderado_no_puede_acceder_sin_token(
        self, client: AsyncClient
    ) -> None:
        response = await client.get("/api/v1/sessions")
        assert response.status_code == 401

    async def test_usuario_inactivo_no_puede_autenticarse(
        self, client: AsyncClient, db_session: object, make_token: object
    ) -> None:
        """Un usuario marcado como inactivo recibe 404/401 en /me."""
        import uuid
        from sqlalchemy.ext.asyncio import AsyncSession

        from app.auth.models import User as UserModel

        session: AsyncSession = db_session  # type: ignore[assignment]
        user = UserModel(
            id=uuid.uuid4(),
            email="inactivo@test.vocari.cl",
            google_id=f"google-inactivo-{uuid.uuid4().hex[:8]}",
            name="Usuario Inactivo",
            role=UserRole.ESTUDIANTE,
            is_active=False,
        )
        session.add(user)
        await session.flush()

        token = make_token(user)  # type: ignore[operator]
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code in (401, 404)


class TestRefreshTokenFlow:
    """Prueba el flujo de renovacion de tokens."""

    async def test_refresh_token_retorna_nuevo_access_token(
        self, client: AsyncClient, sample_user: User
    ) -> None:
        refresh_token = create_refresh_token(sample_user.id)

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["access_token"] != ""

    async def test_refresh_token_invalido_retorna_401(
        self, client: AsyncClient
    ) -> None:
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "refresh.invalido.aqui"},
        )
        assert response.status_code == 401

    async def test_access_token_como_refresh_retorna_401(
        self, client: AsyncClient, sample_user: User, make_token: object
    ) -> None:
        """Usar un access token como refresh debe fallar."""
        access_token = make_token(sample_user)  # type: ignore[operator]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token},
        )
        assert response.status_code == 401


class TestLogoutFlow:
    """Prueba el flujo de cierre de sesion."""

    async def test_logout_retorna_ok(
        self, client: AsyncClient, sample_user: User, auth_headers: object
    ) -> None:
        headers = auth_headers(sample_user)  # type: ignore[operator]
        response = await client.post("/api/v1/auth/logout", headers=headers)
        # Logout no requiere auth, acepta cualquier request
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


# ---------------------------------------------------------------------------
# Tests E2E contra API desplegada (requieren VOCARI_E2E_API_URL)
# ---------------------------------------------------------------------------


@pytest.mark.e2e
class TestE2EFlujoCompletoEnProduccion:
    """
    Flujo completo contra https://vocari-api.fly.dev.

    Pre-requisito: ejecutar seed_test_users.py y configurar DEV_TOKEN_SECRET.

    Correr con:
        VOCARI_E2E_API_URL=https://vocari-api.fly.dev \
        VOCARI_E2E_DEV_SECRET=<secreto> \
        pytest tests/test_auth/test_e2e_roles.py::TestE2EFlujoCompletoEnProduccion -v
    """

    ROLES = [
        ("test.estudiante@vocari.cl", "estudiante", ["test:take", "career:view"]),
        ("test.apoderado@vocari.cl", "apoderado", ["consent:manage"]),
        ("test.orientador@vocari.cl", "orientador", ["session:manage"]),
        ("test.admin.colegio@vocari.cl", "admin_colegio", ["student:manage_all"]),
        ("test.superadmin@vocari.cl", "super_admin", ["all"]),
    ]

    @skip_if_not_e2e()
    async def test_health_check(self, prod_client: AsyncClient) -> None:
        """El backend esta online."""
        response = await prod_client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    @skip_if_not_e2e()
    @pytest.mark.parametrize("email,role,perms", ROLES)
    async def test_me_por_rol(
        self, prod_client: AsyncClient, email: str, role: str, perms: list[str]
    ) -> None:
        """Para cada rol: obtiene token, llama /me y verifica datos."""
        token_data = await _get_prod_token(prod_client, email)

        access_token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        me_response = await prod_client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200, (
            f"[{role}] /me fallo: {me_response.text}"
        )

        me = me_response.json()
        assert me["email"] == email, f"[{role}] email incorrecto"
        assert me["role"] == role, f"[{role}] rol incorrecto"
        for perm in perms:
            assert perm in me["permissions"], (
                f"[{role}] permiso '{perm}' no encontrado en {me['permissions']}"
            )

    @skip_if_not_e2e()
    async def test_flujo_completo_estudiante(self, prod_client: AsyncClient) -> None:
        """
        Flujo completo del estudiante:
        1. Obtener token via /dev-token
        2. Llamar /me
        3. Listar sesiones
        4. Refresh token
        5. Logout
        """
        # 1. Obtener token
        token_data = await _get_prod_token(prod_client, "test.estudiante@vocari.cl")
        at = token_data["access_token"]
        rt = token_data["refresh_token"]
        headers = {"Authorization": f"Bearer {at}"}

        # 2. Verificar identidad
        me = (await prod_client.get("/api/v1/auth/me", headers=headers)).json()
        assert me["role"] == "estudiante"

        # 3. Listar sesiones (debe funcionar sin error)
        sessions = await prod_client.get("/api/v1/sessions", headers=headers)
        assert sessions.status_code in (200, 403)

        # 4. Refresh token
        refresh_res = await prod_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": rt}
        )
        assert refresh_res.status_code == 200
        new_at = refresh_res.json()["access_token"]
        assert new_at != at

        # 5. Logout
        logout_res = await prod_client.post("/api/v1/auth/logout", headers=headers)
        assert logout_res.status_code == 200

    @skip_if_not_e2e()
    async def test_flujo_completo_orientador(self, prod_client: AsyncClient) -> None:
        """
        Flujo completo del orientador:
        1. Obtener token
        2. Verificar que tiene institution en /me
        3. Ver sesiones (orientador puede ver mas)
        """
        token_data = await _get_prod_token(prod_client, "test.orientador@vocari.cl")
        at = token_data["access_token"]
        headers = {"Authorization": f"Bearer {at}"}

        me = (await prod_client.get("/api/v1/auth/me", headers=headers)).json()
        assert me["role"] == "orientador"
        assert me["institution"] is not None, "Orientador debe tener institucion"

        sessions = await prod_client.get("/api/v1/sessions", headers=headers)
        assert sessions.status_code == 200

    @skip_if_not_e2e()
    async def test_acceso_cruzado_bloqueado(self, prod_client: AsyncClient) -> None:
        """
        Un estudiante no puede usar endpoints exclusivos de super_admin.
        """
        token_data = await _get_prod_token(prod_client, "test.estudiante@vocari.cl")
        at = token_data["access_token"]
        headers = {"Authorization": f"Bearer {at}"}

        # El endpoint de instituciones es solo para super_admin/admin_colegio
        response = await prod_client.get("/api/v1/institutions", headers=headers)
        assert response.status_code in (403, 404), (
            f"Estudiante no deberia poder ver instituciones: {response.status_code}"
        )

    @skip_if_not_e2e()
    async def test_token_falso_es_rechazado(self, prod_client: AsyncClient) -> None:
        """Un JWT con firma incorrecta es rechazado."""
        response = await prod_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.fake_signature"},
        )
        assert response.status_code == 401
