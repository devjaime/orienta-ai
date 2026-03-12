"""
Servicio de orientador: lista de estudiantes, notas y tareas.
"""

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserProfile, UserRole
from app.common.exceptions import NotFoundError, ValidationError
from app.leads.models import AIReport, Lead
from app.orientador.models import AdvisorNote, AdvisorTask, AdvisorTaskStatus
from app.orientador.schemas import StudentListItem
from app.sessions.models import Session
from app.tests_vocational.models import TestResult


def _risk_from_clarity(clarity_score: float | None) -> str:
    if clarity_score is None:
        return "medio"
    if clarity_score <= 2:
        return "alto"
    if clarity_score >= 4:
        return "bajo"
    return "medio"


async def list_students_for_orientador(
    db: AsyncSession,
    orientador: User,
    curso: str | None = None,
    estado: str | None = None,
    claridad: str | None = None,
    search: str | None = None,
) -> list[StudentListItem]:
    if not orientador.institution_id:
        return []

    students_query = (
        select(User, UserProfile.grade)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .where(
            User.institution_id == orientador.institution_id,
            User.role == UserRole.ESTUDIANTE,
            User.is_active.is_(True),
        )
        .order_by(User.name.asc())
    )

    if curso:
        students_query = students_query.where(UserProfile.grade == curso)
    if search:
        like_query = f"%{search.strip()}%"
        students_query = students_query.where(
            (User.name.ilike(like_query)) | (User.email.ilike(like_query))
        )

    rows = (await db.execute(students_query)).all()

    items: list[StudentListItem] = []
    for user_row, grade in rows:
        sessions_count = (
            await db.execute(
                select(func.count())
                .select_from(Session)
                .where(
                    Session.student_id == user_row.id,
                    Session.orientador_id == orientador.id,
                )
            )
        ).scalar() or 0

        last_test_row = (
            await db.execute(
                select(TestResult.created_at, TestResult.result_code)
                .where(TestResult.user_id == user_row.id)
                .order_by(TestResult.created_at.desc())
                .limit(1)
            )
        ).first()

        lead_row = (
            await db.execute(
                select(Lead.clarity_score, Lead.holland_code, Lead.updated_at)
                .where(Lead.email == user_row.email)
                .order_by(Lead.updated_at.desc())
                .limit(1)
            )
        ).first()

        last_test_at = last_test_row[0] if last_test_row else None
        holland_code = (
            (last_test_row[1] if last_test_row else None)
            or (lead_row[1] if lead_row else None)
        )
        clarity_score = lead_row[0] if lead_row else None
        last_activity_candidates: list[datetime] = []
        if last_test_at:
            last_activity_candidates.append(last_test_at)
        if lead_row and lead_row[2]:
            last_activity_candidates.append(lead_row[2])
        last_activity_at = max(last_activity_candidates) if last_activity_candidates else None

        test_status = "completo" if last_test_at else "pendiente"
        risk_level = _risk_from_clarity(clarity_score)

        item = StudentListItem(
            id=user_row.id,
            name=user_row.name,
            email=user_row.email,
            curso=grade,
            test_status=test_status,
            holland_code=holland_code,
            clarity_score=clarity_score,
            risk_level=risk_level,
            sessions_count=int(sessions_count),
            last_test_at=last_test_at,
            last_activity_at=last_activity_at,
        )

        if estado and item.test_status != estado:
            continue
        if claridad == "alta" and (item.clarity_score is None or item.clarity_score < 4):
            continue
        if claridad == "media" and item.clarity_score != 3:
            continue
        if claridad == "baja" and (item.clarity_score is None or item.clarity_score > 2):
            continue

        items.append(item)

    return items


async def get_student_detail_for_orientador(
    db: AsyncSession,
    orientador: User,
    student_id: uuid.UUID,
) -> tuple[StudentListItem, list[AdvisorNote], list[AdvisorTask], list[AIReport]]:
    students = await list_students_for_orientador(db, orientador)
    student = next((item for item in students if item.id == student_id), None)
    if not student:
        raise NotFoundError("Estudiante no encontrado")

    notes = (
        await db.execute(
            select(AdvisorNote)
            .where(
                AdvisorNote.student_id == student_id,
                AdvisorNote.orientador_id == orientador.id,
            )
            .order_by(AdvisorNote.created_at.desc())
        )
    ).scalars().all()

    tasks = (
        await db.execute(
            select(AdvisorTask)
            .where(
                AdvisorTask.student_id == student_id,
                AdvisorTask.orientador_id == orientador.id,
            )
            .order_by(AdvisorTask.created_at.desc())
        )
    ).scalars().all()

    lead_row = (
        await db.execute(
            select(Lead.id)
            .where(Lead.email == student.email)
            .order_by(Lead.updated_at.desc())
            .limit(1)
        )
    ).first()

    ai_reports: list[AIReport] = []
    if lead_row:
        reports_result = await db.execute(
            select(AIReport)
            .where(AIReport.lead_id == lead_row[0])
            .order_by(AIReport.created_at.desc())
            .limit(20)
        )
        ai_reports = list(reports_result.scalars().all())

    return student, list(notes), list(tasks), ai_reports


async def create_advisor_note(
    db: AsyncSession,
    orientador: User,
    student_id: uuid.UUID,
    note_text: str,
) -> AdvisorNote:
    if not orientador.institution_id:
        raise ValidationError("Orientador sin institución asignada")

    note = AdvisorNote(
        institution_id=orientador.institution_id,
        student_id=student_id,
        orientador_id=orientador.id,
        note=note_text.strip(),
    )
    db.add(note)
    await db.flush()
    return note


async def list_advisor_notes(
    db: AsyncSession,
    orientador: User,
    student_id: uuid.UUID,
) -> list[AdvisorNote]:
    result = await db.execute(
        select(AdvisorNote)
        .where(
            AdvisorNote.student_id == student_id,
            AdvisorNote.orientador_id == orientador.id,
        )
        .order_by(AdvisorNote.created_at.desc())
    )
    return list(result.scalars().all())


async def create_advisor_task(
    db: AsyncSession,
    orientador: User,
    student_id: uuid.UUID,
    title: str,
    due_date: datetime | None = None,
) -> AdvisorTask:
    if not orientador.institution_id:
        raise ValidationError("Orientador sin institución asignada")

    task = AdvisorTask(
        institution_id=orientador.institution_id,
        student_id=student_id,
        orientador_id=orientador.id,
        title=title.strip(),
        due_date=due_date,
    )
    db.add(task)
    await db.flush()
    return task


async def update_advisor_task_status(
    db: AsyncSession,
    orientador: User,
    task_id: uuid.UUID,
    status: AdvisorTaskStatus,
) -> AdvisorTask:
    task = (
        await db.execute(
            select(AdvisorTask).where(
                AdvisorTask.id == task_id,
                AdvisorTask.orientador_id == orientador.id,
            )
        )
    ).scalar_one_or_none()

    if task is None:
        raise NotFoundError("Tarea no encontrada")

    task.status = status
    await db.flush()
    return task
