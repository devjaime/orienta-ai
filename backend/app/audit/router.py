"""
Vocari Backend - Router de Audit Log.

Endpoint para consultar registros de auditoria (solo admin y super admin).
"""

import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.pagination import PaginationParams
from app.audit.schemas import AuditLogListResponse, AuditLogResponse
from app.audit.service import list_audit_logs

router = APIRouter()


@router.get("", response_model=AuditLogListResponse)
async def list_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: uuid.UUID | None = Query(default=None),
    action: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    user: User = Depends(
        require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AuditLogListResponse:
    """Lista registros de auditoria con filtros. Solo admin y super admin."""
    tenant_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id

    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_audit_logs(
        db,
        pagination,
        tenant_institution_id=tenant_id,
        user_id_filter=user_id,
        action_filter=action,
        resource_type_filter=resource_type,
    )

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page,
    )
