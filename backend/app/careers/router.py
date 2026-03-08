"""
Vocari Backend - Router de Careers.

Endpoints para catalogo de carreras y recomendaciones vocacionales.
"""

import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.pagination import PaginationParams
from app.careers.schemas import (
    CareerCreate,
    CareerListResponse,
    CareerRecommendationsResponse,
    CareerResponse,
    CareerUpdate,
)
from app.careers.service import (
    create_career,
    get_career_by_id,
    get_recommendations,
    list_careers,
    update_career,
)
from app.tests_vocational.service import get_latest_riasec_result

router = APIRouter()


@router.get("", response_model=CareerListResponse)
async def list_all_careers(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    area: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> CareerListResponse:
    """Lista carreras con filtro opcional por area."""
    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_careers(db, pagination, area)
    return CareerListResponse(
        items=[CareerResponse.model_validate(c) for c in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page,
    )


@router.get("/recommendations", response_model=CareerRecommendationsResponse)
async def get_my_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> CareerRecommendationsResponse:
    """
    Obtiene recomendaciones de carreras para el usuario autenticado.
    Basado en su ultimo resultado RIASEC.
    """
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    latest_riasec = await get_latest_riasec_result(db, user.id, tenant_id)

    if latest_riasec is None or not latest_riasec.result_code:
        # Sin test RIASEC, devolver las carreras mas populares
        return await get_recommendations(db, "SIA", limit)

    return await get_recommendations(db, latest_riasec.result_code, limit)


@router.get("/recommendations/{holland_code}", response_model=CareerRecommendationsResponse)
async def get_recommendations_by_code(
    holland_code: str,
    limit: int = Query(default=10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> CareerRecommendationsResponse:
    """Obtiene recomendaciones de carreras para un codigo Holland especifico."""
    return await get_recommendations(db, holland_code.upper(), limit)


@router.get("/{career_id}", response_model=CareerResponse)
async def get_career(
    career_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> CareerResponse:
    """Obtiene el detalle de una carrera por ID."""
    career = await get_career_by_id(db, career_id)
    return CareerResponse.model_validate(career)


@router.post("", response_model=CareerResponse, status_code=201)
async def create_new_career(
    data: CareerCreate,
    user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> CareerResponse:
    """Crea una nueva carrera. Solo super admin."""
    career = await create_career(db, data)
    return CareerResponse.model_validate(career)


@router.patch("/{career_id}", response_model=CareerResponse)
async def update_existing_career(
    career_id: uuid.UUID,
    data: CareerUpdate,
    user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> CareerResponse:
    """Actualiza una carrera. Solo super admin."""
    career = await update_career(db, career_id, data)
    return CareerResponse.model_validate(career)
