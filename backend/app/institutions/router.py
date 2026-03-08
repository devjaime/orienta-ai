"""
Vocari Backend - Router de Institutions.

CRUD de instituciones con multi-tenancy.
"""

import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.pagination import PaginationParams
from app.institutions.schemas import (
    InstitutionCreate,
    InstitutionListResponse,
    InstitutionResponse,
    InstitutionUpdate,
)
from app.institutions.service import (
    create_institution,
    delete_institution,
    get_institution_by_id,
    list_institutions,
    update_institution,
)

router = APIRouter()


@router.get("", response_model=InstitutionListResponse)
async def list_all_institutions(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> InstitutionListResponse:
    """Lista instituciones. Super admin ve todas, otros solo la suya."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id

    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_institutions(db, pagination, tenant_id)

    return InstitutionListResponse(
        items=[InstitutionResponse.model_validate(inst) for inst in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page,
    )


@router.get("/{institution_id}", response_model=InstitutionResponse)
async def get_institution(
    institution_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> InstitutionResponse:
    """Obtiene una institucion por ID."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    institution = await get_institution_by_id(db, institution_id, tenant_id)
    return InstitutionResponse.model_validate(institution)


@router.post("", response_model=InstitutionResponse, status_code=201)
async def create_new_institution(
    data: InstitutionCreate,
    user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> InstitutionResponse:
    """Crea una nueva institucion. Solo super admin."""
    institution = await create_institution(db, data)
    return InstitutionResponse.model_validate(institution)


@router.patch("/{institution_id}", response_model=InstitutionResponse)
async def update_existing_institution(
    institution_id: uuid.UUID,
    data: InstitutionUpdate,
    user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_COLEGIO)),
    db=Depends(get_async_session),
) -> InstitutionResponse:
    """Actualiza una institucion. Super admin o admin del colegio."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    institution = await update_institution(db, institution_id, data, tenant_id)
    return InstitutionResponse.model_validate(institution)


@router.delete("/{institution_id}", status_code=204)
async def deactivate_institution(
    institution_id: uuid.UUID,
    user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> None:
    """Desactiva una institucion. Solo super admin."""
    await delete_institution(db, institution_id)
