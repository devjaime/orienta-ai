"""
Vocari Backend - Jerarquia de Excepciones.

Todas las excepciones de negocio heredan de VocariException.
El handler global en main.py las convierte en respuestas HTTP apropiadas.
"""

from typing import Any


class VocariException(Exception):
    """Excepcion base de la aplicacion."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "Error interno del servidor"

    def __init__(
        self,
        message: str | None = None,
        details: dict[str, Any] | None = None,
    ):
        self.message = message or self.__class__.message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "error": {
                "code": self.error_code,
                "message": self.message,
            }
        }
        if self.details:
            result["error"]["details"] = self.details
        return result


# --- Autenticacion (401) ---


class AuthenticationError(VocariException):
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"
    message = "No autenticado"


class TokenExpiredError(AuthenticationError):
    error_code = "TOKEN_EXPIRED"
    message = "El token ha expirado"


class InvalidCredentialsError(AuthenticationError):
    error_code = "INVALID_CREDENTIALS"
    message = "Credenciales invalidas"


# --- Autorizacion (403) ---


class AuthorizationError(VocariException):
    status_code = 403
    error_code = "AUTHORIZATION_ERROR"
    message = "No autorizado"


class InsufficientRoleError(AuthorizationError):
    error_code = "INSUFFICIENT_ROLE"
    message = "Rol insuficiente para esta operacion"


class CrossTenantAccessError(AuthorizationError):
    error_code = "CROSS_TENANT_ACCESS"
    message = "Acceso denegado: recurso pertenece a otra institucion"


# --- No Encontrado (404) ---


class NotFoundError(VocariException):
    status_code = 404
    error_code = "NOT_FOUND"
    message = "Recurso no encontrado"


class UserNotFoundError(NotFoundError):
    error_code = "USER_NOT_FOUND"
    message = "Usuario no encontrado"


class SessionNotFoundError(NotFoundError):
    error_code = "SESSION_NOT_FOUND"
    message = "Sesion no encontrada"


class InstitutionNotFoundError(NotFoundError):
    error_code = "INSTITUTION_NOT_FOUND"
    message = "Institucion no encontrada"


class CareerNotFoundError(NotFoundError):
    error_code = "CAREER_NOT_FOUND"
    message = "Carrera no encontrada"


# --- Conflicto (409) ---


class ConflictError(VocariException):
    status_code = 409
    error_code = "CONFLICT"
    message = "Conflicto con el estado actual del recurso"


class DuplicateSessionError(ConflictError):
    error_code = "DUPLICATE_SESSION"
    message = "Ya existe una sesion en ese horario"


class AlreadyCompletedError(ConflictError):
    error_code = "ALREADY_COMPLETED"
    message = "Este recurso ya fue completado"


# --- Validacion (422) ---


class ValidationError(VocariException):
    status_code = 422
    error_code = "VALIDATION_ERROR"
    message = "Error de validacion"


class ConsentRequiredError(ValidationError):
    error_code = "CONSENT_REQUIRED"
    message = "Se requiere consentimiento para esta operacion"


class InvalidScheduleError(ValidationError):
    error_code = "INVALID_SCHEDULE"
    message = "Horario invalido"


# --- Servicio Externo (502) ---


class ExternalServiceError(VocariException):
    status_code = 502
    error_code = "EXTERNAL_SERVICE_ERROR"
    message = "Error en servicio externo"


class GoogleAPIError(ExternalServiceError):
    error_code = "GOOGLE_API_ERROR"
    message = "Error al comunicarse con Google API"


class OpenRouterError(ExternalServiceError):
    error_code = "OPENROUTER_ERROR"
    message = "Error al comunicarse con OpenRouter"


# --- Rate Limiting (429) ---


class RateLimitError(VocariException):
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
    message = "Demasiadas solicitudes, intente mas tarde"
