"""
Vocari Backend - Servicio de Audit Log.

Helper para crear registros y consulta con filtros para admins.
"""

import uuid

import structlog
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.models import AuditLog
from app.audit.schemas import AuditLogCreate
from app.common.pagination import PaginatedResult, PaginationParams
from app.common.tenant import apply_tenant_filter

logger = structlog.get_logger()


async def create_audit_log(
    db: AsyncSession,
    data: AuditLogCreate,
) -> AuditLog:
    """Crea un registro de auditoria."""
    audit_log = AuditLog(
        user_id=data.user_id,
        institution_id=data.institution_id,
        action=data.action,
        resource_type=data.resource_type,
        resource_id=data.resource_id,
        details=data.details,
        ip_address=data.ip_address,
    )
    db.add(audit_log)
    await db.flush()

    logger.info(
        "Audit log creado",
        audit_id=str(audit_log.id),
        action=data.action,
        resource_type=data.resource_type,
        user_id=str(data.user_id),
    )
    return audit_log


async def log_action(
    db: AsyncSession,
    user_id: uuid.UUID,
    action: str,
    resource_type: str,
    resource_id: uuid.UUID | None = None,
    institution_id: uuid.UUID | None = None,
    details: dict | None = None,
    ip_address: str = "0.0.0.0",
) -> AuditLog:
    """Atajo para registrar una accion de auditoria."""
    data = AuditLogCreate(
        user_id=user_id,
        institution_id=institution_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
    )
    return await create_audit_log(db, data)


async def list_audit_logs(
    db: AsyncSession,
    pagination: PaginationParams,
    tenant_institution_id: uuid.UUID | None = None,
    user_id_filter: uuid.UUID | None = None,
    action_filter: str | None = None,
    resource_type_filter: str | None = None,
) -> PaginatedResult[AuditLog]:
    """Lista registros de auditoria con filtros opcionales."""
    conditions = []

    if user_id_filter:
        conditions.append(AuditLog.user_id == user_id_filter)
    if action_filter:
        conditions.append(AuditLog.action == action_filter)
    if resource_type_filter:
        conditions.append(AuditLog.resource_type == resource_type_filter)

    # Contar total
    count_query = select(func.count()).select_from(AuditLog)
    if conditions:
        count_query = count_query.where(and_(*conditions))
    count_query = apply_tenant_filter(
        count_query, AuditLog.institution_id, tenant_institution_id
    )
    total = (await db.execute(count_query)).scalar() or 0

    # Obtener items
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if conditions:
        query = query.where(and_(*conditions))
    query = apply_tenant_filter(query, AuditLog.institution_id, tenant_institution_id)
    query = query.offset(pagination.offset).limit(pagination.per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
    )
