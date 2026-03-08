"""
Tests del servicio de availability — CRUD, overlap, is_available.

Usa BD real (testcontainers PostgreSQL).
"""

from __future__ import annotations

import uuid
from datetime import datetime, time, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.common.exceptions import ConflictError, NotFoundError
from app.institutions.models import Institution, InstitutionPlan
from app.sessions.availability import (
    AvailabilityBlockCreate,
    OrientadorAvailability,
    create_availability_block,
    delete_availability_block,
    is_orientador_available,
    list_availability,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Availability Test",
        slug=f"col-avail-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def orientador(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"orient-avail-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Orientador Avail",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ===========================================================================
# Tests: create_availability_block
# ===========================================================================


class TestCreateAvailabilityBlock:
    """Tests para crear bloques de disponibilidad."""

    @pytest.mark.asyncio
    async def test_crea_bloque_exitosamente(
        self, db_session: AsyncSession, orientador: User
    ):
        """Happy path: crea bloque lunes 9:00-12:00."""
        data = AvailabilityBlockCreate(
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )

        block = await create_availability_block(db_session, orientador.id, data)

        assert block.orientador_id == orientador.id
        assert block.day_of_week == 1
        assert block.start_time == time(9, 0)
        assert block.end_time == time(12, 0)
        assert block.is_active is True

    @pytest.mark.asyncio
    async def test_hora_inicio_mayor_que_fin_lanza_error(
        self, db_session: AsyncSession, orientador: User
    ):
        """start_time >= end_time lanza ConflictError."""
        data = AvailabilityBlockCreate(
            day_of_week=1,
            start_time=time(14, 0),
            end_time=time(10, 0),
        )

        with pytest.raises(ConflictError, match="hora de inicio"):
            await create_availability_block(db_session, orientador.id, data)

    @pytest.mark.asyncio
    async def test_hora_inicio_igual_a_fin_lanza_error(
        self, db_session: AsyncSession, orientador: User
    ):
        """start_time == end_time lanza ConflictError."""
        data = AvailabilityBlockCreate(
            day_of_week=2,
            start_time=time(10, 0),
            end_time=time(10, 0),
        )

        with pytest.raises(ConflictError, match="hora de inicio"):
            await create_availability_block(db_session, orientador.id, data)

    @pytest.mark.asyncio
    async def test_solapamiento_lanza_error(
        self, db_session: AsyncSession, orientador: User
    ):
        """Crear bloque que se solapa con uno existente lanza ConflictError."""
        # Crear bloque 9:00-12:00 lunes
        data1 = AvailabilityBlockCreate(
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )
        await create_availability_block(db_session, orientador.id, data1)

        # Intentar crear bloque 11:00-14:00 lunes (se solapa)
        data2 = AvailabilityBlockCreate(
            day_of_week=1,
            start_time=time(11, 0),
            end_time=time(14, 0),
        )

        with pytest.raises(ConflictError, match="Conflicto con bloque existente"):
            await create_availability_block(db_session, orientador.id, data2)

    @pytest.mark.asyncio
    async def test_bloques_adyacentes_no_se_solapan(
        self, db_session: AsyncSession, orientador: User
    ):
        """Bloques adyacentes (9:00-12:00 + 12:00-15:00) no se solapan."""
        data1 = AvailabilityBlockCreate(
            day_of_week=3,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )
        await create_availability_block(db_session, orientador.id, data1)

        data2 = AvailabilityBlockCreate(
            day_of_week=3,
            start_time=time(12, 0),
            end_time=time(15, 0),
        )
        # No debe lanzar error
        block2 = await create_availability_block(db_session, orientador.id, data2)
        assert block2.start_time == time(12, 0)

    @pytest.mark.asyncio
    async def test_mismo_horario_distinto_dia_no_se_solapa(
        self, db_session: AsyncSession, orientador: User
    ):
        """Mismo horario en diferentes dias no se solapan."""
        data1 = AvailabilityBlockCreate(
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )
        await create_availability_block(db_session, orientador.id, data1)

        data2 = AvailabilityBlockCreate(
            day_of_week=2,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )
        block2 = await create_availability_block(db_session, orientador.id, data2)
        assert block2.day_of_week == 2


# ===========================================================================
# Tests: list_availability
# ===========================================================================


class TestListAvailability:
    """Tests para listar bloques de disponibilidad."""

    @pytest.mark.asyncio
    async def test_lista_bloques_activos(
        self, db_session: AsyncSession, orientador: User
    ):
        """Solo retorna bloques activos, ordenados por dia y hora."""
        # Crear bloques
        for day, start, end in [(1, time(9, 0), time(12, 0)), (3, time(14, 0), time(17, 0))]:
            block = OrientadorAvailability(
                orientador_id=orientador.id,
                day_of_week=day,
                start_time=start,
                end_time=end,
                is_active=True,
            )
            db_session.add(block)

        # Bloque inactivo
        inactive = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=5,
            start_time=time(8, 0),
            end_time=time(10, 0),
            is_active=False,
        )
        db_session.add(inactive)
        await db_session.flush()

        blocks = await list_availability(db_session, orientador.id)

        assert len(blocks) == 2
        assert blocks[0].day_of_week == 1
        assert blocks[1].day_of_week == 3

    @pytest.mark.asyncio
    async def test_orientador_sin_bloques_retorna_lista_vacia(
        self, db_session: AsyncSession, orientador: User
    ):
        """Orientador sin bloques retorna lista vacia."""
        blocks = await list_availability(db_session, orientador.id)
        assert blocks == []


