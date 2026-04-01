"""
Vocari Backend - Router del flujo de reconversion vocacional para adultos.
"""

# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.database import get_async_session
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
    AdultReconversionSessionCreateRequest,
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
    submit_phase_four,
    submit_phase_one,
    submit_phase_three,
    submit_phase_two,
)

router = APIRouter()


@router.post("/sessions", response_model=AdultReconversionSessionResponse, status_code=201)
async def create_reconversion_session(
    data: AdultReconversionSessionCreateRequest,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionSessionResponse:
    """Crea una sesion publica de reconversion."""
    session = await create_public_session(db, data)
    return AdultReconversionSessionResponse.model_validate(session)


@router.get("/sessions/{session_id}", response_model=AdultReconversionSessionDetailResponse)
async def get_reconversion_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionSessionDetailResponse:
    """Obtiene una sesion publica y sus fases completadas."""
    session = await get_session_by_id(db, session_id)
    completed_phases = await get_completed_phases(db, session_id)
    phase_1 = await get_phase_result(db, session_id, "phase_1")
    phase_2 = await get_phase_result(db, session_id, "phase_2")
    phase_3 = await get_phase_result(db, session_id, "phase_3")
    phase_4 = await get_phase_result(db, session_id, "phase_4")

    return AdultReconversionSessionDetailResponse(
        session=AdultReconversionSessionResponse.model_validate(session),
        completed_phases=completed_phases,
        phase_1_summary=(
            phase_1.derived_scores_json if phase_1 is not None else None
        ),
        phase_2_summary=(
            phase_2.derived_scores_json if phase_2 is not None else None
        ),
        phase_3_summary=(
            phase_3.derived_scores_json if phase_3 is not None else None
        ),
        phase_4_summary=(
            phase_4.derived_scores_json if phase_4 is not None else None
        ),
    )


@router.post(
    "/sessions/{session_id}/phase-1",
    response_model=AdultReconversionPhaseOneResponse,
)
async def submit_reconversion_phase_one(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseOneRequest,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseOneResponse:
    """Guarda la fase 1 del flujo publico adulto."""
    summary = await submit_phase_one(db, session_id, data)
    session = await get_session_by_id(db, session_id)

    return AdultReconversionPhaseOneResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_1",
        summary=summary,
    )


@router.post(
    "/sessions/{session_id}/phase-2",
    response_model=AdultReconversionPhaseTwoResponse,
)
async def submit_reconversion_phase_two(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseTwoRequest,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseTwoResponse:
    """Guarda la fase 2 del flujo publico adulto."""
    summary = await submit_phase_two(db, session_id, data)
    session = await get_session_by_id(db, session_id)

    return AdultReconversionPhaseTwoResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_2",
        summary=summary,
    )


@router.post(
    "/sessions/{session_id}/phase-3",
    response_model=AdultReconversionPhaseThreeResponse,
)
async def submit_reconversion_phase_three(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseThreeRequest,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseThreeResponse:
    """Guarda la fase 3 confirmatoria del flujo publico adulto."""
    summary = await submit_phase_three(db, session_id, data)
    session = await get_session_by_id(db, session_id)

    return AdultReconversionPhaseThreeResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_3",
        summary=summary,
    )


@router.post(
    "/sessions/{session_id}/phase-4",
    response_model=AdultReconversionPhaseFourResponse,
)
async def submit_reconversion_phase_four(
    session_id: uuid.UUID,
    data: AdultReconversionPhaseFourRequest,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPhaseFourResponse:
    """Guarda la fase 4 de trade-offs del flujo publico adulto."""
    summary = await submit_phase_four(db, session_id, data)
    session = await get_session_by_id(db, session_id)

    return AdultReconversionPhaseFourResponse(
        success=True,
        session_id=session.id,
        current_phase=session.current_phase,
        phase_key="phase_4",
        summary=summary,
    )


@router.post(
    "/sessions/{session_id}/generate-report",
    response_model=AdultReconversionGenerateReportResponse,
)
async def generate_reconversion_report(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionGenerateReportResponse:
    """Genera el informe final de reconversion para una sesion pública."""
    return await generate_report(db, session_id)


@router.get(
    "/public/{share_token}",
    response_model=AdultReconversionPublicReportResponse,
)
async def get_public_reconversion_report(
    share_token: str,
    db: AsyncSession = Depends(get_async_session),
) -> AdultReconversionPublicReportResponse:
    """Obtiene el informe final de reconversion por URL pública."""
    return await get_public_report(db, share_token)
