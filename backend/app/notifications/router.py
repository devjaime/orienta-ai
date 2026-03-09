"""
Vocari Backend - Router de Notifications.

Endpoints para listar, leer y marcar notificaciones.
"""

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.auth.models import User
from app.common.database import get_async_session
from app.common.pagination import PaginationParams
from app.notifications.schemas import (
    MarkReadRequest,
    NotificationListResponse,
    NotificationResponse,
)
from app.notifications.service import (
    get_unread_count,
    list_notifications,
    mark_all_as_read,
    mark_as_read,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def list_my_notifications(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> NotificationListResponse:
    """Lista las notificaciones del usuario autenticado."""
    pagination = PaginationParams(page=page, per_page=per_page)
    result = await list_notifications(db, user.id, pagination, unread_only)
    unread_count = await get_unread_count(db, user.id)

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in result.items],
        total=result.total,
        unread_count=unread_count,
        page=result.page,
        per_page=result.per_page,
    )


@router.get("/unread-count")
async def get_my_unread_count(
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> dict[str, int]:
    """Obtiene el conteo de notificaciones no leidas."""
    count = await get_unread_count(db, user.id)
    return {"unread_count": count}


@router.post("/mark-read")
async def mark_notifications_read(
    data: MarkReadRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> dict[str, int]:
    """Marca notificaciones especificas como leidas."""
    updated = await mark_as_read(db, user.id, data.notification_ids)
    return {"updated": updated}


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> dict[str, int]:
    """Marca todas las notificaciones como leidas."""
    updated = await mark_all_as_read(db, user.id)
    return {"updated": updated}
