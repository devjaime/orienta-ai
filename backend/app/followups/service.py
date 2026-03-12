"""Servicios de programación y procesamiento de followups."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import and_, select

from app.auth.models import User, UserRole
from app.common.exceptions import NotFoundError
from app.followups.models import FollowupChannel, FollowupEvent, FollowupStatus
from app.leads.models import Lead
from app.notifications.models import NotificationType
from app.notifications.service import dispatch_notification

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

FOLLOWUP_STEPS = [
    ("D0", 0),
    ("D7", 7),
    ("D21", 21),
]


def _template_for_step(step: str, lead: Lead) -> tuple[str, str]:
    name = lead.nombre or "Estudiante"
    code = lead.holland_code or "en exploración"
    if step == "D0":
        return (
            "Tu informe vocacional ya está listo",
            f"{name}, revisa tu perfil {code} y define 3 acciones para esta semana.",
        )
    if step == "D7":
        return (
            "Recordatorio de exploración vocacional",
            f"{name}, compara 3 carreras relacionadas con tu perfil {code} y sus datos reales.",
        )
    return (
        "Seguimiento vocacional y próxima sesión",
        (
            f"{name}, si aún tienes dudas con tu perfil {code}, agenda una sesión con tu orientador "
            "para tomar una decisión informada."
        ),
    )


async def _get_lead(db: AsyncSession, lead_id: uuid.UUID) -> Lead:
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise NotFoundError("Lead no encontrado")
    return lead


async def _resolve_lead_by_student(db: AsyncSession, student_id: uuid.UUID) -> Lead | None:
    user = (await db.execute(select(User).where(User.id == student_id))).scalar_one_or_none()
    if not user:
        return None
    lead = (
        await db.execute(
            select(Lead)
            .where(Lead.email == user.email)
            .order_by(Lead.updated_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    return lead


async def schedule_default_followups(
    db: AsyncSession,
    *,
    lead_id: uuid.UUID | None = None,
    student_id: uuid.UUID | None = None,
    force_reschedule: bool = False,
) -> list[FollowupEvent]:
    if not lead_id and not student_id:
        raise ValueError("Debes enviar lead_id o student_id")

    lead: Lead | None = await _get_lead(db, lead_id) if lead_id else None
    if lead is None and student_id:
        lead = await _resolve_lead_by_student(db, student_id)

    if lead is None:
        raise NotFoundError("No se encontró lead para programar followups")

    if force_reschedule:
        current = (
            await db.execute(
                select(FollowupEvent).where(
                    and_(
                        FollowupEvent.lead_id == lead.id,
                        FollowupEvent.status == FollowupStatus.SCHEDULED,
                    )
                )
            )
        ).scalars().all()
        for item in current:
            item.status = FollowupStatus.CANCELED

    existing = (
        await db.execute(
            select(FollowupEvent.journey_step).where(
                and_(
                    FollowupEvent.lead_id == lead.id,
                    FollowupEvent.status.in_([FollowupStatus.SCHEDULED, FollowupStatus.SENT]),
                )
            )
        )
    ).scalars().all()
    existing_steps = set(existing)

    now = datetime.now(UTC)
    created: list[FollowupEvent] = []
    for step, days in FOLLOWUP_STEPS:
        if step in existing_steps:
            continue
        title, message = _template_for_step(step, lead)
        event = FollowupEvent(
            lead_id=lead.id,
            student_id=student_id,
            journey_step=step,
            channel=FollowupChannel.EMAIL,
            status=FollowupStatus.SCHEDULED,
            scheduled_at=now + timedelta(days=days),
            payload={
                "nombre": lead.nombre,
                "email": lead.email,
                "holland_code": lead.holland_code,
                "clarity_score": lead.clarity_score,
                "title": title,
                "message": message,
            },
        )
        db.add(event)
        created.append(event)

    await db.flush()
    return created


async def list_followups_by_student(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> list[FollowupEvent]:
    lead = await _resolve_lead_by_student(db, student_id)
    if not lead:
        return []
    result = await db.execute(
        select(FollowupEvent)
        .where(FollowupEvent.lead_id == lead.id)
        .order_by(FollowupEvent.scheduled_at.desc())
    )
    return list(result.scalars().all())


async def retry_followup(
    db: AsyncSession,
    followup_id: uuid.UUID,
) -> FollowupEvent:
    event = (await db.execute(select(FollowupEvent).where(FollowupEvent.id == followup_id))).scalar_one_or_none()
    if not event:
        raise NotFoundError("Followup no encontrado")
    event.status = FollowupStatus.SCHEDULED
    event.scheduled_at = datetime.now(UTC)
    event.last_error = None
    await db.flush()
    return event


async def cancel_followup(
    db: AsyncSession,
    followup_id: uuid.UUID,
) -> FollowupEvent:
    event = (await db.execute(select(FollowupEvent).where(FollowupEvent.id == followup_id))).scalar_one_or_none()
    if not event:
        raise NotFoundError("Followup no encontrado")
    event.status = FollowupStatus.CANCELED
    await db.flush()
    return event


async def process_due_followups(db: AsyncSession, limit: int = 50) -> dict[str, int]:
    now = datetime.now(UTC)
    due_events = (
        await db.execute(
            select(FollowupEvent)
            .where(
                and_(
                    FollowupEvent.status == FollowupStatus.SCHEDULED,
                    FollowupEvent.scheduled_at <= now,
                )
            )
            .order_by(FollowupEvent.scheduled_at.asc())
            .limit(limit)
        )
    ).scalars().all()

    sent = 0
    failed = 0
    for event in due_events:
        try:
            # MVP: envío simulado por canal email + notificación interna si existe user.
            if event.lead_id:
                lead = await _get_lead(db, event.lead_id)
                user = (
                    await db.execute(
                        select(User).where(
                            and_(
                                User.email == lead.email,
                                User.role == UserRole.ESTUDIANTE,
                            )
                        )
                    )
                ).scalar_one_or_none()

                if user:
                    payload = event.payload or {}
                    await dispatch_notification(
                        db=db,
                        user_id=user.id,
                        notification_type=NotificationType.GENERAL,
                        title=payload.get("title", f"Seguimiento {event.journey_step}"),
                        message=payload.get("message", "Tienes un nuevo seguimiento vocacional."),
                        extra_data={"followup_id": str(event.id), "journey_step": event.journey_step},
                    )

            event.status = FollowupStatus.SENT
            event.sent_at = now
            event.last_error = None
            sent += 1
        except Exception as error:  # pragma: no cover
            event.status = FollowupStatus.FAILED
            event.retry_count += 1
            event.last_error = str(error)[:500]
            failed += 1

    await db.flush()
    return {
        "processed": len(due_events),
        "sent": sent,
        "failed": failed,
    }
