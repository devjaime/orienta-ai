"""
Vocari Backend - Router de Dashboards.

5 endpoints GET, uno por rol:
- /student — Dashboard del estudiante
- /orientador — Dashboard del orientador
- /parent — Dashboard del apoderado
- /admin — Dashboard del admin de colegio
- /super-admin — Dashboard del super admin
"""

from fastapi import APIRouter, Depends

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.dashboards.schemas import (
    AdminDashboardResponse,
    OrientadorDashboardResponse,
    ParentDashboardResponse,
    StudentDashboardResponse,
    SuperAdminDashboardResponse,
)
from app.dashboards.service import (
    get_admin_dashboard,
    get_orientador_dashboard,
    get_parent_dashboard,
    get_student_dashboard,
    get_super_admin_dashboard,
)

router = APIRouter()


@router.get("/student", response_model=StudentDashboardResponse)
async def student_dashboard(
    user: User = Depends(require_roles(UserRole.ESTUDIANTE)),
    db=Depends(get_async_session),
) -> StudentDashboardResponse:
    """Dashboard del estudiante con sesiones, tests, perfil y carreras."""
    return await get_student_dashboard(db, user)


@router.get("/orientador", response_model=OrientadorDashboardResponse)
async def orientador_dashboard(
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> OrientadorDashboardResponse:
    """Dashboard del orientador con carga de trabajo, estudiantes y alertas."""
    return await get_orientador_dashboard(db, user)


@router.get("/parent", response_model=ParentDashboardResponse)
async def parent_dashboard(
    user: User = Depends(require_roles(UserRole.APODERADO)),
    db=Depends(get_async_session),
) -> ParentDashboardResponse:
    """Dashboard del apoderado con informacion de hijos vinculados."""
    return await get_parent_dashboard(db, user)


@router.get("/admin", response_model=AdminDashboardResponse)
async def admin_dashboard(
    user: User = Depends(
        require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> AdminDashboardResponse:
    """Dashboard del admin de colegio con estadisticas institucionales."""
    return await get_admin_dashboard(db, user)


@router.get("/super-admin", response_model=SuperAdminDashboardResponse)
async def super_admin_dashboard(
    user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> SuperAdminDashboardResponse:
    """Dashboard del super admin con estadisticas globales de la plataforma."""
    return await get_super_admin_dashboard(db)
