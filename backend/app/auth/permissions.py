"""
Vocari Backend - RBAC (Role-Based Access Control).

Decoradores y dependencies para verificar roles y permisos.
"""

from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import Depends

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.common.exceptions import CrossTenantAccessError, InsufficientRoleError


def require_roles(*roles: UserRole) -> Callable:  # type: ignore[type-arg]
    """
    Dependency factory que verifica que el usuario tenga uno de los roles permitidos.

    Uso:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_roles(UserRole.SUPER_ADMIN))):
            ...
    """

    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise InsufficientRoleError(
                f"Se requiere rol: {', '.join(r.value for r in roles)}. "
                f"Rol actual: {user.role.value}"
            )
        return user

    return role_checker


def require_same_institution(
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency que verifica que el usuario pertenezca a una institucion.

    Uso:
        @router.get("/institution-data")
        async def endpoint(user: User = Depends(require_same_institution)):
            ...
    """
    if user.role == UserRole.SUPER_ADMIN:
        return user  # Super admin puede acceder a todo

    if user.institution_id is None:
        raise CrossTenantAccessError("Usuario no pertenece a ninguna institucion")

    return user


# --- Shortcuts para roles comunes ---

RequireAdmin = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_COLEGIO))
RequireSuperAdmin = Depends(require_roles(UserRole.SUPER_ADMIN))
RequireOrientador = Depends(
    require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
)
RequireEstudiante = Depends(require_roles(UserRole.ESTUDIANTE))
RequireApoderado = Depends(require_roles(UserRole.APODERADO))
