"""
Vocari Backend - Auth Router.

Endpoints de autenticacion: Google OAuth, JWT refresh, perfil.
"""

import os

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
    db: AsyncSession = Depends(get_async_session),
) -> RedirectResponse:
    """
    Callback de Google OAuth.
    Intercambia el code por tokens y redirige al frontend con los tokens.
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

    # Generar JWT con datos completos del usuario
    access_token = create_access_token(
        user_id=user.id,
        role=user.role.value,
        email=user.email,
        name=user.name,
        institution_id=user.institution_id,
    )
    refresh_token = create_refresh_token(user.id)

    # Redirigir al frontend con los tokens en la URL
    frontend_url = os.getenv("FRONTEND_URL", "https://app.vocari.cl")
    callback_url = f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"

    # Setear refresh token en httpOnly cookie sobre el RedirectResponse
    redirect = RedirectResponse(url=callback_url)
    redirect.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 dias
        path="/",
    )
    return redirect


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


@router.post("/dev/setup", include_in_schema=True)
async def setup_test_users(
    secret: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Crea usuarios de prueba y devuelve URLs de acceso directo al frontend.
    SOLO para testing — requiere DEV_TOKEN_SECRET.
    """
    import uuid as _uuid
    from app.auth.models import UserRole as _UserRole
    from app.institutions.models import Institution as _Institution, InstitutionPlan as _InstitutionPlan
    from sqlalchemy import select as _select

    dev_secret = os.getenv("DEV_TOKEN_SECRET", "")
    if not dev_secret or secret != dev_secret:
        raise AuthenticationError("Secret invalido o endpoint deshabilitado")

    frontend_url = os.getenv("FRONTEND_URL", "https://app.vocari.cl")

    # Buscar o crear institucion de prueba — usando SQL raw para evitar schema drift
    institution_id = None
    try:
        from sqlalchemy import text as _text
        # Buscar existente
        row = (await db.execute(
            _text("SELECT id FROM institutions WHERE name = 'Colegio Demo Vocari' LIMIT 1")
        )).fetchone()
        if row:
            institution_id = row[0]
        else:
            new_id = _uuid.uuid4()
            await db.execute(_text("""
                INSERT INTO institutions (id, name, slug, max_students, is_active)
                VALUES (:id, 'Colegio Demo Vocari', 'colegio-demo-vocari', 200, true)
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            """), {"id": str(new_id)})
            institution_id = new_id
        await db.flush()
    except Exception as inst_err:
        institution_id = None
        import structlog as _sl
        _sl.get_logger().warning("dev/setup: no se pudo crear institución", error=str(inst_err)[:200])

    # Definicion de usuarios de prueba
    test_users_def = [
        {"email": "test.estudiante@vocari.cl", "name": "Ana García (Estudiante)", "role": _UserRole.ESTUDIANTE, "institution_id": institution_id, "google_id": "test-google-estudiante-001"},
        {"email": "test.apoderado@vocari.cl", "name": "Carlos García (Apoderado)", "role": _UserRole.APODERADO, "institution_id": institution_id, "google_id": "test-google-apoderado-001"},
        {"email": "test.orientador@vocari.cl", "name": "María López (Orientadora)", "role": _UserRole.ORIENTADOR, "institution_id": institution_id, "google_id": "test-google-orientador-001"},
        {"email": "test.admin.colegio@vocari.cl", "name": "Pedro Rojas (Admin Colegio)", "role": _UserRole.ADMIN_COLEGIO, "institution_id": institution_id, "google_id": "test-google-admincolegio-001"},
        {"email": "test.superadmin@vocari.cl", "name": "Super Admin Test", "role": _UserRole.SUPER_ADMIN, "institution_id": None, "google_id": "test-google-superadmin-001"},
    ]

    users_result = []
    for u in test_users_def:
        result = await db.execute(select(User).where(User.email == u["email"]))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                id=_uuid.uuid4(),
                email=u["email"],
                google_id=u["google_id"],
                name=u["name"],
                role=u["role"],
                institution_id=u["institution_id"],
                is_active=True,
            )
            db.add(user)
            await db.flush()
        else:
            user.name = u["name"]
            user.role = u["role"]
            user.institution_id = u["institution_id"]
            user.is_active = True

        at = create_access_token(
            user_id=user.id, role=user.role.value,
            email=user.email, name=user.name,
            institution_id=user.institution_id,
        )
        rt = create_refresh_token(user.id)

        users_result.append({
            "role": user.role.value,
            "email": user.email,
            "name": user.name,
            "access_token": at,
            "refresh_token": rt,
            "login_url": f"{frontend_url}/auth/callback?access_token={at}&refresh_token={rt}",
        })

    await db.commit()
    return {"status": "ok", "users": users_result}


@router.post("/dev-token", include_in_schema=True)
async def get_dev_token(
    email: str = Body(..., embed=True),
    secret: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Genera un JWT para un usuario existente sin pasar por Google OAuth.

    SOLO para testing — requiere DEV_TOKEN_SECRET en el entorno.
    Retorna 403 si el secret no coincide o si el usuario no existe.
    """
    dev_secret = os.getenv("DEV_TOKEN_SECRET", "")
    if not dev_secret or secret != dev_secret:
        raise AuthenticationError("Secret invalido o endpoint deshabilitado")

    result = await db.execute(
        select(User).where(User.email == email, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFoundError(f"Usuario no encontrado: {email}")

    access_token = create_access_token(
        user_id=user.id,
        role=user.role.value,
        email=user.email,
        name=user.name,
        institution_id=user.institution_id,
    )
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "institution_id": str(user.institution_id) if user.institution_id else None,
        },
    }


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
