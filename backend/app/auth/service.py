"""
Vocari Backend - Servicio de Autenticacion.

Google OAuth, emision de JWT, gestion de sesiones.
"""

import uuid
from datetime import UTC, datetime, timedelta

import httpx
import structlog
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserProfile, UserRole
from app.common.exceptions import (
    AuthenticationError,
    InvalidCredentialsError,
    TokenExpiredError,
)
from app.config import get_settings

logger = structlog.get_logger()

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_google_auth_url(state: str | None = None) -> str:
    """Genera la URL de autorizacion de Google OAuth."""
    settings = get_settings()
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state

    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_google_code(code: str) -> dict:
    """Intercambia el authorization code por tokens de Google."""
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
        )

    if response.status_code != 200:
        logger.error("Error en Google token exchange", status=response.status_code)
        raise InvalidCredentialsError("Error al autenticar con Google")

    return response.json()


async def get_google_user_info(access_token: str) -> dict:
    """Obtiene informacion del usuario desde Google."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if response.status_code != 200:
        raise InvalidCredentialsError("Error al obtener datos de Google")

    return response.json()


async def get_or_create_user(
    db: AsyncSession,
    google_id: str,
    email: str,
    name: str,
    avatar_url: str | None = None,
) -> User:
    """Busca un usuario por google_id o lo crea si no existe."""
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user:
        # Actualizar last_login
        user.last_login = datetime.now(UTC)
        if avatar_url:
            user.avatar_url = avatar_url
        return user

    # Crear nuevo usuario
    user = User(
        google_id=google_id,
        email=email,
        name=name,
        avatar_url=avatar_url,
        role=UserRole.ESTUDIANTE,  # Rol por defecto
        last_login=datetime.now(UTC),
    )
    db.add(user)

    # Crear perfil vacio
    profile = UserProfile(user_id=user.id)
    db.add(profile)

    await db.flush()
    logger.info("Nuevo usuario creado", user_id=str(user.id), email=email)
    return user


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    """Crea un JWT access token."""
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: uuid.UUID) -> str:
    """Crea un JWT refresh token."""
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str, expected_type: str = "access") -> dict:
    """Verifica y decodifica un JWT token."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        if "expired" in str(e).lower():
            raise TokenExpiredError()
        raise AuthenticationError("Token invalido")

    if payload.get("type") != expected_type:
        raise AuthenticationError(f"Tipo de token incorrecto: esperado {expected_type}")

    return payload
