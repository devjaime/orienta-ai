"""
Vocari Backend - Servicio de Tests Vocacionales.

Logica de negocio para guardar y consultar resultados de tests RIASEC.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.common.pagination import PaginatedResult, PaginationParams
from app.common.tenant import apply_tenant_filter
from app.tests_vocational.models import TestResult
from app.tests_vocational.schemas import TestResultCreate

logger = structlog.get_logger()


# --- Mapas de certeza ---
CERTEZA_MAP: dict[str, float] = {
    "Alta": 0.9,
    "Media": 0.6,
    "Exploratoria": 0.3,
}


async def save_riasec_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    institution_id: uuid.UUID,
    data: TestResultCreate,
) -> TestResult:
    """Guarda el resultado de un test RIASEC."""
    test_result = TestResult(
        user_id=user_id,
        institution_id=institution_id,
        test_type="riasec",
        answers={"responses": {str(k): v for k, v in data.respuestas.items()}},
        scores={
            "R": data.puntajes.R,
            "I": data.puntajes.I,
            "A": data.puntajes.A,
            "S": data.puntajes.S,
            "E": data.puntajes.E,
            "C": data.puntajes.C,
        },
        result_code=data.codigo_holland,
        certainty=CERTEZA_MAP.get(data.certeza, 0.5),
        test_metadata={
            "certeza_label": data.certeza,
            "duracion_minutos": data.duracion_minutos,
            "total_preguntas": len(data.respuestas),
        },
    )
    db.add(test_result)
    await db.flush()

    logger.info(
        "Resultado RIASEC guardado",
        test_result_id=str(test_result.id),
        user_id=str(user_id),
        codigo_holland=data.codigo_holland,
    )
    return test_result


async def get_test_result_by_id(
    db: AsyncSession,
    result_id: uuid.UUID,
    tenant_institution_id: uuid.UUID | None = None,
) -> TestResult:
    """Obtiene un resultado de test por ID."""
    query = select(TestResult).where(TestResult.id == result_id)
    query = apply_tenant_filter(query, TestResult.institution_id, tenant_institution_id)

    result = await db.execute(query)
    test_result = result.scalar_one_or_none()

    if not test_result:
        raise NotFoundError("Resultado de test no encontrado")

    return test_result


async def list_test_results_by_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    pagination: PaginationParams,
    test_type: str | None = None,
    tenant_institution_id: uuid.UUID | None = None,
) -> PaginatedResult[TestResult]:
    """Lista los resultados de tests de un usuario."""
    # Contar total
    count_query = select(func.count()).select_from(TestResult).where(
        TestResult.user_id == user_id
    )
    if test_type:
        count_query = count_query.where(TestResult.test_type == test_type)
    count_query = apply_tenant_filter(
        count_query, TestResult.institution_id, tenant_institution_id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Obtener items
    query = (
        select(TestResult)
        .where(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
    )
    if test_type:
        query = query.where(TestResult.test_type == test_type)
    query = apply_tenant_filter(query, TestResult.institution_id, tenant_institution_id)
    query = query.offset(pagination.offset).limit(pagination.per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
    )


async def get_latest_riasec_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    tenant_institution_id: uuid.UUID | None = None,
) -> TestResult | None:
    """Obtiene el ultimo resultado RIASEC de un usuario."""
    query = (
        select(TestResult)
        .where(TestResult.user_id == user_id, TestResult.test_type == "riasec")
        .order_by(TestResult.created_at.desc(), TestResult.id.desc())
        .limit(1)
    )
    query = apply_tenant_filter(query, TestResult.institution_id, tenant_institution_id)

    result = await db.execute(query)
    return result.scalar_one_or_none()
