"""
Vocari Backend - Router de Sessions.

CRUD de sesiones + endpoints de transcripcion y analisis.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.pagination import PaginationParams
from app.sessions.availability import (
    AvailabilityBlockCreate,
    AvailabilityBlockResponse,
    AvailabilityListResponse,
    create_availability_block,
    delete_availability_block,
    list_availability,
)
from app.sessions.models import SessionStatus
from app.sessions.schemas import (
    AnalysisFullResponse,
    OrientadorListItem,
    OrientadorStatsResponse,
    SessionCompleteRequest,
    SessionCompleteResponse,
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    TranscriptFullResponse,
)
from app.sessions.service import (
    cancel_session,
    complete_session,
    create_session,
    get_orientador_stats,
    get_session_analysis,
    get_session_by_id,
    get_session_transcript,
    list_orientadores_for_student,
    list_sessions,
    retry_transcript_extraction,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Sessions CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=SessionListResponse)
async def list_sessions_endpoint(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status: SessionStatus | None = None,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> SessionListResponse:
    """Lista sesiones filtradas por rol del usuario."""
    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_sessions(db, user, pagination, status_filter=status)

    return SessionListResponse(
        items=[SessionResponse.model_validate(s) for s in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page,
    )


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session_endpoint(
    data: SessionCreate,
    user: User = Depends(require_roles(UserRole.ESTUDIANTE)),
    db=Depends(get_async_session),
) -> SessionResponse:
    """
    Agendar una nueva sesion (rol: estudiante).

    Verifica consentimiento, disponibilidad, y crea evento Calendar+Meet.
    """
    session = await create_session(db, user, data)
    return SessionResponse.model_validate(session)


@router.get("/orientadores", response_model=list[OrientadorListItem])
async def list_orientadores_endpoint(
    user: User = Depends(require_roles(UserRole.ESTUDIANTE)),
    db=Depends(get_async_session),
) -> list[OrientadorListItem]:
    """
    Lista orientadores disponibles de la institucion del estudiante.

    Usado por la pagina de agendar sesion.
    """
    orientadores = await list_orientadores_for_student(db, user)
    return [OrientadorListItem.model_validate(o) for o in orientadores]


@router.get("/stats/orientador", response_model=OrientadorStatsResponse)
async def get_orientador_stats_endpoint(
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> OrientadorStatsResponse:
    """Obtiene estadisticas para el dashboard del orientador."""
    stats = await get_orientador_stats(db, user)
    return OrientadorStatsResponse(**stats)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_endpoint(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> SessionResponse:
    """Obtiene detalle de una sesion."""
    session = await get_session_by_id(db, session_id, user)
    return SessionResponse.model_validate(session)


@router.delete("/{session_id}", status_code=204)
async def cancel_session_endpoint(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> None:
    """Cancela una sesion y su evento Calendar asociado."""
    await cancel_session(db, session_id, user)


# ---------------------------------------------------------------------------
# Session completion (T2.7)
# ---------------------------------------------------------------------------


@router.post("/{session_id}/complete", response_model=SessionCompleteResponse)
async def complete_session_endpoint(
    session_id: uuid.UUID,
    data: SessionCompleteRequest | None = None,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> SessionCompleteResponse:
    """
    Marca sesion como completada (rol: orientador).

    Extrae transcripcion, obtiene metadata de grabacion, y encola analisis IA.
    """
    notes = data.notes if data else None
    session, job_id = await complete_session(db, session_id, user, notes=notes)

    return SessionCompleteResponse(
        session_id=session.id,
        status=session.status,
        completed_at=session.completed_at,  # type: ignore[arg-type]
        job_id=job_id,
    )


# ---------------------------------------------------------------------------
# Transcript (T2.6 + T3.7)
# ---------------------------------------------------------------------------


@router.get("/{session_id}/transcript", response_model=TranscriptFullResponse)
async def get_transcript_endpoint(
    session_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> TranscriptFullResponse:
    """Obtiene la transcripcion completa de una sesion."""
    transcript = await get_session_transcript(db, session_id, user)
    return TranscriptFullResponse.model_validate(transcript)


@router.post("/{session_id}/retry-transcript")
async def retry_transcript_endpoint(
    session_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> dict:
    """
    Reintenta manualmente la extraccion de transcripcion.

    Util cuando Google Meet tarda en generar la transcripcion.
    """
    return await retry_transcript_extraction(db, session_id, user)


# ---------------------------------------------------------------------------
# AI Analysis (T3.7)
# ---------------------------------------------------------------------------


@router.get("/{session_id}/analysis", response_model=AnalysisFullResponse)
async def get_analysis_endpoint(
    session_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AnalysisFullResponse:
    """Obtiene el analisis IA de una sesion."""
    analysis = await get_session_analysis(db, session_id, user)
    return AnalysisFullResponse.model_validate(analysis)


# ---------------------------------------------------------------------------
# Availability (T2.4)
# ---------------------------------------------------------------------------


@router.get("/availability/{orientador_id}", response_model=AvailabilityListResponse)
async def list_availability_endpoint(
    orientador_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> AvailabilityListResponse:
    """Lista bloques de disponibilidad de un orientador."""
    blocks = await list_availability(db, orientador_id)
    return AvailabilityListResponse(
        items=[AvailabilityBlockResponse.model_validate(b) for b in blocks],
    )


@router.post("/availability", response_model=AvailabilityBlockResponse, status_code=201)
async def create_availability_endpoint(
    data: AvailabilityBlockCreate,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AvailabilityBlockResponse:
    """Crear bloque de disponibilidad (rol: orientador)."""
    block = await create_availability_block(db, user.id, data)
    return AvailabilityBlockResponse.model_validate(block)


@router.delete("/availability/{block_id}", status_code=204)
async def delete_availability_endpoint(
    block_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> None:
    """Eliminar bloque de disponibilidad."""
    await delete_availability_block(db, user.id, block_id)
