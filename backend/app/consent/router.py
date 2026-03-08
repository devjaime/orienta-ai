"""
Vocari Backend - Router de Consent.

Endpoints para consultar, otorgar y revocar consentimiento.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.consent.schemas import (
    ConsentGrantRequest,
    ConsentGrantResponse,
    ConsentRecordResponse,
    ConsentRevokeRequest,
    ConsentRevokeResponse,
    ConsentStatusResponse,
)
from app.consent.service import (
    get_consent_status,
    grant_consent,
    revoke_consent,
)

router = APIRouter()


@router.get("/status", response_model=ConsentStatusResponse)
async def get_consent_status_endpoint(
    student_id: uuid.UUID | None = None,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> ConsentStatusResponse:
    """
    Estado de consentimiento de un estudiante.

    - Estudiante: ve su propio estado (ignora student_id).
    - Apoderado/orientador/admin: debe proveer student_id.
    """
    target_id = user.id if user.role == UserRole.ESTUDIANTE else student_id
    if target_id is None:
        from app.common.exceptions import ValidationError

        raise ValidationError("Se requiere student_id para este rol")

    status = await get_consent_status(db, target_id)
    return ConsentStatusResponse(**status)


@router.post("/grant", response_model=ConsentGrantResponse, status_code=201)
async def grant_consent_endpoint(
    data: ConsentGrantRequest,
    request: Request,
    user: User = Depends(
        require_roles(
            UserRole.APODERADO,
            UserRole.ESTUDIANTE,
            UserRole.ADMIN_COLEGIO,
            UserRole.SUPER_ADMIN,
        )
    ),
    db=Depends(get_async_session),
) -> ConsentGrantResponse:
    """
    Otorgar consentimiento.

    - Apoderado: para su hijo (student_id requerido).
    - Estudiante adulto: para si mismo.
    - Admin: para cualquier estudiante de su institucion.
    """
    ip_address = request.client.host if request.client else "0.0.0.0"
    student_id = data.student_id or user.id

    records = await grant_consent(
        db,
        granting_user=user,
        student_id=student_id,
        consent_type=data.consent_type,
        method=data.method,
        ip_address=ip_address,
    )

    return ConsentGrantResponse(
        message="Consentimiento otorgado exitosamente",
        records=[ConsentRecordResponse.model_validate(r) for r in records],
    )


@router.post("/revoke", response_model=ConsentRevokeResponse)
async def revoke_consent_endpoint(
    data: ConsentRevokeRequest,
    user: User = Depends(
        require_roles(
            UserRole.APODERADO,
            UserRole.ESTUDIANTE,
            UserRole.ADMIN_COLEGIO,
            UserRole.SUPER_ADMIN,
        )
    ),
    db=Depends(get_async_session),
) -> ConsentRevokeResponse:
    """
    Revocar consentimiento.

    Si se revoca data_storage, se programa la eliminacion de datos.
    """
    student_id = data.student_id or user.id

    data_deletion = await revoke_consent(
        db,
        revoking_user=user,
        student_id=student_id,
        consent_type=data.consent_type,
    )

    return ConsentRevokeResponse(
        message="Consentimiento revocado exitosamente",
        consent_type=data.consent_type,
        data_deletion_scheduled=data_deletion,
    )
