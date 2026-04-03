"""
Vocari Backend - Schemas de Auth (Pydantic).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.auth.models import UserRole


# --- Request Schemas ---


class GoogleAuthRequest(BaseModel):
    """Sin body, solo inicia el flujo OAuth."""

    pass


class MVPCredentialsLoginRequest(BaseModel):
    """Login controlado para perfiles internos del MVP."""

    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=255)
    role: UserRole

    @model_validator(mode="after")
    def validate_role(self) -> "MVPCredentialsLoginRequest":
        if self.role not in {UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO}:
            raise ValueError("El login MVP solo permite orientador o admin_colegio")
        return self


# --- Response Schemas ---


class UserResponse(BaseModel):
    """Datos publicos de un usuario."""

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None = None
    role: UserRole
    institution_id: uuid.UUID | None = None
    is_active: bool
    last_login: datetime | None = None

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """Perfil extendido del usuario."""

    birth_date: str | None = None
    grade: str | None = None
    phone: str | None = None
    additional_info: dict | None = None

    model_config = {"from_attributes": True}


class AuthTokenResponse(BaseModel):
    """Respuesta de autenticacion exitosa."""

    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: UserResponse


class AuthMeResponse(BaseModel):
    """Respuesta de /auth/me."""

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None = None
    role: UserRole
    institution: dict | None = None
    permissions: list[str] = Field(default_factory=list)
    consent_status: dict | None = None

    model_config = {"from_attributes": True}


class TokenRefreshResponse(BaseModel):
    """Respuesta de refresh token."""

    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
