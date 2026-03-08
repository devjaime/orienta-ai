"""
Vocari Backend - Modelo y servicio de disponibilidad del orientador.

T2.4: CRUD de disponibilidad horaria, validacion de conflictos.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, time

import structlog
from pydantic import BaseModel, Field
from sqlalchemy import Enum, ForeignKey, Integer, Time, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, UUIDPrimaryKeyMixin
from app.common.exceptions import ConflictError, NotFoundError

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Modelo
# ---------------------------------------------------------------------------


class DayOfWeek(int, enum.Enum):
    """Dias de la semana (ISO 8601: 1=lunes, 7=domingo)."""

    LUNES = 1
    MARTES = 2
    MIERCOLES = 3
    JUEVES = 4
    VIERNES = 5
    SABADO = 6
    DOMINGO = 7


class OrientadorAvailability(UUIDPrimaryKeyMixin, Base):
    """Bloque de disponibilidad semanal del orientador."""

    __tablename__ = "orientador_availability"

    orientador_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_of_week: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    def __repr__(self) -> str:
        return (
            f"<OrientadorAvailability orientador={self.orientador_id} "
            f"dia={self.day_of_week} {self.start_time}-{self.end_time}>"
        )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class AvailabilityBlockCreate(BaseModel):
    """Crear un bloque de disponibilidad."""

    day_of_week: int = Field(ge=1, le=7, description="1=lunes, 7=domingo")
    start_time: time
    end_time: time


class AvailabilityBlockResponse(BaseModel):
    """Respuesta de un bloque de disponibilidad."""

    id: uuid.UUID
    orientador_id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool

    model_config = {"from_attributes": True}


class AvailabilityListResponse(BaseModel):
    """Lista de bloques de disponibilidad."""

    items: list[AvailabilityBlockResponse]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


async def list_availability(
    db: AsyncSession,
    orientador_id: uuid.UUID,
) -> list[OrientadorAvailability]:
    """Lista bloques de disponibilidad de un orientador."""
    query = (
        select(OrientadorAvailability)
        .where(
            OrientadorAvailability.orientador_id == orientador_id,
            OrientadorAvailability.is_active.is_(True),
        )
        .order_by(OrientadorAvailability.day_of_week, OrientadorAvailability.start_time)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_availability_block(
    db: AsyncSession,
    orientador_id: uuid.UUID,
    data: AvailabilityBlockCreate,
) -> OrientadorAvailability:
    """Crea un bloque de disponibilidad, verificando conflictos."""
    if data.start_time >= data.end_time:
        raise ConflictError("La hora de inicio debe ser anterior a la hora de fin")

    # Verificar solapamiento
    existing = await _check_overlap(db, orientador_id, data.day_of_week, data.start_time, data.end_time)
    if existing:
        raise ConflictError(
            f"Conflicto con bloque existente: {existing.start_time}-{existing.end_time}"
        )

    block = OrientadorAvailability(
        orientador_id=orientador_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    db.add(block)
    await db.flush()

    logger.info(
        "Bloque de disponibilidad creado",
        orientador_id=str(orientador_id),
        day=data.day_of_week,
        start=str(data.start_time),
        end=str(data.end_time),
    )
    return block


async def delete_availability_block(
    db: AsyncSession,
    orientador_id: uuid.UUID,
    block_id: uuid.UUID,
) -> None:
    """Elimina (desactiva) un bloque de disponibilidad."""
    query = select(OrientadorAvailability).where(
        OrientadorAvailability.id == block_id,
        OrientadorAvailability.orientador_id == orientador_id,
    )
    result = await db.execute(query)
    block = result.scalar_one_or_none()

    if not block:
        raise NotFoundError("Bloque de disponibilidad no encontrado")

    block.is_active = False
    await db.flush()
    logger.info("Bloque de disponibilidad eliminado", block_id=str(block_id))


async def is_orientador_available(
    db: AsyncSession,
    orientador_id: uuid.UUID,
    requested_datetime: datetime,
    duration_minutes: int = 30,
) -> bool:
    """Verifica si un orientador esta disponible en un horario."""
    day_of_week = requested_datetime.isoweekday()  # 1=lunes, 7=domingo
    requested_start = requested_datetime.time()
    # Calcular hora de fin
    from datetime import timedelta

    requested_end = (requested_datetime + timedelta(minutes=duration_minutes)).time()

    query = select(OrientadorAvailability).where(
        OrientadorAvailability.orientador_id == orientador_id,
        OrientadorAvailability.day_of_week == day_of_week,
        OrientadorAvailability.is_active.is_(True),
        OrientadorAvailability.start_time <= requested_start,
        OrientadorAvailability.end_time >= requested_end,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def _check_overlap(
    db: AsyncSession,
    orientador_id: uuid.UUID,
    day_of_week: int,
    start_time: time,
    end_time: time,
) -> OrientadorAvailability | None:
    """Verifica si un bloque se solapa con uno existente."""
    query = select(OrientadorAvailability).where(
        OrientadorAvailability.orientador_id == orientador_id,
        OrientadorAvailability.day_of_week == day_of_week,
        OrientadorAvailability.is_active.is_(True),
        # Solapamiento: nuevo empieza antes de que termine existente
        # Y nuevo termina despues de que empiece existente
        OrientadorAvailability.start_time < end_time,
        OrientadorAvailability.end_time > start_time,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()
