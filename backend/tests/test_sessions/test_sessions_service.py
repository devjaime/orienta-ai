"""
Tests del servicio de sessions — create, cancel, complete, list, get.

Usa DB real (testcontainers PostgreSQL) con Google APIs mockeadas.
"""

from __future__ import annotations

import uuid
from datetime import datetime, time, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.common.exceptions import (
    AlreadyCompletedError,
    ConsentRequiredError,
    DuplicateSessionError,
    InvalidScheduleError,
    NotFoundError,
    SessionNotFoundError,
)
from app.common.pagination import PaginationParams
from app.consent.models import ConsentMethod, ConsentRecord, ConsentType
from app.institutions.models import Institution, InstitutionPlan
from app.sessions.availability import OrientadorAvailability
from app.sessions.models import (
    Session,
    SessionAIAnalysis,
    SessionStatus,
    SessionTranscript,
    TranscriptSource,
)
from app.sessions.schemas import SessionCreate
from app.sessions.service import (
    cancel_session,
    complete_session,
    create_session,
    get_session_analysis,
    get_session_by_id,
    get_session_transcript,
    list_sessions,
)


# ---------------------------------------------------------------------------
# Fixtures especificas de sessions
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    """Institucion de prueba."""
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Sessions Test",
        slug=f"col-sessions-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=100,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def orientador(db_session: AsyncSession, institution: Institution) -> User:
    """Orientador de prueba."""
    user = User(
        id=uuid.uuid4(),
        email=f"orientador-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Orientador Test",
        role=UserRole.ORIENTADOR,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    """Estudiante de prueba con institution_id."""
    user = User(
        id=uuid.uuid4(),
        email=f"estudiante-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Estudiante Test",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def admin(db_session: AsyncSession, institution: Institution) -> User:
    """Super admin de prueba."""
    user = User(
        id=uuid.uuid4(),
        email=f"admin-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Admin Test",
        role=UserRole.SUPER_ADMIN,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def orientador_availability(
    db_session: AsyncSession, orientador: User
) -> OrientadorAvailability:
    """Bloque de disponibilidad: lunes a viernes 8:00-18:00."""
    blocks = []
    for day in range(1, 6):  # Lunes a viernes
        block = OrientadorAvailability(
            orientador_id=orientador.id,
            day_of_week=day,
            start_time=time(8, 0),
            end_time=time(18, 0),
            is_active=True,
        )
        db_session.add(block)
        blocks.append(block)
    await db_session.flush()
    return blocks[0]  # Retorna el primer bloque como referencia


@pytest_asyncio.fixture
async def consent_records(
    db_session: AsyncSession, estudiante: User
) -> list[ConsentRecord]:
    """Consentimiento de grabacion y procesamiento IA otorgados."""
    now = datetime.now(timezone.utc)
    records = []
    for ct in [ConsentType.RECORDING, ConsentType.AI_PROCESSING]:
        record = ConsentRecord(
            student_id=estudiante.id,
            granted_by=estudiante.id,
            consent_type=ct,
            granted=True,
            granted_at=now,
            ip_address="127.0.0.1",
            method=ConsentMethod.DIGITAL,
        )
        db_session.add(record)
        records.append(record)
    await db_session.flush()
    return records


@pytest_asyncio.fixture
async def scheduled_session(
    db_session: AsyncSession,
    institution: Institution,
    estudiante: User,
    orientador: User,
) -> Session:
    """Sesion agendada de prueba (creada directamente en BD)."""
    session = Session(
        institution_id=institution.id,
        student_id=estudiante.id,
        orientador_id=orientador.id,
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
        duration_minutes=30,
        status=SessionStatus.SCHEDULED,
        google_calendar_event_id="evt_test_123",
        google_meet_link="https://meet.google.com/abc-defg-hij",
    )
    db_session.add(session)
    await db_session.flush()
    return session


# ===========================================================================
# Tests: list_sessions
# ===========================================================================


class TestListSessions:
    """Tests para listar sesiones con filtro por rol."""

    @pytest.mark.asyncio
    async def test_estudiante_solo_ve_sus_sesiones(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        estudiante: User,
    ):
        """Estudiante solo ve sus propias sesiones."""
        pagination = PaginationParams(page=1, per_page=20)
        result = await list_sessions(db_session, estudiante, pagination)

        assert result.total == 1
        assert result.items[0].id == scheduled_session.id

    @pytest.mark.asyncio
    async def test_orientador_solo_ve_sesiones_asignadas(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        orientador: User,
    ):
        """Orientador solo ve sesiones que tiene asignadas."""
        pagination = PaginationParams(page=1, per_page=20)
        result = await list_sessions(db_session, orientador, pagination)

        assert result.total == 1
        assert result.items[0].orientador_id == orientador.id

    @pytest.mark.asyncio
    async def test_admin_ve_todas_las_sesiones(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        admin: User,
    ):
        """Super admin ve todas las sesiones."""
        pagination = PaginationParams(page=1, per_page=20)
        result = await list_sessions(db_session, admin, pagination)

        assert result.total >= 1

    @pytest.mark.asyncio
    async def test_filtro_por_status(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        estudiante: User,
    ):
        """Filtro por status funciona correctamente."""
        pagination = PaginationParams(page=1, per_page=20)

        # Filtrar por SCHEDULED
        result = await list_sessions(
            db_session, estudiante, pagination, status_filter=SessionStatus.SCHEDULED
        )
        assert result.total == 1

        # Filtrar por COMPLETED (no hay)
        result = await list_sessions(
            db_session, estudiante, pagination, status_filter=SessionStatus.COMPLETED
        )
        assert result.total == 0

    @pytest.mark.asyncio
    async def test_otro_estudiante_no_ve_sesiones_ajenas(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        institution: Institution,
    ):
        """Un estudiante no ve sesiones de otro estudiante."""
        otro = User(
            id=uuid.uuid4(),
            email=f"otro-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"google-{uuid.uuid4().hex[:12]}",
            name="Otro Estudiante",
            role=UserRole.ESTUDIANTE,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add(otro)
        await db_session.flush()

        pagination = PaginationParams(page=1, per_page=20)
        result = await list_sessions(db_session, otro, pagination)

        assert result.total == 0


# ===========================================================================
# Tests: get_session_by_id
# ===========================================================================


class TestGetSessionById:
    """Tests para obtener sesion por ID."""

    @pytest.mark.asyncio
    async def test_obtiene_sesion_propia(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        estudiante: User,
    ):
        """Estudiante obtiene su propia sesion."""
        session = await get_session_by_id(db_session, scheduled_session.id, estudiante)
        assert session.id == scheduled_session.id

    @pytest.mark.asyncio
    async def test_sesion_no_existente_lanza_error(
        self,
        db_session: AsyncSession,
        estudiante: User,
    ):
        """Sesion con ID inexistente lanza SessionNotFoundError."""
        with pytest.raises(SessionNotFoundError):
            await get_session_by_id(db_session, uuid.uuid4(), estudiante)

    @pytest.mark.asyncio
    async def test_sesion_ajena_no_accesible(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        institution: Institution,
    ):
        """Un estudiante no puede acceder a sesion de otro estudiante."""
        otro = User(
            id=uuid.uuid4(),
            email=f"otro2-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"google-{uuid.uuid4().hex[:12]}",
            name="Otro Estudiante 2",
            role=UserRole.ESTUDIANTE,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add(otro)
        await db_session.flush()

        with pytest.raises(SessionNotFoundError):
            await get_session_by_id(db_session, scheduled_session.id, otro)


# ===========================================================================
# Tests: create_session
# ===========================================================================


class TestCreateSession:
    """Tests para crear sesion (flujo completo con mocks de Google)."""

    @pytest.mark.asyncio
    async def test_crea_sesion_exitosamente(
        self,
        db_session: AsyncSession,
        estudiante: User,
        orientador: User,
        orientador_availability: OrientadorAvailability,
        consent_records: list[ConsentRecord],
    ):
        """Happy path: crea sesion con consentimiento, disponibilidad y Google Meet mock."""
        # Elegir un lunes dentro del horario de disponibilidad
        next_monday = _next_weekday(0)  # 0 = lunes
        scheduled_dt = next_monday.replace(hour=10, minute=0, second=0, microsecond=0)

        with patch("app.sessions.service.create_meet_event") as mock_meet:
            mock_meet.return_value = {
                "event_id": "evt_new",
                "meet_link": "https://meet.google.com/new-meet",
            }

            data = SessionCreate(
                orientador_id=orientador.id,
                preferred_datetime=scheduled_dt,
                notes="Quiero orientacion sobre carreras de ingenieria",
            )

            session = await create_session(db_session, estudiante, data)

        assert session.status == SessionStatus.SCHEDULED
        assert session.student_id == estudiante.id
        assert session.orientador_id == orientador.id
        assert session.google_calendar_event_id == "evt_new"
        assert session.google_meet_link == "https://meet.google.com/new-meet"
        assert session.notes_by_student == "Quiero orientacion sobre carreras de ingenieria"

    @pytest.mark.asyncio
    async def test_sin_consentimiento_lanza_error(
        self,
        db_session: AsyncSession,
        estudiante: User,
        orientador: User,
        orientador_availability: OrientadorAvailability,
    ):
        """Sin consentimiento de grabacion/IA, lanza ConsentRequiredError."""
        next_monday = _next_weekday(0)
        scheduled_dt = next_monday.replace(hour=10, minute=0, second=0, microsecond=0)

        data = SessionCreate(
            orientador_id=orientador.id,
            preferred_datetime=scheduled_dt,
        )

        with pytest.raises(ConsentRequiredError):
            await create_session(db_session, estudiante, data)

    @pytest.mark.asyncio
    async def test_orientador_no_disponible_lanza_error(
        self,
        db_session: AsyncSession,
        estudiante: User,
        orientador: User,
        consent_records: list[ConsentRecord],
    ):
        """Si el orientador no tiene disponibilidad, lanza InvalidScheduleError."""
        # Sabado — no hay disponibilidad
        next_saturday = _next_weekday(5)
        scheduled_dt = next_saturday.replace(hour=10, minute=0, second=0, microsecond=0)

        data = SessionCreate(
            orientador_id=orientador.id,
            preferred_datetime=scheduled_dt,
        )

        with pytest.raises(InvalidScheduleError):
            await create_session(db_session, estudiante, data)

    @pytest.mark.asyncio
    async def test_conflicto_horario_lanza_error(
        self,
        db_session: AsyncSession,
        estudiante: User,
        orientador: User,
        institution: Institution,
        orientador_availability: OrientadorAvailability,
        consent_records: list[ConsentRecord],
    ):
        """Si ya hay sesion en el mismo horario, lanza DuplicateSessionError."""
        next_monday = _next_weekday(0)
        scheduled_dt = next_monday.replace(hour=10, minute=0, second=0, microsecond=0)

        # Crear una sesion existente
        existing = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=scheduled_dt,
            duration_minutes=30,
            status=SessionStatus.SCHEDULED,
        )
        db_session.add(existing)
        await db_session.flush()

        data = SessionCreate(
            orientador_id=orientador.id,
            preferred_datetime=scheduled_dt,
        )

        with pytest.raises(DuplicateSessionError):
            await create_session(db_session, estudiante, data)

    @pytest.mark.asyncio
    async def test_google_meet_falla_sesion_se_crea_sin_link(
        self,
        db_session: AsyncSession,
        estudiante: User,
        orientador: User,
        orientador_availability: OrientadorAvailability,
        consent_records: list[ConsentRecord],
    ):
        """Si Google Meet falla, la sesion se crea igualmente (sin link Meet)."""
        next_monday = _next_weekday(0)
        scheduled_dt = next_monday.replace(hour=11, minute=0, second=0, microsecond=0)

        with patch("app.sessions.service.create_meet_event") as mock_meet:
            mock_meet.side_effect = Exception("Google API down")

            data = SessionCreate(
                orientador_id=orientador.id,
                preferred_datetime=scheduled_dt,
            )

            session = await create_session(db_session, estudiante, data)

        assert session.status == SessionStatus.SCHEDULED
        # meet_result queda como default {"event_id": None, "meet_link": None}
        assert session.google_calendar_event_id is None
        assert session.google_meet_link is None


# ===========================================================================
# Tests: cancel_session
# ===========================================================================


class TestCancelSession:
    """Tests para cancelar sesion."""

    @pytest.mark.asyncio
    async def test_cancela_sesion_programada(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        estudiante: User,
    ):
        """Happy path: cancela sesion programada y evento Calendar."""
        with patch("app.sessions.service.cancel_event") as mock_cancel:
            session = await cancel_session(db_session, scheduled_session.id, estudiante)

        assert session.status == SessionStatus.CANCELLED
        mock_cancel.assert_called_once_with(event_id="evt_test_123")

    @pytest.mark.asyncio
    async def test_cancelar_sesion_completada_lanza_error(
        self,
        db_session: AsyncSession,
        institution: Institution,
        estudiante: User,
        orientador: User,
    ):
        """No se puede cancelar una sesion ya completada."""
        completed = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=datetime.now(timezone.utc),
            duration_minutes=30,
            status=SessionStatus.COMPLETED,
            completed_at=datetime.now(timezone.utc),
        )
        db_session.add(completed)
        await db_session.flush()

        with pytest.raises(AlreadyCompletedError):
            await cancel_session(db_session, completed.id, estudiante)

    @pytest.mark.asyncio
    async def test_cancel_google_falla_sesion_se_cancela_igual(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        estudiante: User,
    ):
        """Si Google Calendar falla al cancelar, la sesion se cancela igualmente."""
        with patch("app.sessions.service.cancel_event") as mock_cancel:
            mock_cancel.side_effect = Exception("Google down")
            session = await cancel_session(db_session, scheduled_session.id, estudiante)

        assert session.status == SessionStatus.CANCELLED


# ===========================================================================
# Tests: complete_session
# ===========================================================================


class TestCompleteSession:
    """Tests para completar sesion (post-sesion flow)."""

    @pytest.mark.asyncio
    async def test_completa_sesion_con_transcripcion(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        orientador: User,
    ):
        """Happy path: completa sesion, extrae transcripcion, encola job IA."""
        with (
            patch("app.sessions.service.find_meet_transcript_doc") as mock_find,
            patch("app.sessions.service.extract_transcript_from_doc") as mock_extract,
            patch("app.sessions.service._enqueue_ai_analysis") as mock_enqueue,
        ):
            mock_find.return_value = "doc_transcript_id"
            mock_extract.return_value = {
                "full_text": "Maria: Hola Pedro: Hola",
                "segments": [
                    {"speaker": "Maria", "text": "Hola", "timestamp": "14:00"},
                    {"speaker": "Pedro", "text": "Hola", "timestamp": "14:01"},
                ],
                "word_count": 4,
            }
            mock_enqueue.return_value = "job_abc123"

            session, job_id = await complete_session(
                db_session, scheduled_session.id, orientador
            )

        assert session.status == SessionStatus.COMPLETED
        assert session.completed_at is not None
        assert job_id == "job_abc123"

    @pytest.mark.asyncio
    async def test_completa_sesion_ya_completada_lanza_error(
        self,
        db_session: AsyncSession,
        institution: Institution,
        estudiante: User,
        orientador: User,
    ):
        """Completar sesion ya completada lanza AlreadyCompletedError."""
        completed = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=datetime.now(timezone.utc),
            duration_minutes=30,
            status=SessionStatus.COMPLETED,
            completed_at=datetime.now(timezone.utc),
        )
        db_session.add(completed)
        await db_session.flush()

        with pytest.raises(AlreadyCompletedError):
            await complete_session(db_session, completed.id, orientador)

    @pytest.mark.asyncio
    async def test_completa_sesion_sin_meet_link_omite_transcripcion(
        self,
        db_session: AsyncSession,
        institution: Institution,
        estudiante: User,
        orientador: User,
    ):
        """Si la sesion no tiene Meet link, se omite la extraccion de transcripcion."""
        no_meet = Session(
            institution_id=institution.id,
            student_id=estudiante.id,
            orientador_id=orientador.id,
            scheduled_at=datetime.now(timezone.utc),
            duration_minutes=30,
            status=SessionStatus.SCHEDULED,
            google_meet_link=None,
        )
        db_session.add(no_meet)
        await db_session.flush()

        with patch("app.sessions.service._enqueue_ai_analysis") as mock_enqueue:
            mock_enqueue.return_value = None
            session, job_id = await complete_session(db_session, no_meet.id, orientador)

        assert session.status == SessionStatus.COMPLETED


# ===========================================================================
# Tests: get_session_transcript / get_session_analysis
# ===========================================================================


class TestGetTranscriptAndAnalysis:
    """Tests para obtener transcripcion y analisis IA."""

    @pytest.mark.asyncio
    async def test_obtiene_transcripcion(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        orientador: User,
    ):
        """Happy path: obtiene transcripcion de una sesion."""
        transcript = SessionTranscript(
            session_id=scheduled_session.id,
            google_docs_id="doc_test",
            full_text="Hola mundo",
            segments=[{"speaker": "Test", "text": "Hola mundo", "timestamp": "14:00"}],
            word_count=2,
            language="es",
            source=TranscriptSource.GOOGLE_MEET_AUTO,
        )
        db_session.add(transcript)
        await db_session.flush()

        result = await get_session_transcript(db_session, scheduled_session.id, orientador)
        assert result.full_text == "Hola mundo"
        assert result.word_count == 2

    @pytest.mark.asyncio
    async def test_transcripcion_no_encontrada_lanza_error(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        orientador: User,
    ):
        """Si no hay transcripcion, lanza NotFoundError."""
        with pytest.raises(NotFoundError, match="Transcripcion no encontrada"):
            await get_session_transcript(db_session, scheduled_session.id, orientador)

    @pytest.mark.asyncio
    async def test_obtiene_analisis_ia(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        orientador: User,
    ):
        """Happy path: obtiene analisis IA de una sesion."""
        analysis = SessionAIAnalysis(
            session_id=scheduled_session.id,
            summary="Resumen de la sesion de orientacion",
            interests_detected=[{"interest": "ingenieria", "confidence": 0.9}],
            skills_detected=[{"skill": "matematicas", "confidence": 0.8}],
            emotional_sentiment={"overall": "positivo", "score": 0.7},
            suggested_tests=[],
            suggested_games=[],
            model_used="anthropic/claude-3.5-sonnet",
            tokens_used=1500,
            processing_time_seconds=3.2,
        )
        db_session.add(analysis)
        await db_session.flush()

        result = await get_session_analysis(db_session, scheduled_session.id, orientador)
        assert result.summary == "Resumen de la sesion de orientacion"
        assert result.model_used == "anthropic/claude-3.5-sonnet"

    @pytest.mark.asyncio
    async def test_analisis_no_encontrado_lanza_error(
        self,
        db_session: AsyncSession,
        scheduled_session: Session,
        orientador: User,
    ):
        """Si no hay analisis IA, lanza NotFoundError."""
        with pytest.raises(NotFoundError, match="Analisis IA no disponible"):
            await get_session_analysis(db_session, scheduled_session.id, orientador)


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
