"""
Vocari Backend - Handlers globales de excepciones para FastAPI.

Convierte excepciones de negocio y del framework en respuestas JSON uniformes.
"""

import uuid
from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.common.exceptions import VocariException
from app.config import get_settings

logger = structlog.get_logger()


def _get_request_id(request: Request) -> str:
    """Extrae o genera un request_id."""
    return getattr(request.state, "request_id", str(uuid.uuid4()))


async def vocari_exception_handler(request: Request, exc: VocariException) -> JSONResponse:
    """Handler para excepciones de negocio de Vocari."""
    request_id = _get_request_id(request)

    logger.warning(
        "Excepcion de negocio",
        error_code=exc.error_code,
        message=exc.message,
        request_id=request_id,
        path=request.url.path,
    )

    body = exc.to_dict()
    body["request_id"] = request_id

    return JSONResponse(
        status_code=exc.status_code,
        content=body,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handler para errores de validacion de Pydantic/FastAPI."""
    request_id = _get_request_id(request)

    errors: list[dict[str, Any]] = []
    for error in exc.errors():
        errors.append(
            {
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            }
        )

    logger.warning(
        "Error de validacion",
        errors=errors,
        request_id=request_id,
        path=request.url.path,
    )

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Error de validacion en la solicitud",
                "details": errors,
            },
            "request_id": request_id,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler para HTTPException estandar de Starlette/FastAPI."""
    request_id = _get_request_id(request)

    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=request_id,
        path=request.url.path,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
            },
            "request_id": request_id,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler para excepciones no controladas."""
    request_id = _get_request_id(request)
    settings = get_settings()

    # Loguear el error completo
    logger.error(
        "Error interno no controlado",
        error_type=type(exc).__name__,
        error=str(exc),
        request_id=request_id,
        path=request.url.path,
        exc_info=True,
    )

    # Siempre mostrar el error real en el mensaje para debugging
    message = f"{type(exc).__name__}: {exc}"

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": message,
            },
            "request_id": request_id,
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    """Registra todos los handlers de excepciones en la aplicacion FastAPI."""
    app.add_exception_handler(VocariException, vocari_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, generic_exception_handler)  # type: ignore[arg-type]
