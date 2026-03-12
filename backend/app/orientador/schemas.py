"""
Schemas de orientador para API.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.orientador.models import AdvisorTaskStatus


class StudentListItem(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    curso: str | None = None
    test_status: str
    holland_code: str | None = None
    clarity_score: float | None = None
    risk_level: str
    sessions_count: int
    last_test_at: datetime | None = None
    last_activity_at: datetime | None = None


class StudentListResponse(BaseModel):
    items: list[StudentListItem]
    total: int


class AdvisorNoteCreate(BaseModel):
    note: str = Field(..., min_length=2, max_length=4000)


class AdvisorNoteResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    orientador_id: uuid.UUID
    note: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdvisorTaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    due_date: datetime | None = None


class AdvisorTaskUpdate(BaseModel):
    status: AdvisorTaskStatus


class AdvisorTaskResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    orientador_id: uuid.UUID
    title: str
    status: AdvisorTaskStatus
    due_date: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StudentDetailResponse(BaseModel):
    student: StudentListItem
    notes: list[AdvisorNoteResponse]
    tasks: list[AdvisorTaskResponse]

