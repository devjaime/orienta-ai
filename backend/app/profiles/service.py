"""
Vocari Backend - Servicio de Profiles.

Logica de negocio para gestionar el perfil longitudinal del estudiante.
"""

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.common.exceptions import NotFoundError
from app.common.tenant import apply_tenant_filter
from app.profiles.models import StudentLongitudinalProfile
from app.profiles.schemas import ProfileUpdate

logger = structlog.get_logger()


async def get_or_create_profile(
    db: AsyncSession,
    student_id: uuid.UUID,
    institution_id: uuid.UUID,
) -> StudentLongitudinalProfile:
    """Obtiene el perfil del estudiante o crea uno vacio si no existe."""
    result = await db.execute(
        select(StudentLongitudinalProfile).where(
            StudentLongitudinalProfile.student_id == student_id
        )
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = StudentLongitudinalProfile(
            student_id=student_id,
            institution_id=institution_id,
            skills={},
            interests={},
            learning_patterns={},
            happiness_indicators={},
            career_recommendations=[],
            riasec_history=[],
            data_sources=[],
        )
        db.add(profile)
        await db.flush()
        logger.info("Perfil longitudinal creado", student_id=str(student_id))

    return profile


async def get_profile_by_student_id(
    db: AsyncSession,
    student_id: uuid.UUID,
    tenant_institution_id: uuid.UUID | None = None,
) -> StudentLongitudinalProfile:
    """Obtiene el perfil de un estudiante con filtro de tenant."""
    query = select(StudentLongitudinalProfile).where(
        StudentLongitudinalProfile.student_id == student_id
    )
    query = apply_tenant_filter(
        query, StudentLongitudinalProfile.institution_id, tenant_institution_id
    )

    result = await db.execute(query)
    profile = result.scalar_one_or_none()

    if not profile:
        raise NotFoundError("Perfil del estudiante no encontrado")

    return profile


async def update_profile(
    db: AsyncSession,
    student_id: uuid.UUID,
    data: ProfileUpdate,
    tenant_institution_id: uuid.UUID | None = None,
) -> StudentLongitudinalProfile:
    """Actualiza parcialmente el perfil longitudinal."""
    profile = await get_profile_by_student_id(db, student_id, tenant_institution_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            # Convertir Pydantic models a dict
            if hasattr(value, "model_dump"):
                value = value.model_dump()
            setattr(profile, field, value)

    profile.last_updated = datetime.now(timezone.utc)
    await db.flush()

    logger.info("Perfil longitudinal actualizado", student_id=str(student_id))
    return profile


async def append_riasec_to_history(
    db: AsyncSession,
    student_id: uuid.UUID,
    institution_id: uuid.UUID,
    riasec_data: dict,
) -> StudentLongitudinalProfile:
    """Agrega un resultado RIASEC al historial del perfil."""
    profile = await get_or_create_profile(db, student_id, institution_id)

    history = list(profile.riasec_history) if isinstance(profile.riasec_history, list) else []
    history.append({
        **riasec_data,
        "fecha": datetime.now(timezone.utc).isoformat(),
    })
    profile.riasec_history = history
    flag_modified(profile, "riasec_history")
    profile.last_updated = datetime.now(timezone.utc)

    # Actualizar data_sources
    sources = list(profile.data_sources) if isinstance(profile.data_sources, list) else []
    if "riasec_test" not in sources:
        sources.append("riasec_test")
        profile.data_sources = sources
        flag_modified(profile, "data_sources")

    await db.flush()
    logger.info("RIASEC agregado al historial", student_id=str(student_id))
    return profile
