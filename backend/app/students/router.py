"""
Vocari Backend - Router de estudiantes.
"""

from fastapi import APIRouter, Depends

from app.auth.middleware import get_current_user
from app.auth.models import User
from app.common.database import get_async_session
from app.students.schemas import NextActionsResponse
from app.students.service import get_next_actions_for_user

router = APIRouter()


@router.get("/me/next-actions", response_model=NextActionsResponse)
async def get_my_next_actions(
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> NextActionsResponse:
    """Entrega acciones recomendadas para el estudiante autenticado."""
    actions = await get_next_actions_for_user(db, user)
    return NextActionsResponse(items=actions)

