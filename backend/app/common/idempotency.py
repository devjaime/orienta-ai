"""
Vocari Backend - Registro de Idempotency-Key para escrituras reintentables.
"""

import uuid
from datetime import datetime

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy import JSON, DateTime, Integer, String, UniqueConstraint, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin
from app.common.crypto import hash_token

JSON_DOCUMENT = JSON().with_variant(JSONB(), "postgresql")


class IdempotencyReplay(Exception):  # noqa: N818
    """Indica que la escritura ya se proceso y debe reenviarse la respuesta."""

    def __init__(self, status_code: int, body: dict) -> None:
        self.status_code = status_code
        self.body = body
        super().__init__("idempotency_replay")


class IdempotencyRecord(UUIDPrimaryKeyMixin, Base):
    """Respuesta almacenada para una llave de idempotencia."""

    __tablename__ = "idempotency_records"
    __table_args__ = (
        UniqueConstraint("scope_hash", "idempotency_key", name="uq_idempotency_scope_key"),
    )

    scope_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


def build_idempotency_scope(request: Request, actor: str) -> str:
    """Construye un alcance estable por metodo, ruta y actor."""
    raw_scope = f"{request.method}:{request.url.path}:{actor}"
    return hash_token(raw_scope)


async def replay_if_present(
    db: AsyncSession,
    request: Request,
    actor: str,
) -> str | None:
    """Devuelve la llave nueva o relanza la respuesta previa."""
    raw_key = request.headers.get("Idempotency-Key")
    if raw_key is None or raw_key.strip() == "":
        return None
    key = raw_key.strip()[:128]
    scope_hash = build_idempotency_scope(request, actor)
    result = await db.execute(
        select(IdempotencyRecord).where(
            IdempotencyRecord.scope_hash == scope_hash,
            IdempotencyRecord.idempotency_key == key,
        )
    )
    record = result.scalar_one_or_none()
    if record is not None:
        raise IdempotencyReplay(record.status_code, record.response_json)
    return key


async def store_idempotent_response(
    db: AsyncSession,
    request: Request,
    actor: str,
    key: str | None,
    status_code: int,
    body: dict,
) -> None:
    """Guarda la respuesta canónica de una escritura."""
    if key is None:
        return
    record = IdempotencyRecord(
        id=uuid.uuid4(),
        scope_hash=build_idempotency_scope(request, actor),
        idempotency_key=key,
        status_code=status_code,
        response_json=body,
    )
    db.add(record)
    await db.commit()


async def idempotency_replay_handler(_request: Request, exc: IdempotencyReplay) -> JSONResponse:
    """Devuelve el cuerpo original de una escritura reintentada."""
    return JSONResponse(status_code=exc.status_code, content=exc.body)
