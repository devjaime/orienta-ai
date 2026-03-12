"""
Router del panel orientador.
"""

# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.orientador.schemas import (
    AdvisorNoteCreate,
    AdvisorNoteResponse,
    AdvisorTaskCreate,
    AdvisorTaskResponse,
    AdvisorTaskUpdate,
    StudentDetailResponse,
    StudentListResponse,
)
from app.orientador.service import (
    create_advisor_note,
    create_advisor_task,
    get_student_detail_for_orientador,
    list_advisor_notes,
    list_students_for_orientador,
    update_advisor_task_status,
)

router = APIRouter()


@router.get("/students", response_model=StudentListResponse)
async def list_students(
    curso: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    claridad: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> StudentListResponse:
    items = await list_students_for_orientador(db, user, curso, estado, claridad, search)
    return StudentListResponse(items=items, total=len(items))


@router.get("/students/{student_id}", response_model=StudentDetailResponse)
async def get_student_detail(
    student_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> StudentDetailResponse:
    student, notes, tasks = await get_student_detail_for_orientador(db, user, student_id)
    return StudentDetailResponse(
        student=student,
        notes=[AdvisorNoteResponse.model_validate(n) for n in notes],
        tasks=[AdvisorTaskResponse.model_validate(t) for t in tasks],
    )


@router.post("/students/{student_id}/notes", response_model=AdvisorNoteResponse, status_code=201)
async def create_note(
    student_id: uuid.UUID,
    payload: AdvisorNoteCreate,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AdvisorNoteResponse:
    note = await create_advisor_note(db, user, student_id, payload.note)
    return AdvisorNoteResponse.model_validate(note)


@router.get("/students/{student_id}/notes", response_model=list[AdvisorNoteResponse])
async def get_notes(
    student_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> list[AdvisorNoteResponse]:
    notes = await list_advisor_notes(db, user, student_id)
    return [AdvisorNoteResponse.model_validate(n) for n in notes]


@router.post("/students/{student_id}/tasks", response_model=AdvisorTaskResponse, status_code=201)
async def create_task(
    student_id: uuid.UUID,
    payload: AdvisorTaskCreate,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AdvisorTaskResponse:
    task = await create_advisor_task(db, user, student_id, payload.title, payload.due_date)
    return AdvisorTaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=AdvisorTaskResponse)
async def update_task_status(
    task_id: uuid.UUID,
    payload: AdvisorTaskUpdate,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AdvisorTaskResponse:
    task = await update_advisor_task_status(db, user, task_id, payload.status)
    return AdvisorTaskResponse.model_validate(task)
