"""
Vocari Backend - Servicio de Institutions.

Logica de negocio para CRUD de instituciones con multi-tenancy.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, InstitutionNotFoundError
from app.common.pagination import PaginatedResult, PaginationParams
from app.common.tenant import apply_tenant_filter
from app.institutions.models import Institution
from app.institutions.schemas import InstitutionCreate, InstitutionUpdate

logger = structlog.get_logger()


async def get_institution_by_id(
    db: AsyncSession,
    institution_id: uuid.UUID,
    tenant_institution_id: uuid.UUID | None = None,
) -> Institution:
    """Obtiene una institucion por ID con filtro de tenant."""
    query = select(Institution).where(Institution.id == institution_id)
    query = apply_tenant_filter(query, Institution.id, tenant_institution_id)

    result = await db.execute(query)
    institution = result.scalar_one_or_none()

    if not institution:
        raise InstitutionNotFoundError()

    return institution


async def get_institution_by_slug(db: AsyncSession, slug: str) -> Institution | None:
    """Obtiene una institucion por su slug."""
    result = await db.execute(select(Institution).where(Institution.slug == slug))
    return result.scalar_one_or_none()


async def list_institutions(
    db: AsyncSession,
    pagination: PaginationParams,
    tenant_institution_id: uuid.UUID | None = None,
) -> PaginatedResult[Institution]:
    """Lista instituciones con paginacion y filtro de tenant."""
    # Contar total
    count_query = select(func.count()).select_from(Institution)
    count_query = apply_tenant_filter(count_query, Institution.id, tenant_institution_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Obtener items
    query = select(Institution).order_by(Institution.created_at.desc())
    query = apply_tenant_filter(query, Institution.id, tenant_institution_id)
    query = query.offset(pagination.offset).limit(pagination.per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
    )


async def create_institution(
    db: AsyncSession,
    data: InstitutionCreate,
) -> Institution:
    """Crea una nueva institucion."""
    # Verificar slug unico
    existing = await get_institution_by_slug(db, data.slug)
    if existing:
        raise ConflictError(f"Ya existe una institucion con slug '{data.slug}'")

    institution = Institution(
        name=data.name,
        slug=data.slug,
        domain=data.domain,
        plan=data.plan,
        max_students=data.max_students,
    )
    db.add(institution)
    await db.flush()

    logger.info("Institucion creada", institution_id=str(institution.id), slug=data.slug)
    return institution


async def update_institution(
    db: AsyncSession,
    institution_id: uuid.UUID,
    data: InstitutionUpdate,
    tenant_institution_id: uuid.UUID | None = None,
) -> Institution:
    """Actualiza una institucion existente."""
    institution = await get_institution_by_id(db, institution_id, tenant_institution_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(institution, field, value)

    await db.flush()
    logger.info("Institucion actualizada", institution_id=str(institution_id))
    return institution


async def delete_institution(
    db: AsyncSession,
    institution_id: uuid.UUID,
) -> None:
    """Elimina una institucion (soft delete via is_active)."""
    institution = await get_institution_by_id(db, institution_id)
    institution.is_active = False
    await db.flush()
    logger.info("Institucion desactivada", institution_id=str(institution_id))
