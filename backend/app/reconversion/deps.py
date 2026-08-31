"""
Vocari Backend - Autorizacion de sesion publica de reconversion.
"""

# ruff: noqa: B008

import uuid

from fastapi import Depends, Request
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.crypto import tokens_match
from app.common.database import get_async_session
from app.common.exceptions import AuthenticationError, NotFoundError
from app.common.idempotency import replay_if_present
from app.common.rate_limit import enforce_public_rate_limit
from app.reconversion.models import AdultReconversionSession
from app.reconversion.service import get_session_by_id

edit_token_header = APIKeyHeader(
    name="X-Vocari-Edit-Token",
    scheme_name="ReconversionEditToken",
    description="Token privado para editar una sesion. Distinto del enlace publico del informe.",
    auto_error=False,
)


async def require_editable_session(
    session_id: uuid.UUID,
    edit_token: str | None = Depends(edit_token_header),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionSession:
    """Exige el token de edicion. Un UUID ajeno no revela PII."""
    if not edit_token:
        raise AuthenticationError("Token de edicion requerido")
    session = await get_session_by_id(db, session_id)
    if not tokens_match(edit_token, session.edit_token_hash):
        raise NotFoundError("Sesion de reconversion no encontrada")
    return session


async def begin_reconversion_write(
    request: Request,
    session: AdultReconversionSession = Depends(require_editable_session),
    db: AsyncSession = Depends(get_async_session),
) -> tuple[AdultReconversionSession, str | None]:
    """Valida edicion e intenta reutilizar Idempotency-Key."""
    key = await replay_if_present(db, request, f"session:{session.id}")
    return session, key


async def limit_public_reconversion(request: Request) -> None:
    await enforce_public_rate_limit(request, "reconversion-public")
