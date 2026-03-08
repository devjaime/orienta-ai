"""
Vocari Backend - Servicio de Careers.

Logica de negocio para catalogo de carreras y recomendaciones.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.careers.models import Career
from app.careers.recommendation import calcular_compatibilidad, generar_razones_match
from app.careers.schemas import (
    CareerCreate,
    CareerRecommendation,
    CareerRecommendationsResponse,
    CareerResponse,
    CareerUpdate,
)
from app.common.exceptions import CareerNotFoundError
from app.common.pagination import PaginatedResult, PaginationParams

logger = structlog.get_logger()


async def list_careers(
    db: AsyncSession,
    pagination: PaginationParams,
    area: str | None = None,
    active_only: bool = True,
) -> PaginatedResult[Career]:
    """Lista carreras con filtros opcionales."""
    count_query = select(func.count()).select_from(Career)
    items_query = select(Career).order_by(Career.name)

    if active_only:
        count_query = count_query.where(Career.is_active.is_(True))
        items_query = items_query.where(Career.is_active.is_(True))

    if area:
        count_query = count_query.where(Career.area == area)
        items_query = items_query.where(Career.area == area)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    items_query = items_query.offset(pagination.offset).limit(pagination.per_page)
    result = await db.execute(items_query)
    items = list(result.scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
    )


async def get_career_by_id(db: AsyncSession, career_id: uuid.UUID) -> Career:
    """Obtiene una carrera por ID."""
    result = await db.execute(select(Career).where(Career.id == career_id))
    career = result.scalar_one_or_none()

    if not career:
        raise CareerNotFoundError()

    return career


async def create_career(db: AsyncSession, data: CareerCreate) -> Career:
    """Crea una nueva carrera."""
    career = Career(
        name=data.name,
        area=data.area,
        holland_codes=data.holland_codes,
        description=data.description,
        salary_range=data.salary_range,
        employability=data.employability,
        saturation_index=data.saturation_index,
        mineduc_data=data.mineduc_data,
    )
    db.add(career)
    await db.flush()
    logger.info("Carrera creada", career_id=str(career.id), name=data.name)
    return career


async def update_career(
    db: AsyncSession, career_id: uuid.UUID, data: CareerUpdate
) -> Career:
    """Actualiza una carrera existente."""
    career = await get_career_by_id(db, career_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(career, field, value)
    await db.flush()
    logger.info("Carrera actualizada", career_id=str(career_id))
    return career


async def get_recommendations(
    db: AsyncSession,
    holland_code: str,
    limit: int = 10,
) -> CareerRecommendationsResponse:
    """Genera recomendaciones de carreras basadas en un codigo Holland."""
    # Obtener todas las carreras activas
    result = await db.execute(
        select(Career).where(Career.is_active.is_(True))
    )
    all_careers = list(result.scalars().all())

    # Calcular compatibilidad para cada carrera
    scored: list[tuple[Career, float, list[str]]] = []
    for career in all_careers:
        codes = career.holland_codes if isinstance(career.holland_codes, list) else []
        match_score = calcular_compatibilidad(holland_code, codes)
        reasons = generar_razones_match(holland_code, codes, career.name)
        scored.append((career, match_score, reasons))

    # Ordenar por score descendente
    scored.sort(key=lambda x: x[1], reverse=True)

    # Tomar top N
    recommendations = [
        CareerRecommendation(
            career=CareerResponse.model_validate(career),
            match_score=score,
            match_reasons=reasons,
        )
        for career, score, reasons in scored[:limit]
    ]

    return CareerRecommendationsResponse(
        holland_code=holland_code,
        recommendations=recommendations,
        total_careers_analyzed=len(all_careers),
    )
