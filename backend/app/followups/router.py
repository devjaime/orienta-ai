"""Router de followups automáticos."""

# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends

from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.followups.schemas import (
    FollowupActionResponse,
    FollowupEventResponse,
    FollowupListResponse,
    FollowupProcessResponse,
    FollowupScheduleRequest,
)
from app.followups.service import (
    cancel_followup,
    list_followups_by_student,
    process_due_followups,
    retry_followup,
    schedule_default_followups,
)

router = APIRouter()


@router.post("/schedule", response_model=FollowupListResponse)
async def schedule_followups(
    payload: FollowupScheduleRequest,
    _: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> FollowupListResponse:
    items = await schedule_default_followups(
        db,
        lead_id=payload.lead_id,
        student_id=payload.student_id,
        force_reschedule=payload.force_reschedule,
    )
    return FollowupListResponse(
        items=[FollowupEventResponse.model_validate(item) for item in items],
        total=len(items),
    )


@router.get("/{student_id}", response_model=FollowupListResponse)
async def list_followups(
    student_id: uuid.UUID,
    _: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> FollowupListResponse:
    items = await list_followups_by_student(db, student_id)
    return FollowupListResponse(
        items=[FollowupEventResponse.model_validate(item) for item in items],
        total=len(items),
    )


@router.post("/{followup_id}/retry", response_model=FollowupActionResponse)
async def retry(
    followup_id: uuid.UUID,
    _: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> FollowupActionResponse:
    event = await retry_followup(db, followup_id)
    return FollowupActionResponse(
        message="Followup reprogramado para reintento inmediato",
        followup_id=event.id,
    )


@router.post("/{followup_id}/cancel", response_model=FollowupActionResponse)
async def cancel(
    followup_id: uuid.UUID,
    _: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> FollowupActionResponse:
    event = await cancel_followup(db, followup_id)
    return FollowupActionResponse(
        message="Followup cancelado",
        followup_id=event.id,
    )


@router.post("/process-due", response_model=FollowupProcessResponse)
async def process_due(
    _: User = Depends(require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> FollowupProcessResponse:
    result = await process_due_followups(db, limit=100)
    return FollowupProcessResponse(**result)

