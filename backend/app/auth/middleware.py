"""
Vocari Backend - Auth Middleware.

Extrae y verifica JWT del header Authorization.
"""

import uuid

import structlog
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import verify_token
from app.common.database import get_async_session
from app.common.exceptions import AuthenticationError, UserNotFoundError

logger = structlog.get_logger()

# Esquema de seguridad Bearer
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_async_session),
) -> User:
    """
    Dependency que extrae el usuario autenticado del JWT.

    Uso:
        @router.get("/endpoint")
        async def endpoint(user: User = Depends(get_current_user)):
            ...
    """
    if credentials is None:
        raise AuthenticationError("Token de autorizacion requerido")

    payload = verify_token(credentials.credentials, expected_type="access")
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFoundError("Usuario no encontrado o inactivo")

    # Inyectar usuario en el request state para uso en middleware posterior
    request.state.user = user
    request.state.institution_id = user.institution_id

    return user


async def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_async_session),
) -> User | None:
    """
    Dependency opcional: retorna None si no hay token valido.
    Para endpoints que funcionan con o sin autenticacion.
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(request, credentials, db)
    except (AuthenticationError, UserNotFoundError):
        return None
