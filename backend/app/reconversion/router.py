"""
Vocari Backend - Router del flujo de reconversion vocacional para adultos.
"""

# ruff: noqa: B008

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.idempotency import store_idempotent_response
from app.reconversion.deps import (
    begin_reconversion_write,
    limit_public_reconversion,
    require_editable_session,
)
from app.reconversion.models import AdultReconversionSession
from app.reconversion.schemas import (
    AdultReconversionGenerateReportResponse,
    AdultReconversionPhaseFourRequest,
    AdultReconversionPhaseFourResponse,
    AdultReconversionPhaseOneRequest,
    AdultReconversionPhaseOneResponse,
    AdultReconversionPhaseThreeRequest,
    AdultReconversionPhaseThreeResponse,
    AdultReconversionPhaseTwoRequest,
    AdultReconversionPhaseTwoResponse,
    AdultReconversionPublicReportResponse,
    AdultReconversionReviewListResponse,
    AdultReconversionSessionCreateRequest,
    AdultReconversionSessionCreateResponse,
    AdultReconversionSessionDetailResponse,
    AdultReconversionSessionResponse,
)
from app.reconversion.service import (
    create_public_session,
    generate_report,
    get_completed_phases,
    get_phase_result,
    get_public_report,
    get_session_by_id,
    list_review_reports,
    submit_phase_four,
    submit_phase_one,
    submit_phase_three,
    submit_phase_two,
)

router = APIRouter()


def _session_response(session: AdultReconversionSession) -> AdultReconversionSessionResponse:
    return AdultReconversionSessionResponse.model_validate(session)


def _detail_response(
    session: AdultReconversionSession,
    completed_phases: list[str],
    phase_1,
    phase_2,
    phase_3,
    phase_4,
) -> AdultReconversionSessionDetailResponse:
    return AdultReconversionSessionDetailResponse(
        session=_session_response(session),
        completed_phases=completed_phases,
        phase_1_summary=(phase_1.derived_scores_json if phase_1 is not None else None),
        phase_2_summary=(phase_2.derived_scores_json if phase_2 is not None else None),
        phase_3_summary=(phase_3.derived_scores_json if phase_3 is not None else None),
        phase_4_summary=(phase_4.derived_scores_json if phase_4 is not None else None),
    )


