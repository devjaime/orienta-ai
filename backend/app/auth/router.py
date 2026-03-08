"""
Vocari Backend - Auth Router.

Endpoints de autenticacion: Google OAuth, JWT refresh, perfil.
"""

from fastapi import APIRouter, Body, Depends, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.auth.models import User
from app.auth.schemas import AuthMeResponse, AuthTokenResponse, TokenRefreshResponse, UserResponse
from app.auth.service import (
    create_access_token,
    create_refresh_token,
    exchange_google_code,
    get_google_auth_url,
    get_google_user_info,
    get_or_create_user,
    verify_token,
)
from app.common.database import get_async_session
from app.common.exceptions import AuthenticationError, UserNotFoundError

router = APIRouter()


@router.post("/google", response_model=dict)
async def initiate_google_auth() -> dict[str, str]:
    """Inicia el flujo de autenticacion con Google OAuth."""
    url = get_google_auth_url()
    return {"redirect_url": url}


@router.get("/callback")
async def google_callback(
    code: str = Query(...),
    state: str | None = Query(default=None),
    response: Response = Response(),
    db: AsyncSession = Depends(get_async_session),
) -> AuthTokenResponse:
    """
    Callback de Google OAuth.
    Intercambia el code por tokens y crea/actualiza el usuario.
    """
    # Intercambiar code por tokens de Google
    google_tokens = await exchange_google_code(code)
    google_access_token = google_tokens.get("access_token")

    if not google_access_token:
        raise AuthenticationError("No se obtuvo token de Google")

    # Obtener datos del usuario de Google
    user_info = await get_google_user_info(google_access_token)

    # Crear o actualizar usuario en BD
    user = await get_or_create_user(
        db=db,
        google_id=user_info["id"],
        email=user_info["email"],
        name=user_info.get("name", ""),
        avatar_url=user_info.get("picture"),
    )

    # Generar JWT
    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    # Setear refresh token en httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 dias
        path="/api/v1/auth",
    )

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_async_session),
    refresh_token: str | None = Body(None, embed=True, alias="refresh_token"),
) -> TokenRefreshResponse:
    """
    Renueva el access token usando el refresh token.

    Acepta el refresh token de dos formas (prioridad):
    1. Cookie httpOnly "refresh_token" (mas seguro)
    2. Body JSON {"refresh_token": "..."} (para SPA/testing)
    """
    # Intentar cookie primero, luego body
    token = request.cookies.get("refresh_token") or refresh_token

    if not token:
        raise AuthenticationError("Refresh token no proporcionado")

    # Verificar y decodificar el refresh token
    payload = verify_token(token, expected_type="refresh")
    user_id = payload.get("sub")

    if not user_id:
        raise AuthenticationError("Refresh token invalido: sin subject")

    # Buscar usuario en BD para obtener rol actual y verificar que siga activo
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFoundError("Usuario no encontrado o inactivo")

    # Generar nuevo access token con rol actual
    new_access_token = create_access_token(user.id, user.role.value)

    # Rotar refresh token (buena practica de seguridad)
    new_refresh_token = create_refresh_token(user.id)

    # Actualizar cookie httpOnly
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 dias
        path="/api/v1/auth",
    )

    return TokenRefreshResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


@router.get("/me", response_model=AuthMeResponse)
async def get_current_user_info(
    user: User = Depends(get_current_user),
) -> AuthMeResponse:
    """Retorna la informacion del usuario autenticado."""
    # Construir permisos basados en el rol
    permissions = _get_permissions_for_role(user.role.value)

    institution = None
    if user.institution:
        institution = {
            "id": str(user.institution.id),
            "name": user.institution.name,
        }

    return AuthMeResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        role=user.role,
        institution=institution,
        permissions=permissions,
        consent_status=None,  # Se implementara en consent module
    )


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    """Cierra la sesion eliminando el refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
    )
    return {"status": "ok", "message": "Sesion cerrada"}


def _get_permissions_for_role(role: str) -> list[str]:
    """Retorna la lista de permisos segun el rol."""
    permissions_map = {
        "estudiante": [
            "test:take",
            "test:view_own",
            "session:schedule",
            "session:view_own",
            "career:view",
            "profile:view_own",
            "game:play",
        ],
        "apoderado": [
            "test:view_children",
            "session:view_children",
            "profile:view_children",
            "consent:manage",
        ],
        "orientador": [
            "test:view_assigned",
            "session:manage",
            "session:view_analysis",
            "profile:view_assigned",
            "student:manage_assigned",
            "report:generate",
        ],
        "admin_colegio": [
            "test:view_all",
            "session:view_all",
            "profile:view_all",
            "student:manage_all",
            "orientador:manage",
            "institution:manage",
            "report:view_all",
        ],
        "super_admin": [
            "all",
        ],
    }
    return permissions_map.get(role, [])
