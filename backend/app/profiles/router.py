"""
Vocari Backend - Router de Profiles.

Endpoints para consultar y actualizar el perfil longitudinal del estudiante.
"""

import uuid

from fastapi import APIRouter, Depends

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.exceptions import ValidationError
from app.profiles.schemas import ProfileResponse, ProfileUpdate
from app.profiles.service import (
    get_or_create_profile,
    get_profile_by_student_id,
    update_profile,
)

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> ProfileResponse:
    """Obtiene el perfil longitudinal del usuario autenticado. Crea uno si no existe."""
    if user.institution_id is None:
        raise ValidationError("El usuario debe pertenecer a una institucion")

    profile = await get_or_create_profile(db, user.id, user.institution_id)
    return ProfileResponse.model_validate(profile)


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> ProfileResponse:
    """Actualiza parcialmente el perfil del usuario autenticado."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    profile = await update_profile(db, user.id, data, tenant_id)
    return ProfileResponse.model_validate(profile)


@router.get("/{student_id}", response_model=ProfileResponse)
async def get_student_profile(
    student_id: uuid.UUID,
    user: User = Depends(
        require_roles(
            UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO,
            UserRole.SUPER_ADMIN, UserRole.APODERADO,
        )
    ),
    db=Depends(get_async_session),
) -> ProfileResponse:
    """Obtiene el perfil de un estudiante. Solo orientadores, admins y apoderados."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    profile = await get_profile_by_student_id(db, student_id, tenant_id)
    return ProfileResponse.model_validate(profile)
