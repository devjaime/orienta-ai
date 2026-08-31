"""
Vocari Backend - Identidad movil (invitado o cuenta).
"""

# ruff: noqa: B008

import uuid
from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import verify_token
from app.common.crypto import hash_token
from app.common.database import get_async_session
from app.common.exceptions import AuthenticationError
from app.mobile.models import MobileGuest

guest_token_header = APIKeyHeader(
    name="X-Vocari-Guest-Token",
    scheme_name="MobileGuestToken",
    description="Credencial revocable de invitado. Distinta del token de informe publico.",
    auto_error=False,
)
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class MobileActor:
    guest: MobileGuest | None = None
    user: User | None = None

    @property
    def actor_key(self) -> str:
        if self.user is not None:
            return f"user:{self.user.id}"
        if self.guest is not None:
            return f"guest:{self.guest.id}"
        return "anonymous"


async def get_mobile_actor(
    guest_token: str | None = Depends(guest_token_header),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_async_session),
) -> MobileActor:
    """Resuelve invitado o usuario autenticado para el API movil."""
    user: User | None = None
    if credentials is not None:
        payload = verify_token(credentials.credentials, expected_type="access")
        user_id = uuid.UUID(str(payload["sub"]))
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise AuthenticationError("Usuario no encontrado o inactivo")

    guest: MobileGuest | None = None
    if guest_token:
        result = await db.execute(
            select(MobileGuest).where(
                MobileGuest.token_hash == hash_token(guest_token),
                MobileGuest.revoked_at.is_(None),
            )
        )
        guest = result.scalar_one_or_none()
        if guest is None:
            raise AuthenticationError("Invitado no valido")

    if user is None and guest is None:
        raise AuthenticationError("Se requiere cuenta o invitado recuperable")
    return MobileActor(guest=guest, user=user)
