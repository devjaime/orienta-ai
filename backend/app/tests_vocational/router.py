"""
Vocari Backend - Router de Tests Vocacionales.

Endpoints para guardar y consultar resultados de tests RIASEC.
"""

import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.exceptions import ValidationError
from app.common.pagination import PaginationParams
from app.tests_vocational.schemas import (
    TestResultCreate,
    TestResultListResponse,
    TestResultResponse,
)
from app.tests_vocational.service import (
    get_latest_riasec_result,
    get_test_result_by_id,
    list_test_results_by_user,
    save_riasec_result,
)

router = APIRouter()


@router.post("/riasec", response_model=TestResultResponse, status_code=201)
async def submit_riasec_test(
    data: TestResultCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> TestResultResponse:
    """Guarda el resultado de un test RIASEC del estudiante."""
    test_result = await save_riasec_result(db, user.id, user.institution_id, data)
    return TestResultResponse.model_validate(test_result)


@router.get("/riasec/latest", response_model=TestResultResponse | None)
async def get_my_latest_riasec(
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> TestResultResponse | None:
    """Obtiene el ultimo resultado RIASEC del usuario autenticado."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    result = await get_latest_riasec_result(db, user.id, tenant_id)
    if result is None:
        return None
    return TestResultResponse.model_validate(result)


@router.get("/me", response_model=TestResultListResponse)
async def list_my_test_results(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    test_type: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> TestResultListResponse:
    """Lista los resultados de tests del usuario autenticado."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_test_results_by_user(
        db, user.id, pagination, test_type, tenant_id
    )
    return TestResultListResponse(
        items=[TestResultResponse.model_validate(r) for r in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page,
    )


@router.get("/{result_id}", response_model=TestResultResponse)
async def get_test_result(
    result_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> TestResultResponse:
    """Obtiene un resultado de test por ID."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    test_result = await get_test_result_by_id(db, result_id, tenant_id)
    return TestResultResponse.model_validate(test_result)


@router.get("/student/{student_id}", response_model=TestResultListResponse)
async def list_student_test_results(
    student_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    test_type: str | None = Query(default=None),
    user: User = Depends(
        require_roles(
            UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN, UserRole.APODERADO
        )
    ),
    db=Depends(get_async_session),
) -> TestResultListResponse:
    """Lista los resultados de tests de un estudiante. Solo orientadores, admins y apoderados."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_test_results_by_user(
        db, student_id, pagination, test_type, tenant_id
    )
    return TestResultListResponse(
        items=[TestResultResponse.model_validate(r) for r in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page,
    )
