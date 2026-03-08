"""
Vocari Backend - Servicio de Sessions.

Logica de negocio: agendamiento, completion flow, transcripcion, grabacion.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import func, select
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
from app.common.pagination import PaginatedResult, PaginationParams
from app.common.tenant import apply_tenant_filter
from app.consent.service import require_consent_for_session
from app.sessions.availability import is_orientador_available
from app.sessions.google_meet import (
    cancel_event,
    create_meet_event,
    extract_transcript_from_doc,
    find_meet_transcript_doc,
    get_recording_metadata,
)
from app.sessions.models import (
    Session,
    SessionAIAnalysis,
    SessionRecording,
    SessionStatus,
    SessionTranscript,
    TranscriptSource,
)
from app.sessions.schemas import SessionCreate

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Listar orientadores de la institucion del estudiante
# ---------------------------------------------------------------------------


async def list_orientadores_for_student(
    db: AsyncSession,
    user: User,
) -> list[User]:
    """
    Lista orientadores activos de la misma institucion del estudiante.

    Usado por la pagina de agendar sesion.
    """
    if not user.institution_id:
        return []

    query = (
        select(User)
        .where(
            User.institution_id == user.institution_id,
            User.role == UserRole.ORIENTADOR,
            User.is_active.is_(True),
        )
        .order_by(User.name)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Estadisticas de orientador
# ---------------------------------------------------------------------------


async def get_orientador_stats(
    db: AsyncSession,
    user: User,
) -> dict:
    """
    Obtiene estadisticas para el dashboard del orientador.

    - Sesiones de hoy
    - Analisis IA pendientes de revision
    - Estudiantes unicos asignados
    - Alertas activas (sesiones no_show recientes)
    """
    from datetime import date

    today = date.today()

    # Sesiones de hoy
    today_query = select(func.count()).select_from(Session).where(
        Session.orientador_id == user.id,
        func.date(Session.scheduled_at) == today,
        Session.status.in_([
            SessionStatus.SCHEDULED,
            SessionStatus.IN_PROGRESS,
            SessionStatus.COMPLETED,
        ]),
    )
    today_result = await db.execute(today_query)
    sesiones_hoy = today_result.scalar() or 0

    # Reviews pendientes (analisis IA sin revisar)
    reviews_query = (
        select(func.count())
        .select_from(SessionAIAnalysis)
        .join(Session, Session.id == SessionAIAnalysis.session_id)
        .where(
            Session.orientador_id == user.id,
            SessionAIAnalysis.reviewed_by_orientador.is_(False),
        )
    )
    reviews_result = await db.execute(reviews_query)
    reviews_pendientes = reviews_result.scalar() or 0

    # Estudiantes unicos asignados (con sesiones activas)
    students_query = (
        select(func.count(func.distinct(Session.student_id)))
        .select_from(Session)
        .where(
            Session.orientador_id == user.id,
            Session.status.in_([
                SessionStatus.SCHEDULED,
                SessionStatus.IN_PROGRESS,
                SessionStatus.COMPLETED,
            ]),
        )
    )
    students_result = await db.execute(students_query)
    estudiantes_asignados = students_result.scalar() or 0

    # Alertas: sesiones no_show en ultimos 7 dias
    from datetime import timedelta

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    alerts_query = select(func.count()).select_from(Session).where(
        Session.orientador_id == user.id,
        Session.status == SessionStatus.NO_SHOW,
        Session.scheduled_at >= week_ago,
    )
    alerts_result = await db.execute(alerts_query)
    alertas_activas = alerts_result.scalar() or 0

    return {
        "sesiones_hoy": sesiones_hoy,
        "reviews_pendientes": reviews_pendientes,
        "estudiantes_asignados": estudiantes_asignados,
        "alertas_activas": alertas_activas,
    }


# ---------------------------------------------------------------------------
# Listar sesiones
# ---------------------------------------------------------------------------


async def list_sessions(
    db: AsyncSession,
    user: User,
    pagination: PaginationParams,
    status_filter: SessionStatus | None = None,
) -> PaginatedResult[Session]:
    """
    Lista sesiones segun el rol del usuario.

    - estudiante: solo sus sesiones
    - orientador: solo sesiones asignadas
    - admin/super_admin: todas (con filtro de tenant)
    """
    # Count
    count_query = select(func.count()).select_from(Session)
    count_query = _apply_role_filter(count_query, user)
    if status_filter:
        count_query = count_query.where(Session.status == status_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Items
    query = select(Session).order_by(Session.scheduled_at.desc())
    query = _apply_role_filter(query, user)
    if status_filter:
        query = query.where(Session.status == status_filter)
    query = query.offset(pagination.offset).limit(pagination.per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
    )


# ---------------------------------------------------------------------------
# Obtener sesion por ID
# ---------------------------------------------------------------------------


async def get_session_by_id(
    db: AsyncSession,
    session_id: uuid.UUID,
    user: User,
) -> Session:
    """Obtiene una sesion por ID, verificando acceso."""
    query = select(Session).where(Session.id == session_id)
    query = _apply_role_filter(query, user)

    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise SessionNotFoundError()

    return session


# ---------------------------------------------------------------------------
# Crear sesion (T2.3)
# ---------------------------------------------------------------------------


async def create_session(
    db: AsyncSession,
    user: User,
    data: SessionCreate,
) -> Session:
    """
    Crea una nueva sesion de orientacion.

    Flujo:
    1. Verificar consentimiento (T2.10)
    2. Verificar disponibilidad del orientador (T2.4)
    3. Verificar que no haya conflicto de horario
    4. Crear evento en Google Calendar + Meet link (T2.2)
    5. Guardar sesion en BD
    """
    # 1. Verificar consentimiento
    await require_consent_for_session(db, user.id)

    # 2. Verificar disponibilidad
    available = await is_orientador_available(db, data.orientador_id, data.preferred_datetime)
    if not available:
        raise InvalidScheduleError(
            "El orientador no esta disponible en el horario solicitado"
        )

    # 3. Verificar conflicto de horario
    await _check_schedule_conflict(db, data.orientador_id, data.preferred_datetime)

    # 4. Crear evento Calendar + Meet
    meet_result = {"event_id": None, "meet_link": None}
    try:
        meet_result = create_meet_event(
            summary=f"Sesion Vocari - Orientacion Vocacional",
            start_time=data.preferred_datetime,
            duration_minutes=30,
            description="Sesion de orientacion vocacional via Vocari.",
        )
    except Exception as exc:
        logger.warning("No se pudo crear evento Meet, continuando sin link", error=str(exc))

    # 5. Crear sesion
    if not user.institution_id:
        from app.common.exceptions import ValidationError

        raise ValidationError("El usuario no pertenece a ninguna institucion")

    session = Session(
        institution_id=user.institution_id,
        student_id=user.id,
        orientador_id=data.orientador_id,
        scheduled_at=data.preferred_datetime,
        duration_minutes=30,
        status=SessionStatus.SCHEDULED,
        google_calendar_event_id=meet_result.get("event_id"),
        google_meet_link=meet_result.get("meet_link"),
        notes_by_student=data.notes,
    )
    db.add(session)
    await db.flush()

    logger.info(
        "Sesion creada",
        session_id=str(session.id),
        student_id=str(user.id),
        orientador_id=str(data.orientador_id),
        scheduled_at=str(data.preferred_datetime),
    )

    return session


# ---------------------------------------------------------------------------
# Cancelar sesion
# ---------------------------------------------------------------------------


async def cancel_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user: User,
) -> Session:
    """Cancela una sesion programada."""
    session = await get_session_by_id(db, session_id, user)

    if session.status not in (SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS):
        raise AlreadyCompletedError("Solo se pueden cancelar sesiones programadas o en progreso")

    session.status = SessionStatus.CANCELLED

    # Cancelar evento Calendar si existe
    if session.google_calendar_event_id:
        try:
            cancel_event(event_id=session.google_calendar_event_id)
        except Exception as exc:
            logger.warning(
                "No se pudo cancelar evento Calendar",
                session_id=str(session_id),
                error=str(exc),
            )

    await db.flush()
    logger.info("Sesion cancelada", session_id=str(session_id))
    return session


# ---------------------------------------------------------------------------
# Completar sesion (T2.7)
# ---------------------------------------------------------------------------


async def complete_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user: User,
    notes: str | None = None,
) -> tuple[Session, str | None]:
    """
    Marca sesion como completada y ejecuta flujo post-sesion.

    Flujo:
    1. Marcar como completada
    2. Intentar extraer transcripcion de Google Docs
    3. Intentar obtener metadata de grabacion
    4. Encolar job de analisis IA (retorna job_id)
    """
    session = await get_session_by_id(db, session_id, user)

    if session.status == SessionStatus.COMPLETED:
        raise AlreadyCompletedError("La sesion ya fue completada")

    # 1. Marcar como completada
    now = datetime.now(timezone.utc)
    session.status = SessionStatus.COMPLETED
    session.completed_at = now

    # 2. Extraer transcripcion (si hay Meet link)
    if session.google_meet_link:
        await _try_extract_transcript(db, session)

    # 3. Encolar job de analisis IA
    job_id = _enqueue_ai_analysis(session.id)

    await db.flush()

    logger.info(
        "Sesion completada",
        session_id=str(session_id),
        job_id=job_id,
    )

    return session, job_id


# ---------------------------------------------------------------------------
# Obtener transcripcion
# ---------------------------------------------------------------------------


async def get_session_transcript(
    db: AsyncSession,
    session_id: uuid.UUID,
    user: User,
) -> SessionTranscript:
    """Obtiene la transcripcion de una sesion."""
    # Verificar acceso a la sesion
    await get_session_by_id(db, session_id, user)

    query = select(SessionTranscript).where(SessionTranscript.session_id == session_id)
    result = await db.execute(query)
    transcript = result.scalar_one_or_none()

    if not transcript:
        raise NotFoundError("Transcripcion no encontrada para esta sesion")

    return transcript


# ---------------------------------------------------------------------------
# Obtener analisis IA
# ---------------------------------------------------------------------------


async def get_session_analysis(
    db: AsyncSession,
    session_id: uuid.UUID,
    user: User,
) -> SessionAIAnalysis:
    """Obtiene el analisis IA de una sesion."""
    await get_session_by_id(db, session_id, user)

    query = select(SessionAIAnalysis).where(SessionAIAnalysis.session_id == session_id)
    result = await db.execute(query)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise NotFoundError("Analisis IA no disponible para esta sesion")

    return analysis


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _apply_role_filter(query, user: User):  # type: ignore[no-untyped-def]
    """Filtra sesiones segun el rol del usuario."""
    if user.role == UserRole.SUPER_ADMIN:
        return query
    if user.role in (UserRole.ADMIN_COLEGIO,):
        return apply_tenant_filter(query, Session.institution_id, user.institution_id)
    if user.role == UserRole.ORIENTADOR:
        return query.where(Session.orientador_id == user.id)
    if user.role == UserRole.ESTUDIANTE:
        return query.where(Session.student_id == user.id)
    if user.role == UserRole.APODERADO:
        # Apoderado ve sesiones de sus hijos - simplified here
        return query.where(Session.student_id == user.id)  # TODO: join with parent_student_links
    return query


async def _check_schedule_conflict(
    db: AsyncSession,
    orientador_id: uuid.UUID,
    scheduled_at: datetime,
) -> None:
    """Verifica que no haya otra sesion en el mismo horario."""
    from datetime import timedelta

    window_start = scheduled_at - timedelta(minutes=29)
    window_end = scheduled_at + timedelta(minutes=29)

    query = select(Session).where(
        Session.orientador_id == orientador_id,
        Session.status.in_([SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS]),
        Session.scheduled_at >= window_start,
        Session.scheduled_at <= window_end,
    )
    result = await db.execute(query)
    conflict = result.scalar_one_or_none()

    if conflict:
        raise DuplicateSessionError(
            f"El orientador ya tiene una sesion programada a las {conflict.scheduled_at}"
        )


async def _try_extract_transcript(db: AsyncSession, session: Session) -> None:
    """Intenta extraer transcripcion de Google Docs post-sesion."""
    if not session.google_meet_link:
        return

    # Extraer codigo Meet del link (ej: https://meet.google.com/abc-defg-hij)
    meet_code = session.google_meet_link.rstrip("/").split("/")[-1]

    try:
        # Buscar documento de transcripcion
        doc_id = find_meet_transcript_doc(meet_code=meet_code)
        if not doc_id:
            logger.info(
                "Transcripcion no disponible aun, encolando retry",
                session_id=str(session.id),
            )
            _enqueue_transcript_retry(session.id, attempt=1)
            return

        # Extraer contenido
        transcript_data = extract_transcript_from_doc(google_docs_id=doc_id)

        # Guardar en BD
        transcript = SessionTranscript(
            session_id=session.id,
            google_docs_id=doc_id,
            full_text=transcript_data["full_text"],
            segments=transcript_data["segments"],
            word_count=transcript_data["word_count"],
            language="es",
            source=TranscriptSource.GOOGLE_MEET_AUTO,
        )
        db.add(transcript)

        logger.info(
            "Transcripcion extraida y guardada",
            session_id=str(session.id),
            word_count=transcript_data["word_count"],
        )

    except Exception as exc:
        logger.warning(
            "No se pudo extraer transcripcion, encolando retry",
            session_id=str(session.id),
            error=str(exc),
        )
        _enqueue_transcript_retry(session.id, attempt=1)


def _enqueue_ai_analysis(session_id: uuid.UUID) -> str | None:
    """Encola job de analisis IA via rq."""
    try:
        from redis import Redis
        from rq import Queue

        from app.config import get_settings

        settings = get_settings()
        redis_conn = Redis.from_url(settings.redis_url)
        queue = Queue("ai_analysis", connection=redis_conn)

        job = queue.enqueue(
            "app.ai_engine.jobs.transcript_analysis_job",
            str(session_id),
            job_timeout="300",
            retry=3,
        )

        logger.info("Job de analisis IA encolado", job_id=job.id, session_id=str(session_id))
        return job.id

    except Exception as exc:
        logger.warning("No se pudo encolar job de analisis IA", error=str(exc))
        return None


# Delays para retry de transcripcion: 5min, 15min, 45min (backoff exponencial)
TRANSCRIPT_RETRY_DELAYS = [300, 900, 2700]
MAX_TRANSCRIPT_RETRIES = len(TRANSCRIPT_RETRY_DELAYS)


def _enqueue_transcript_retry(
    session_id: uuid.UUID,
    attempt: int,
) -> str | None:
    """Encola un job de retry para extraccion de transcripcion con delay."""
    if attempt > MAX_TRANSCRIPT_RETRIES:
        logger.warning(
            "Maximo de reintentos de transcripcion alcanzado",
            session_id=str(session_id),
            attempts=attempt,
        )
        return None

    try:
        from datetime import timedelta

        from redis import Redis
        from rq import Queue

        from app.config import get_settings

        settings = get_settings()
        redis_conn = Redis.from_url(settings.redis_url)
        queue = Queue("ai_analysis", connection=redis_conn)

        delay_seconds = TRANSCRIPT_RETRY_DELAYS[attempt - 1]

        job = queue.enqueue_in(
            timedelta(seconds=delay_seconds),
            "app.sessions.jobs.retry_transcript_extraction_job",
            str(session_id),
            attempt,
            job_timeout="120",
        )

        logger.info(
            "Retry de transcripcion encolado",
            job_id=job.id,
            session_id=str(session_id),
            attempt=attempt,
            delay_seconds=delay_seconds,
        )
        return job.id

    except Exception as exc:
        logger.warning(
            "No se pudo encolar retry de transcripcion",
            session_id=str(session_id),
            error=str(exc),
        )
        return None


async def retry_transcript_extraction(
    db: AsyncSession,
    session_id: uuid.UUID,
    user: User,
) -> dict:
    """
    Reintenta manualmente la extraccion de transcripcion.

    Usado desde el endpoint POST /sessions/{id}/retry-transcript.
    """
    session = await get_session_by_id(db, session_id, user)

    if session.status != SessionStatus.COMPLETED:
        raise InvalidScheduleError("Solo se puede reintentar en sesiones completadas")

    # Verificar que no haya transcripcion ya
    existing_query = select(SessionTranscript).where(
        SessionTranscript.session_id == session_id
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        return {"status": "already_exists", "message": "La transcripcion ya existe"}

    if not session.google_meet_link:
        return {"status": "no_meet_link", "message": "La sesion no tiene link de Meet"}

    meet_code = session.google_meet_link.rstrip("/").split("/")[-1]

    try:
        doc_id = find_meet_transcript_doc(meet_code=meet_code)
        if not doc_id:
            return {"status": "not_found", "message": "Transcripcion aun no disponible en Drive"}

        transcript_data = extract_transcript_from_doc(google_docs_id=doc_id)

        transcript = SessionTranscript(
            session_id=session.id,
            google_docs_id=doc_id,
            full_text=transcript_data["full_text"],
            segments=transcript_data["segments"],
            word_count=transcript_data["word_count"],
            language="es",
            source=TranscriptSource.GOOGLE_MEET_AUTO,
        )
        db.add(transcript)
        await db.flush()

        # Ahora encolar analisis IA
        job_id = _enqueue_ai_analysis(session.id)

        logger.info(
            "Transcripcion extraida manualmente",
            session_id=str(session_id),
            word_count=transcript_data["word_count"],
        )

        return {
            "status": "success",
            "message": "Transcripcion extraida exitosamente",
            "word_count": transcript_data["word_count"],
            "ai_job_id": job_id,
        }

    except Exception as exc:
        logger.error(
            "Error en extraccion manual de transcripcion",
            session_id=str(session_id),
            error=str(exc),
        )
        return {"status": "error", "message": str(exc)}
