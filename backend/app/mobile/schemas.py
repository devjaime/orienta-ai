"""
Vocari Backend - Contratos OpenAPI del API movil v1.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class MobileGuestCreateResponse(BaseModel):
    guest_id: uuid.UUID
    guest_token: str
    path_slug: str
    created_at: datetime


class MobileGuestClaimRequest(BaseModel):
    guest_token: str = Field(..., min_length=16, max_length=255)


class MobileGuestClaimResponse(BaseModel):
    guest_id: uuid.UUID
    user_id: uuid.UUID
    claimed_at: datetime
    journey_id: uuid.UUID | None = None


class JourneyNodeState(BaseModel):
    id: uuid.UUID
    slug: str
    node_type: str
    title: str
    position: int
    status: str
    xp_reward: int
    estimated_minutes: int
    content_version: str


class JourneyResponse(BaseModel):
    journey_id: uuid.UUID
    path_slug: str
    path_title: str
    status: str
    version: int
    current_node_slug: str | None
    xp_total: int
    level: int
    nodes: list[JourneyNodeState]


class NextActionResponse(BaseModel):
    journey_id: uuid.UUID
    node: JourneyNodeState | None
    message: str


class NodeAttemptRequest(BaseModel):
    answers: dict = Field(default_factory=dict)
    signal_summary: str | None = Field(default=None, max_length=500)


class NodeAttemptResponse(BaseModel):
    journey_id: uuid.UUID
    node_id: uuid.UUID
    node_slug: str
    status: str
    xp_awarded: int
    xp_total: int
    result: dict
    next_node_slug: str | None


class StreakResponse(BaseModel):
    journey_id: uuid.UUID
    current_days: int
    best_days: int
    last_active_date: date | None
    freeze_available: bool
    timezone: str


class AchievementItem(BaseModel):
    slug: str
    title: str
    description: str
    granted_at: datetime | None = None


class AchievementsResponse(BaseModel):
    journey_id: uuid.UUID
    items: list[AchievementItem]


class ActionPlanItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    due_date: date | None
    route_slug: str | None
    evidence_json: dict


class ActionPlanResponse(BaseModel):
    journey_id: uuid.UUID
    items: list[ActionPlanItemResponse]


class ActionPlanPatchRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|completed|rescheduled)$")
    evidence_json: dict = Field(default_factory=dict)
    due_date: date | None = None


class PushTokenRequest(BaseModel):
    platform: str = Field(..., pattern="^(ios|android)$")
    token: str = Field(..., min_length=8, max_length=512)
    locale: str = Field(default="es-CL", max_length=16)


class PushTokenResponse(BaseModel):
    id: uuid.UUID
    platform: str
    locale: str
    last_seen_at: datetime
