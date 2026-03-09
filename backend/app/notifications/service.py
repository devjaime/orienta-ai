"""
Vocari Backend - Servicio de Notifications.

CRUD de notificaciones y dispatch.
"""

import uuid

import structlog
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.common.pagination import PaginatedResult, PaginationParams
from app.notifications.models import Notification, NotificationType
from app.notifications.schemas import NotificationCreate

logger = structlog.get_logger()


async def create_notification(
    db: AsyncSession,
    data: NotificationCreate,
) -> Notification:
    """Crea una nueva notificacion para un usuario."""
    notification = Notification(
        user_id=data.user_id,
        notification_type=data.notification_type,
        title=data.title,
        message=data.message,
        extra_data=data.extra_data,
    )
    db.add(notification)
    await db.flush()

    logger.info(
        "Notificacion creada",
        notification_id=str(notification.id),
        user_id=str(data.user_id),
        notification_type=data.notification_type.value,
    )
    return notification


async def dispatch_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    extra_data: dict | None = None,
) -> Notification:
    """Atajo para crear y despachar una notificacion."""
    data = NotificationCreate(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        extra_data=extra_data or {},
    )
    return await create_notification(db, data)


async def list_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    pagination: PaginationParams,
    unread_only: bool = False,
) -> PaginatedResult[Notification]:
    """Lista notificaciones de un usuario con paginacion."""
    base_where = [Notification.user_id == user_id]
    if unread_only:
        base_where.append(Notification.is_read.is_(False))

    # Contar total
    count_query = select(func.count()).select_from(Notification).where(and_(*base_where))
    total = (await db.execute(count_query)).scalar() or 0

    # Obtener items
    query = (
        select(Notification)
        .where(and_(*base_where))
        .order_by(Notification.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.per_page)
    )
    result = await db.execute(query)
    items = list(result.scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
    )


async def get_unread_count(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Obtiene el conteo de notificaciones no leidas."""
    query = (
        select(func.count())
        .select_from(Notification)
        .where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
    )
    return (await db.execute(query)).scalar() or 0


async def mark_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_ids: list[uuid.UUID],
) -> int:
    """Marca notificaciones como leidas. Retorna cuantas se actualizaron."""
    stmt = (
        update(Notification)
        .where(
            and_(
                Notification.user_id == user_id,
                Notification.id.in_(notification_ids),
                Notification.is_read.is_(False),
            )
        )
        .values(is_read=True)
    )
    result = await db.execute(stmt)
    await db.flush()

    updated = result.rowcount  # type: ignore[union-attr]
    logger.info(
        "Notificaciones marcadas como leidas",
        user_id=str(user_id),
        count=updated,
    )
    return updated


async def mark_all_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Marca todas las notificaciones de un usuario como leidas."""
    stmt = (
        update(Notification)
        .where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        .values(is_read=True)
    )
    result = await db.execute(stmt)
    await db.flush()

    updated = result.rowcount  # type: ignore[union-attr]
    logger.info(
        "Todas las notificaciones marcadas como leidas",
        user_id=str(user_id),
        count=updated,
    )
    return updated


async def get_notification_by_id(
    db: AsyncSession,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Notification:
    """Obtiene una notificacion por ID verificando que pertenezca al usuario."""
    query = select(Notification).where(
        and_(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    result = await db.execute(query)
    notification = result.scalar_one_or_none()

    if not notification:
        raise NotFoundError("Notificacion no encontrada")

    return notification


async def delete_notification(
    db: AsyncSession,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Elimina una notificacion del usuario."""
    notification = await get_notification_by_id(db, notification_id, user_id)
    await db.delete(notification)
    await db.flush()

    logger.info(
        "Notificacion eliminada",
        notification_id=str(notification_id),
        user_id=str(user_id),
    )
