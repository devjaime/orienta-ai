"""
Vocari Backend - Servicio de Careers.

Logica de negocio para catalogo de carreras y recomendaciones.
"""

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.careers.models import Career, CareerSimulation
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
        # Extraer codigos Holland - puede ser dict o list
        codes: list[str] = []
        if isinstance(career.holland_codes, dict):
            # Si es dict, extraer valores (ej: {"codes": ["I", "R", "C"]})
            codes = list(career.holland_codes.values()) if career.holland_codes else []
            if not codes and career.holland_codes.get("codes"):
                codes = career.holland_codes.get("codes", [])
        elif isinstance(career.holland_codes, list):
            codes = career.holland_codes
        
        # Si los codigos son strings compuestas (ej: "IRC"), splitear
        flat_codes: list[str] = []
        for c in codes:
            if isinstance(c, str) and len(c) >= 3:
                flat_codes.append(c)
            elif isinstance(c, str):
                flat_codes.append(c)
        
        match_score = calcular_compatibilidad(holland_code, flat_codes)
        reasons = generar_razones_match(holland_code, flat_codes, career.name)
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


async def create_career_simulation(
    db: AsyncSession,
    student_id: uuid.UUID,
    career_id: uuid.UUID,
    student_profile: dict | None = None,
) -> CareerSimulation:
    """Genera una simulacion de carrera basada en el perfil del estudiante."""
    career = await get_career_by_id(db, career_id)

    base_salary = career.salary_range.get("median", 500000) if career.salary_range else 500000

    years = list(range(2025, 2045))
    salary_projection = []
    for i, year in enumerate(years):
        growth = 1 + (0.03 * i)
        salary = int(base_salary * growth)
        salary_projection.append({"year": year, "salary": salary})

    milestones = [
        {"year": 2025, "title": "Inicio de estudios", "description": "Comienzo de la carrera"},
        {"year": 2027, "title": "Primer ano completado", "description": "Basicos completados"},
        {"year": 2029, "title": "Practica profesional", "description": "Experiencia laboral inicial"},
        {"year": 2031, "title": "Titulacion", "description": "Egreso y titulacion"},
        {"year": 2033, "title": "Primer empleo formal", "description": "Entrada al mercado laboral"},
        {"year": 2038, "title": "Posicion senior", "description": "Experto en el area"},
    ]

    simulation_data = {
        "career_name": career.name,
        "career_area": career.area,
        "salary_projection": salary_projection,
        "milestones": milestones,
        "employability": career.employability,
        "saturation_index": career.saturation_index,
        "skills_needed": career.holland_codes if isinstance(career.holland_codes, dict) else {},
    }

    ai_narrative = f"""Simulacion de carrera: {career.name}

Esta simulacion presenta un escenario proyectado para un estudiante con el perfil descrito.

Proyeccion salarial:
El salario inicial promedio para {career.name} es de ${base_salary:,.0f} CLP mensuales.
Se proyecta un crecimiento salarial del 3% anual en terminos reales.

Trayectoria profesional:
- 2025-2027: Estudios basicos y formacion fundamental
- 2027-2029: Practicas y experiencia inicial
- 2029-2031: Conclusion de estudios y titulacion
- 2031-2033: Integracion al mercado laboral
- 2033-2038: Crecimiento profesional continuo

Consideraciones:
- Indice de empleabilidad actual: {int(career.employability * 100)}%
- Nivel de saturacion del mercado: {int(career.saturation_index * 100)}%

Esta simulacion es una projection basada en datos actuales del mercado laboral chileno.
Los resultados reales pueden variar segun condiciones economicas y desarrollo personal."""

    simulation = CareerSimulation(
        student_id=student_id,
        career_id=career_id,
        simulation_data=simulation_data,
        ai_narrative=ai_narrative,
        model_used="rule-based-projection",
    )

    db.add(simulation)
    await db.flush()

    logger.info("Simulacion de carrera creada", student_id=str(student_id), career_id=str(career_id))
    return simulation


async def get_student_simulations(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> list[CareerSimulation]:
    """Obtiene las simulaciones de carrera de un estudiante."""
    result = await db.execute(
        select(CareerSimulation)
        .where(CareerSimulation.student_id == student_id)
        .order_by(CareerSimulation.created_at.desc())
    )
    return list(result.scalars().all())
