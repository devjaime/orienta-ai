"""Schemas API para followups."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.followups.models import FollowupChannel, FollowupStatus


class FollowupScheduleRequest(BaseModel):
    lead_id: uuid.UUID | None = None
    student_id: uuid.UUID | None = None
    force_reschedule: bool = False


class FollowupEventResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID | None = None
    student_id: uuid.UUID | None = None
    journey_step: str
    channel: FollowupChannel
    status: FollowupStatus
    scheduled_at: datetime
    sent_at: datetime | None = None
    retry_count: int
    last_error: str | None = None
    payload: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FollowupListResponse(BaseModel):
    items: list[FollowupEventResponse]
    total: int


class FollowupActionResponse(BaseModel):
    success: bool = True
    message: str
    followup_id: uuid.UUID


class FollowupProcessResponse(BaseModel):
    success: bool = True
    processed: int
    sent: int
    failed: int

