"""
Vocari Backend - Servicio de Consent.

Logica de negocio para otorgar, revocar y verificar consentimiento.
Cumplimiento de Ley 19.628 (proteccion de datos de menores).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.common.exceptions import (
    AuthorizationError,
    ConsentRequiredError,
    NotFoundError,
)
from app.consent.models import ConsentMethod, ConsentRecord, ConsentType
from app.consent.schemas import ConsentGrantType

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Mapeo ConsentGrantType -> ConsentType(s)
# ---------------------------------------------------------------------------

_GRANT_TYPE_MAP: dict[ConsentGrantType, list[ConsentType]] = {
    ConsentGrantType.RECORDING: [ConsentType.RECORDING],
    ConsentGrantType.AI_PROCESSING: [ConsentType.AI_PROCESSING],
    ConsentGrantType.DATA_STORAGE: [ConsentType.DATA_STORAGE],
    ConsentGrantType.ALL: [ConsentType.RECORDING, ConsentType.AI_PROCESSING, ConsentType.DATA_STORAGE],
}


# ---------------------------------------------------------------------------
# Verificacion
# ---------------------------------------------------------------------------


async def get_consent_status(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> dict[str, bool | datetime | str | None]:
    """Retorna el estado de consentimiento de un estudiante."""
    records = await _get_active_records(db, student_id)

    recording = False
    ai_processing = False
    data_storage = False
    latest_date: datetime | None = None
    latest_method: str | None = None

    for record in records:
        if record.consent_type == ConsentType.RECORDING:
            recording = True
        elif record.consent_type == ConsentType.AI_PROCESSING:
            ai_processing = True
        elif record.consent_type == ConsentType.DATA_STORAGE:
            data_storage = True

        if latest_date is None or record.granted_at > latest_date:
            latest_date = record.granted_at
            latest_method = record.method.value

    return {
        "student_id": student_id,
        "recording_consent": recording,
        "ai_processing_consent": ai_processing,
        "data_storage_consent": data_storage,
        "consent_date": latest_date,
        "method": latest_method,
    }


async def verify_consent_for_session(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> bool:
    """
    Verifica que el estudiante tenga consentimiento de grabacion y procesamiento IA.

    Requerido antes de agendar una sesion (T2.10).
    """
    records = await _get_active_records(db, student_id)

    has_recording = False
    has_ai = False

    for record in records:
        if record.consent_type == ConsentType.RECORDING:
            has_recording = True
        elif record.consent_type == ConsentType.AI_PROCESSING:
            has_ai = True

    return has_recording and has_ai


async def require_consent_for_session(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> None:
    """Lanza ConsentRequiredError si no hay consentimiento para sesion."""
    has_consent = await verify_consent_for_session(db, student_id)
    if not has_consent:
        raise ConsentRequiredError(
            "Se requiere consentimiento de grabacion y procesamiento IA "
            "para agendar una sesion. El apoderado debe otorgarlo primero."
        )


# ---------------------------------------------------------------------------
# Otorgar consentimiento
# ---------------------------------------------------------------------------


async def grant_consent(
    db: AsyncSession,
    *,
    granting_user: User,
    student_id: uuid.UUID,
    consent_type: ConsentGrantType,
    method: ConsentMethod,
    ip_address: str,
) -> list[ConsentRecord]:
    """
    Otorga consentimiento para un estudiante.

    Roles permitidos:
      - apoderado: para su hijo (debe tener parent_student_link)
      - estudiante adulto: para si mismo
    """
    # Determinar student_id real
    target_student_id = _resolve_student_id(granting_user, student_id)

    # Verificar autorizacion
    await _verify_grant_permission(db, granting_user, target_student_id)

    consent_types = _GRANT_TYPE_MAP[consent_type]
    now = datetime.now(timezone.utc)
    created_records: list[ConsentRecord] = []

    for ct in consent_types:
        # Revocar registro anterior si existe
        await _revoke_existing(db, target_student_id, ct, now)

        # Crear nuevo registro
        record = ConsentRecord(
            student_id=target_student_id,
            granted_by=granting_user.id,
            consent_type=ct,
            granted=True,
            granted_at=now,
            ip_address=ip_address,
            method=method,
        )
        db.add(record)
        created_records.append(record)

    await db.flush()

    logger.info(
        "Consentimiento otorgado",
        student_id=str(target_student_id),
        granted_by=str(granting_user.id),
        types=[ct.value for ct in consent_types],
    )

    return created_records


# ---------------------------------------------------------------------------
# Revocar consentimiento
# ---------------------------------------------------------------------------


async def revoke_consent(
    db: AsyncSession,
    *,
    revoking_user: User,
    student_id: uuid.UUID,
    consent_type: ConsentGrantType,
) -> bool:
    """
    Revoca consentimiento para un estudiante.

    Retorna True si se revoco data_storage (programa eliminacion de datos).
    """
    target_student_id = _resolve_student_id(revoking_user, student_id)
    await _verify_grant_permission(db, revoking_user, target_student_id)

    consent_types = _GRANT_TYPE_MAP[consent_type]
    now = datetime.now(timezone.utc)
    data_deletion_scheduled = False

    for ct in consent_types:
        await _revoke_existing(db, target_student_id, ct, now)
        if ct == ConsentType.DATA_STORAGE:
            data_deletion_scheduled = True

    await db.flush()

    logger.info(
        "Consentimiento revocado",
        student_id=str(target_student_id),
        revoked_by=str(revoking_user.id),
        types=[ct.value for ct in consent_types],
        data_deletion_scheduled=data_deletion_scheduled,
    )

    return data_deletion_scheduled


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_student_id(user: User, requested_student_id: uuid.UUID) -> uuid.UUID:
    """Resuelve el student_id real basado en el rol del usuario."""
    if user.role == UserRole.ESTUDIANTE:
        # Estudiante solo puede otorgar para si mismo
        return user.id
    return requested_student_id


async def _verify_grant_permission(
    db: AsyncSession,
    user: User,
    student_id: uuid.UUID,
) -> None:
    """Verifica que el usuario tenga permiso para gestionar consentimiento."""
    # Super admin y admin de colegio siempre pueden
    if user.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN_COLEGIO):
        return

    # Estudiante solo para si mismo
    if user.role == UserRole.ESTUDIANTE:
        if user.id != student_id:
            raise AuthorizationError("Solo puedes gestionar tu propio consentimiento")
        return

    # Apoderado: verificar vinculo parent-student
    if user.role == UserRole.APODERADO:
        from app.auth.models import ParentStudentLink

        query = select(ParentStudentLink).where(
            ParentStudentLink.parent_id == user.id,
            ParentStudentLink.student_id == student_id,
            ParentStudentLink.verified.is_(True),
        )
        result = await db.execute(query)
        link = result.scalar_one_or_none()

        if not link:
            raise AuthorizationError(
                "No tienes un vinculo verificado con este estudiante"
            )
        return

    raise AuthorizationError("Rol no autorizado para gestionar consentimiento")


async def _get_active_records(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> list[ConsentRecord]:
    """Obtiene registros de consentimiento activos (no revocados)."""
    query = select(ConsentRecord).where(
        ConsentRecord.student_id == student_id,
        ConsentRecord.granted.is_(True),
        ConsentRecord.revoked_at.is_(None),
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def _revoke_existing(
    db: AsyncSession,
    student_id: uuid.UUID,
    consent_type: ConsentType,
    revoked_at: datetime,
) -> None:
    """Revoca registros existentes de un tipo de consentimiento."""
    query = select(ConsentRecord).where(
        ConsentRecord.student_id == student_id,
        ConsentRecord.consent_type == consent_type,
        ConsentRecord.revoked_at.is_(None),
    )
    result = await db.execute(query)
    existing = result.scalars().all()

    for record in existing:
        record.revoked_at = revoked_at