@router.post(
    "/sessions",
    response_model=AdultReconversionSessionCreateResponse,
    status_code=201,
    dependencies=[Depends(limit_public_reconversion)],
)
async def create_reconversion_session(
    data: AdultReconversionSessionCreateRequest,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionSessionCreateResponse:
    """Crea una sesion publica de reconversion."""
    session, edit_token = await create_public_session(db, data)
    payload = AdultReconversionSessionCreateResponse(
        **_session_response(session).model_dump(),
        edit_token=edit_token,
    )
    return payload


@router.get("/sessions/{session_id}", response_model=AdultReconversionSessionDetailResponse)
async def get_reconversion_session(
    session: AdultReconversionSession = Depends(require_editable_session),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionSessionDetailResponse:
    """Obtiene una sesion publica y sus fases completadas."""
    completed_phases = await get_completed_phases(db, session.id)
    phase_1 = await get_phase_result(db, session.id, "phase_1")
    phase_2 = await get_phase_result(db, session.id, "phase_2")
    phase_3 = await get_phase_result(db, session.id, "phase_3")
    phase_4 = await get_phase_result(db, session.id, "phase_4")
    return _detail_response(session, completed_phases, phase_1, phase_2, phase_3, phase_4)


@router.post(
    "/sessions/{session_id}/phase-1",
    response_model=AdultReconversionPhaseOneResponse,
)
async def submit_reconversion_phase_one(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseOneRequest,
    request: Request,
    write_ctx: tuple[AdultReconversionSession, str | None] = Depends(begin_reconversion_write),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseOneResponse:
    """Guarda la fase 1 del flujo publico adulto."""
    del session_id
    session, idempotency_key = write_ctx
    summary = await submit_phase_one(db, session.id, data)
    session = await get_session_by_id(db, session.id)
    payload = AdultReconversionPhaseOneResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_1",
        summary=summary,
    )
    await store_idempotent_response(
        db,
        request,
        f"session:{session.id}",
        idempotency_key,
        200,
        payload.model_dump(mode="json"),
    )
    return payload


@router.post(
    "/sessions/{session_id}/phase-2",
    response_model=AdultReconversionPhaseTwoResponse,
)
async def submit_reconversion_phase_two(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseTwoRequest,
    request: Request,
    write_ctx: tuple[AdultReconversionSession, str | None] = Depends(begin_reconversion_write),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseTwoResponse:
    """Guarda la fase 2 del flujo publico adulto."""
    del session_id
    session, idempotency_key = write_ctx
    summary = await submit_phase_two(db, session.id, data)
    session = await get_session_by_id(db, session.id)
    payload = AdultReconversionPhaseTwoResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_2",
        summary=summary,
    )
    await store_idempotent_response(
        db,
        request,
        f"session:{session.id}",
        idempotency_key,
        200,
        payload.model_dump(mode="json"),
    )
    return payload


@router.post(
    "/sessions/{session_id}/phase-3",
    response_model=AdultReconversionPhaseThreeResponse,
)
async def submit_reconversion_phase_three(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseThreeRequest,
    request: Request,
    write_ctx: tuple[AdultReconversionSession, str | None] = Depends(begin_reconversion_write),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseThreeResponse:
    """Guarda la fase 3 confirmatoria del flujo publico adulto."""
    del session_id
    session, idempotency_key = write_ctx
    summary = await submit_phase_three(db, session.id, data)
    session = await get_session_by_id(db, session.id)
    payload = AdultReconversionPhaseThreeResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_3",
        summary=summary,
    )
    await store_idempotent_response(
        db,
        request,
        f"session:{session.id}",
        idempotency_key,
        200,
        payload.model_dump(mode="json"),
    )
    return payload


@router.post(
    "/sessions/{session_id}/phase-4",
    response_model=AdultReconversionPhaseFourResponse,
)
async def submit_reconversion_phase_four(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseFourRequest,
    request: Request,
    write_ctx: tuple[AdultReconversionSession, str | None] = Depends(begin_reconversion_write),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseFourResponse:
    """Guarda la fase 4 de trade-offs del flujo publico adulto."""
    del session_id
    session, idempotency_key = write_ctx
    summary = await submit_phase_four(db, session.id, data)
    session = await get_session_by_id(db, session.id)
    payload = AdultReconversionPhaseFourResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_4",
        summary=summary,
    )
    await store_idempotent_response(
        db,
        request,
        f"session:{session.id}",
        idempotency_key,
        200,
        payload.model_dump(mode="json"),
    )
    return payload


@router.post(
    "/sessions/{session_id}/generate-report",
    response_model=AdultReconversionGenerateReportResponse,
)
async def generate_reconversion_report(
    session_id: uuid.UUID,
    request: Request,
    write_ctx: tuple[AdultReconversionSession, str | None] = Depends(begin_reconversion_write),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionGenerateReportResponse:
    """Genera el informe final de reconversion para una sesion pública."""
    del session_id
    session, idempotency_key = write_ctx
    payload = await generate_report(db, session.id)
    await store_idempotent_response(
        db,
        request,
        f"session:{session.id}",
        idempotency_key,
        200,
        payload.model_dump(mode="json"),
    )
    return payload


@router.get(
    "/public/{share_token}",
    response_model=AdultReconversionPublicReportResponse,
    dependencies=[Depends(limit_public_reconversion)],
)
async def get_public_reconversion_report(
    share_token: str,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPublicReportResponse:
    """Obtiene el informe final de reconversion por URL pública."""
    return await get_public_report(db, share_token)


@router.get(
    "/review/reports",
    response_model=AdultReconversionReviewListResponse,
)
async def list_reconversion_reports_for_review(
    search: str | None = Query(default=None, max_length=255),
    status: str | None = Query(default=None, max_length=50),
    generated_from: date | None = Query(default=None),
    generated_to: date | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(
        require_roles(
            UserRole.ORIENTADOR,
            UserRole.ADMIN_COLEGIO,
            UserRole.SUPER_ADMIN,
        )
    ),
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionReviewListResponse:
    """Lista informes generados para revision interna de orientador/admin."""
    return await list_review_reports(
        db,
        user=user,
        search=search,
        status=status,
        generated_from=generated_from,
        generated_to=generated_to,
        limit=limit,
    )
