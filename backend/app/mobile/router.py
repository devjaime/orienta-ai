"""
Vocari Backend - Endpoints moviles versionados bajo /api/v1/mobile.
"""

# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.auth.models import User
from app.common.database import get_async_session
from app.common.exceptions import ValidationError
from app.common.idempotency import replay_if_present, store_idempotent_response
from app.common.rate_limit import enforce_public_rate_limit
from app.mobile.deps import MobileActor, get_mobile_actor
from app.mobile.schemas import (
    AchievementsResponse,
    ActionPlanItemResponse,
    ActionPlanPatchRequest,
    ActionPlanResponse,
    JourneyResponse,
    MobileGuestClaimRequest,
    MobileGuestClaimResponse,
    MobileGuestCreateResponse,
    NextActionResponse,
    NodeAttemptRequest,
    NodeAttemptResponse,
    PushTokenRequest,
    PushTokenResponse,
    StreakResponse,
)
from app.mobile.service import (
    claim_guest,
    create_guest,
    get_achievements,
    get_action_plan,
    get_journey,
    get_next_actions,
    get_streak,
    patch_action_plan_item,
    register_push_token,
    revoke_push_token,
    submit_node_attempt,
)

router = APIRouter()


@router.post("/guests", response_model=MobileGuestCreateResponse, status_code=201)
async def create_mobile_guest(
    request: Request,
    db: AsyncSession = Depends(get_async_session),
) -> MobileGuestCreateResponse:
    await enforce_public_rate_limit(request, "mobile-guests")
    return await create_guest(db)


@router.post("/guests/claim", response_model=MobileGuestClaimResponse)
async def claim_mobile_guest(
    payload: MobileGuestClaimRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> MobileGuestClaimResponse:
    return await claim_guest(db, user, payload.guest_token)


@router.get("/me/journey", response_model=JourneyResponse)
async def read_my_journey(
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> JourneyResponse:
    return await get_journey(db, actor)


@router.get("/me/next-actions", response_model=NextActionResponse)
async def read_next_actions(
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> NextActionResponse:
    return await get_next_actions(db, actor)


@router.post("/journey/nodes/{node_id}/attempts", response_model=NodeAttemptResponse)
async def create_node_attempt(
    node_id: uuid.UUID,
    payload: NodeAttemptRequest,
    request: Request,
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> NodeAttemptResponse:
    idempotency_key = await replay_if_present(db, request, actor.actor_key)
    if idempotency_key is None:
        raise ValidationError("Idempotency-Key es obligatorio en escrituras moviles")
    result = await submit_node_attempt(db, actor, node_id, idempotency_key, payload)
    await store_idempotent_response(
        db,
        request,
        actor.actor_key,
        idempotency_key,
        200,
        result.model_dump(mode="json"),
    )
    return result


@router.get("/me/streak", response_model=StreakResponse)
async def read_streak(
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> StreakResponse:
    return await get_streak(db, actor)


@router.get("/me/achievements", response_model=AchievementsResponse)
async def read_achievements(
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> AchievementsResponse:
    return await get_achievements(db, actor)


@router.get("/me/action-plan", response_model=ActionPlanResponse)
async def read_action_plan(
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> ActionPlanResponse:
    return await get_action_plan(db, actor)


@router.patch("/me/action-plan/{item_id}", response_model=ActionPlanItemResponse)
async def update_action_plan_item(
    item_id: uuid.UUID,
    payload: ActionPlanPatchRequest,
    request: Request,
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> ActionPlanItemResponse:
    idempotency_key = await replay_if_present(db, request, actor.actor_key)
    result = await patch_action_plan_item(db, actor, item_id, payload)
    await store_idempotent_response(
        db,
        request,
        actor.actor_key,
        idempotency_key,
        200,
        result.model_dump(mode="json"),
    )
    return result


@router.post("/me/push-tokens", response_model=PushTokenResponse, status_code=201)
async def create_push_token(
    payload: PushTokenRequest,
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> PushTokenResponse:
    return await register_push_token(db, actor, payload)


@router.delete("/me/push-tokens/{token_id}", status_code=204)
async def delete_push_token(
    token_id: uuid.UUID,
    actor: MobileActor = Depends(get_mobile_actor),
    db: AsyncSession = Depends(get_async_session),
) -> None:
    await revoke_push_token(db, actor, token_id)
