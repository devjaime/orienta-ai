"""
Vocari Backend - Validacion de Output LLM (T3.6).

Valida respuestas JSON de LLMs contra Pydantic schemas.
Re-intenta con feedback de error si falla (max 2 reintentos).
"""

from __future__ import annotations

import json
from typing import Any, TypeVar

import structlog
from pydantic import BaseModel, ValidationError

from app.ai_engine.openrouter_client import LLMResponse, OpenRouterClient
from app.common.exceptions import OpenRouterError

logger = structlog.get_logger()

T = TypeVar("T", bound=BaseModel)

# Max reintentos de validacion
MAX_VALIDATION_RETRIES = 2


def parse_json_response(content: str) -> Any:
    """
    Parsea JSON de una respuesta LLM.

    Maneja casos comunes:
    - JSON envuelto en bloques de codigo (```json ... ```)
    - JSON con texto previo/posterior
    """
    cleaned = content.strip()

    # Remover bloques de codigo markdown
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Encontrar inicio y fin del bloque
        start = 1  # Despues de ```json
        end = len(lines) - 1
        for i in range(1, len(lines)):
            if lines[i].strip() == "```":
                end = i
                break
        cleaned = "\n".join(lines[start:end]).strip()

    # Intentar encontrar JSON valido
    # Caso 1: El texto completo es JSON
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Caso 2: JSON empieza con [ o {
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start_idx = cleaned.find(start_char)
        if start_idx >= 0:
            end_idx = cleaned.rfind(end_char)
            if end_idx > start_idx:
                try:
                    return json.loads(cleaned[start_idx : end_idx + 1])
                except json.JSONDecodeError:
                    continue

    raise ValueError(f"No se pudo parsear JSON de la respuesta: {content[:200]}")


def validate_json_output(
    content: str,
    schema: type[T],
) -> T:
    """
    Valida JSON contra un Pydantic schema.

    Raises:
        ValueError: Si no se puede parsear el JSON
        ValidationError: Si no pasa la validacion del schema
    """
    data = parse_json_response(content)
    return schema.model_validate(data)


def validate_json_list(
    content: str,
    item_schema: type[T],
) -> list[T]:
    """Valida una lista JSON contra un schema de item."""
    data = parse_json_response(content)
    if not isinstance(data, list):
        raise ValueError(f"Se esperaba una lista JSON, se recibio: {type(data).__name__}")

    return [item_schema.model_validate(item) for item in data]


async def call_and_validate(
    client: OpenRouterClient,
    *,
    messages: list[dict[str, str]],
    schema: type[T],
    model: str | None = None,
    is_list: bool = False,
    temperature: float = 0.3,
) -> tuple[T | list[T], LLMResponse]:
    """
    Llama a OpenRouter y valida el resultado contra un Pydantic schema.

    Si la validacion falla, re-intenta incluyendo el error en el prompt.
    Max 2 reintentos.

    Returns:
        tuple: (validated_data, llm_response)
    """
    current_messages = list(messages)
    last_response: LLMResponse | None = None
    last_error: str = ""

    for attempt in range(1 + MAX_VALIDATION_RETRIES):
        # Si es un reintento, agregar feedback del error
        if attempt > 0 and last_error:
            current_messages = list(messages) + [
                {
                    "role": "assistant",
                    "content": last_response.content if last_response else "",
                },
                {
                    "role": "user",
                    "content": (
                        f"Tu respuesta anterior no fue JSON valido. Error: {last_error}\n\n"
                        "Por favor, responde SOLO con JSON valido sin texto adicional."
                    ),
                },
            ]
            logger.warning(
                "Reintentando validacion de output LLM",
                attempt=attempt + 1,
                error=last_error,
            )

        # Llamar a OpenRouter
        response = await client.chat(
            messages=current_messages,
            model=model,
            temperature=temperature,
            response_format={"type": "json_object"} if not is_list else None,
        )
        last_response = response

        try:
            if is_list:
                validated = validate_json_list(response.content, schema)
            else:
                validated = validate_json_output(response.content, schema)

            return validated, response

        except (ValueError, ValidationError) as exc:
            last_error = str(exc)[:500]  # Truncar error para el prompt
            logger.warning(
                "Validacion de output LLM fallo",
                attempt=attempt + 1,
                error=last_error[:200],
            )

    # Si todos los reintentos fallan
    raise OpenRouterError(
        f"No se pudo obtener output valido despues de {1 + MAX_VALIDATION_RETRIES} intentos. "
        f"Ultimo error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Validaciones de contenido (Section 8.1)
# ---------------------------------------------------------------------------


def validate_confidence_range(items: list[dict[str, Any]], field: str = "confidence") -> None:
    """Valida que confidence scores esten en rango [0, 1]."""
    for item in items:
        conf = item.get(field, 0)
        if not 0 <= conf <= 1:
            raise ValueError(f"Confidence fuera de rango: {conf}")


def validate_sentiment_score(score: float) -> None:
    """Valida que sentiment score este en rango [-1, 1]."""
    if not -1 <= score <= 1:
        raise ValueError(f"Sentiment score fuera de rango: {score}")


def validate_max_items(items: list[Any], max_items: int = 20) -> None:
    """Valida que no haya demasiados items."""
    if len(items) > max_items:
        raise ValueError(f"Demasiados items: {len(items)} (max: {max_items})")
