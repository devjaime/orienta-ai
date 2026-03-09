"""
Vocari Backend - Servicio de Parent-Student Linking.

Logica para crear, verificar y listar vinculos apoderado-estudiante.
"""

import uuid

import structlog
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import ParentStudentLink, User, UserRole
from app.common.exceptions import (
    ConflictError,
    NotFoundError,
    UserNotFoundError,
    ValidationError,
)

logger = structlog.get_logger()


async def create_link(
    db: AsyncSession,
    parent: User,
    student_email: str,
) -> ParentStudentLink:
    """
    Crea una solicitud de vinculacion apoderado-estudiante.

    El vinculo se crea como no verificado. Un admin u orientador debe verificarlo.
    """
    # Buscar al estudiante por email
    student_q = select(User).where(
        and_(
            User.email == student_email,
            User.role == UserRole.ESTUDIANTE,
            User.is_active.is_(True),
        )
    )
    result = await db.execute(student_q)
    student = result.scalar_one_or_none()

    if not student:
        raise UserNotFoundError(
            f"No se encontro un estudiante activo con email '{student_email}'"
        )

    # Verificar que el estudiante pertenezca a la misma institucion
    if parent.institution_id and student.institution_id:
        if parent.institution_id != student.institution_id:
            raise ValidationError(
                "El estudiante pertenece a una institucion diferente"
            )

    # Verificar que no exista un vinculo duplicado
    existing_q = select(ParentStudentLink).where(
        and_(
            ParentStudentLink.parent_id == parent.id,
            ParentStudentLink.student_id == student.id,
        )
    )
    existing_result = await db.execute(existing_q)
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise ConflictError("Ya existe un vinculo con este estudiante")

    link = ParentStudentLink(
        parent_id=parent.id,
        student_id=student.id,
        verified=False,
    )
    db.add(link)
    await db.flush()

    logger.info(
        "Vinculo parent-student creado",
        link_id=str(link.id),
        parent_id=str(parent.id),
        student_id=str(student.id),
    )
    return link


async def verify_link(
    db: AsyncSession,
    link_id: uuid.UUID,
    verified_by: User,
) -> ParentStudentLink:
    """
    Verifica un vinculo apoderado-estudiante.

    Solo admin_colegio, orientador o super_admin pueden verificar.
    """
    link_q = select(ParentStudentLink).where(ParentStudentLink.id == link_id)
    result = await db.execute(link_q)
    link = result.scalar_one_or_none()

    if not link:
        raise NotFoundError("Vinculo no encontrado")

    if link.verified:
        raise ConflictError("El vinculo ya esta verificado")

    # Verificar que el admin/orientador pertenezca a la misma institucion
    if verified_by.role != UserRole.SUPER_ADMIN:
        # Obtener el estudiante para verificar la institucion
        student_q = select(User).where(User.id == link.student_id)
        student_result = await db.execute(student_q)
        student = student_result.scalar_one_or_none()

        if student and student.institution_id != verified_by.institution_id:
            raise ValidationError(
                "No puedes verificar vinculos de otra institucion"
            )

    link.verified = True
    await db.flush()

    logger.info(
        "Vinculo parent-student verificado",
        link_id=str(link.id),
        verified_by=str(verified_by.id),
    )
    return link


async def list_links_for_parent(
    db: AsyncSession,
    parent_id: uuid.UUID,
) -> list[ParentStudentLink]:
    """Lista todos los vinculos de un apoderado."""
    query = (
        select(ParentStudentLink)
        .where(ParentStudentLink.parent_id == parent_id)
        .order_by(ParentStudentLink.created_at.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_pending_links(
    db: AsyncSession,
    institution_id: uuid.UUID | None = None,
) -> list[ParentStudentLink]:
    """Lista vinculos pendientes de verificacion, filtrados por institucion."""
    query = select(ParentStudentLink).where(
        ParentStudentLink.verified.is_(False)
    )

    if institution_id:
        # Filtrar por institucion del estudiante
        query = (
            query.join(User, User.id == ParentStudentLink.student_id)
            .where(User.institution_id == institution_id)
        )

    query = query.order_by(ParentStudentLink.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_link(
    db: AsyncSession,
    link_id: uuid.UUID,
    user: User,
) -> None:
    """Elimina un vinculo. El apoderado puede eliminar sus propios vinculos."""
    link_q = select(ParentStudentLink).where(ParentStudentLink.id == link_id)
    result = await db.execute(link_q)
    link = result.scalar_one_or_none()

    if not link:
        raise NotFoundError("Vinculo no encontrado")

    # Solo el apoderado dueno, admin o super admin pueden eliminar
    if user.role == UserRole.APODERADO and link.parent_id != user.id:
        raise ValidationError("No puedes eliminar vinculos de otro apoderado")

    await db.delete(link)
    await db.flush()

    logger.info(
        "Vinculo parent-student eliminado",
        link_id=str(link_id),
        deleted_by=str(user.id),
    )