# ===========================================================================
# Tests: delete_availability_block
# ===========================================================================


class TestDeleteAvailabilityBlock:
    """Tests para eliminar (desactivar) bloques."""

    @pytest.mark.asyncio
    async def test_elimina_bloque(
        self, db_session: AsyncSession, orientador: User
    ):
        """Happy path: desactiva un bloque existente."""
        block = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(12, 0),
            is_active=True,
        )
        db_session.add(block)
        await db_session.flush()

        await delete_availability_block(db_session, orientador.id, block.id)

        # Verificar que esta inactivo
        blocks = await list_availability(db_session, orientador.id)
        assert len(blocks) == 0

    @pytest.mark.asyncio
    async def test_bloque_no_encontrado_lanza_error(
        self, db_session: AsyncSession, orientador: User
    ):
        """Eliminar bloque inexistente lanza NotFoundError."""
        with pytest.raises(NotFoundError, match="Bloque de disponibilidad"):
            await delete_availability_block(db_session, orientador.id, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_no_puede_eliminar_bloque_de_otro_orientador(
        self, db_session: AsyncSession, orientador: User, institution: Institution
    ):
        """Un orientador no puede eliminar bloques de otro orientador."""
        otro = User(
            id=uuid.uuid4(),
            email=f"otro-orient-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"google-{uuid.uuid4().hex[:12]}",
            name="Otro Orientador",
            role=UserRole.ORIENTADOR,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add(otro)

        block = OrientadorAvailability(
            orientador_id=otro.id,
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(12, 0),
            is_active=True,
        )
        db_session.add(block)
        await db_session.flush()

        with pytest.raises(NotFoundError):
            await delete_availability_block(db_session, orientador.id, block.id)


# ===========================================================================
# Tests: is_orientador_available
# ===========================================================================


class TestIsOrientadorAvailable:
    """Tests para verificar disponibilidad."""

    @pytest.mark.asyncio
    async def test_disponible_dentro_de_horario(
        self, db_session: AsyncSession, orientador: User
    ):
        """Orientador disponible dentro de su bloque horario."""
        block = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=1,  # Lunes
            start_time=time(8, 0),
            end_time=time(18, 0),
            is_active=True,
        )
        db_session.add(block)
        await db_session.flush()

        # Probar un lunes a las 10:00
        next_monday = _next_weekday(0)
        test_dt = next_monday.replace(hour=10, minute=0, second=0, microsecond=0)

        result = await is_orientador_available(db_session, orientador.id, test_dt)
        assert result is True

    @pytest.mark.asyncio
    async def test_no_disponible_fuera_de_horario(
        self, db_session: AsyncSession, orientador: User
    ):
        """Orientador NO disponible fuera de su bloque horario."""
        block = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=1,  # Lunes
            start_time=time(9, 0),
            end_time=time(12, 0),
            is_active=True,
        )
        db_session.add(block)
        await db_session.flush()

        # Probar un lunes a las 15:00 (fuera del bloque)
        next_monday = _next_weekday(0)
        test_dt = next_monday.replace(hour=15, minute=0, second=0, microsecond=0)

        result = await is_orientador_available(db_session, orientador.id, test_dt)
        assert result is False

    @pytest.mark.asyncio
    async def test_no_disponible_en_dia_sin_bloque(
        self, db_session: AsyncSession, orientador: User
    ):
        """Orientador NO disponible en dia sin bloque (ej: sabado)."""
        block = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=1,  # Solo lunes
            start_time=time(8, 0),
            end_time=time(18, 0),
            is_active=True,
        )
        db_session.add(block)
        await db_session.flush()

        # Probar un sabado
        next_saturday = _next_weekday(5)
        test_dt = next_saturday.replace(hour=10, minute=0, second=0, microsecond=0)

        result = await is_orientador_available(db_session, orientador.id, test_dt)
        assert result is False

    @pytest.mark.asyncio
    async def test_no_disponible_bloque_inactivo(
        self, db_session: AsyncSession, orientador: User
    ):
        """Bloque inactivo no se considera para disponibilidad."""
        block = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=1,
            start_time=time(8, 0),
            end_time=time(18, 0),
            is_active=False,
        )
        db_session.add(block)
        await db_session.flush()

        next_monday = _next_weekday(0)
        test_dt = next_monday.replace(hour=10, minute=0, second=0, microsecond=0)

        result = await is_orientador_available(db_session, orientador.id, test_dt)
        assert result is False


# ===========================================================================
# Helpers
# ===========================================================================


def _next_weekday(weekday: int) -> datetime:
    """Retorna el proximo dia de la semana (0=lunes, 6=domingo) en UTC."""
    now = datetime.now(timezone.utc)
    days_ahead = weekday - now.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return now + timedelta(days=days_ahead)
