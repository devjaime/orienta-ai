"""
Vocari Backend - OpenRouter Client (T3.1).

Client HTTP para OpenRouter API con retry, fallback chain, rate limiting,
y logging de costos.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any

import httpx
import structlog

from app.common.exceptions import OpenRouterError
from app.config import get_settings

logger = structlog.get_logger()

# Semaforo global para limitar concurrencia
_semaphore: asyncio.Semaphore | None = None


def _get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        settings = get_settings()
        _semaphore = asyncio.Semaphore(settings.openrouter_max_concurrent)
    return _semaphore


@dataclass
class LLMResponse:
    """Respuesta estructurada de una llamada LLM."""

    content: str
    model_used: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    fallback_used: bool = False
    cache_hit: bool = False


@dataclass
class OpenRouterClient:
    """
    Cliente para OpenRouter API con:
    - Fallback chain entre modelos
    - Retry con backoff exponencial
    - Rate limiting via semaforo
    - Logging de costos y latencia
    """

    api_key: str = ""
    base_url: str = "https://openrouter.ai/api/v1"
    default_model: str = "anthropic/claude-3.5-sonnet"
    fallback_models: list[str] = field(default_factory=list)
    timeout_seconds: int = 30
    max_retries: int = 3

    def __post_init__(self) -> None:
        if not self.api_key:
            settings = get_settings()
            self.api_key = settings.openrouter_api_key
            self.base_url = settings.openrouter_base_url
            self.default_model = settings.openrouter_default_model
            self.fallback_models = list(settings.openrouter_fallback_models)
            self.timeout_seconds = settings.openrouter_timeout_seconds
            self.max_retries = settings.openrouter_max_retries

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://vocari.cl",
            "X-Title": "Vocari",
            "Content-Type": "application/json",
        }

    async def chat(
        self,
        *,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        response_format: dict[str, str] | None = None,
    ) -> LLMResponse:
        """
        Enviar request a OpenRouter con fallback chain automatico.

        Args:
            messages: Lista de mensajes [{role, content}]
            model: Modelo a usar (default: default_model)
            temperature: Temperatura (default: 0.3 para respuestas consistentes)
            max_tokens: Maximo de tokens de respuesta
            response_format: {"type": "json_object"} para forzar JSON
        """
        target_model = model or self.default_model
        models_to_try = [target_model] + [m for m in self.fallback_models if m != target_model]

        last_error: Exception | None = None

        for i, current_model in enumerate(models_to_try):
            is_fallback = i > 0
            try:
                result = await self._call_model(
                    model=current_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format=response_format,
                )
                result.fallback_used = is_fallback
                if is_fallback:
                    logger.warning(
                        "Usando modelo fallback",
                        original_model=target_model,
                        fallback_model=current_model,
                    )
                return result
            except (httpx.TimeoutException, httpx.HTTPStatusError) as exc:
                last_error = exc
                logger.warning(
                    "Modelo fallo, intentando fallback",
                    model=current_model,
                    error=str(exc),
                    next_fallback=models_to_try[i + 1] if i + 1 < len(models_to_try) else None,
                )
                continue

        raise OpenRouterError(
            f"Todos los modelos fallaron. Ultimo error: {last_error}"
        )

    async def _call_model(
        self,
        *,
        model: str,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
        response_format: dict[str, str] | None = None,
    ) -> LLMResponse:
        """Llama a un modelo especifico con retry y rate limiting."""
        semaphore = _get_semaphore()

        body: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            body["response_format"] = response_format

        for attempt in range(self.max_retries):
            async with semaphore:
                start_time = time.monotonic()
                try:
                    async with httpx.AsyncClient(
                        timeout=httpx.Timeout(self.timeout_seconds)
                    ) as client:
                        response = await client.post(
                            f"{self.base_url}/chat/completions",
                            headers=self._headers,
                            json=body,
                        )

                    latency_ms = (time.monotonic() - start_time) * 1000

                    # Manejar rate limit
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 2 ** (attempt + 1)))
                        logger.warning(
                            "Rate limited por OpenRouter",
                            model=model,
                            retry_after=retry_after,
                            attempt=attempt + 1,
                        )
                        await asyncio.sleep(retry_after)
                        continue

                    response.raise_for_status()
                    data = response.json()

                    # Extraer respuesta
                    choices = data.get("choices", [])
                    if not choices:
                        raise OpenRouterError("Respuesta vacia de OpenRouter")

                    content = choices[0].get("message", {}).get("content", "")
                    usage = data.get("usage", {})

                    result = LLMResponse(
                        content=content,
                        model_used=model,
                        input_tokens=usage.get("prompt_tokens", 0),
                        output_tokens=usage.get("completion_tokens", 0),
                        total_tokens=usage.get("total_tokens", 0),
                        latency_ms=latency_ms,
                        cost_usd=self._estimate_cost(
                            model, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)
                        ),
                    )

                    logger.info(
                        "Llamada LLM exitosa",
                        model=model,
                        input_tokens=result.input_tokens,
                        output_tokens=result.output_tokens,
                        latency_ms=round(result.latency_ms, 1),
                        cost_usd=round(result.cost_usd, 5),
                    )

                    return result

                except httpx.TimeoutException:
                    latency_ms = (time.monotonic() - start_time) * 1000
                    if attempt < self.max_retries - 1:
                        backoff = 2 ** (attempt + 1)
                        logger.warning(
                            "Timeout en llamada LLM, reintentando",
                            model=model,
                            attempt=attempt + 1,
                            backoff_seconds=backoff,
                        )
                        await asyncio.sleep(backoff)
                    else:
                        raise

                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code >= 500 and attempt < self.max_retries - 1:
                        backoff = 2 ** (attempt + 1)
                        logger.warning(
                            "Error de servidor OpenRouter, reintentando",
                            model=model,
                            status=exc.response.status_code,
                            attempt=attempt + 1,
                            backoff_seconds=backoff,
                        )
                        await asyncio.sleep(backoff)
                    else:
                        raise

        raise OpenRouterError(f"Agotados reintentos para modelo {model}")

    @staticmethod
    def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
        """Estima costo USD basado en modelo y tokens."""
        # Precios aproximados por 1M tokens (marzo 2026)
        pricing: dict[str, tuple[float, float]] = {
            "anthropic/claude-3.5-sonnet": (3.0, 15.0),
            "anthropic/claude-3.5-haiku": (0.25, 1.25),
            "google/gemini-2.0-flash-001": (0.075, 0.30),
            "meta-llama/llama-3.3-70b-instruct": (0.59, 0.79),
        }

        input_price, output_price = pricing.get(model, (1.0, 5.0))
        cost = (input_tokens * input_price + output_tokens * output_price) / 1_000_000
        return cost


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_client: OpenRouterClient | None = None


def get_openrouter_client() -> OpenRouterClient:
    """Retorna singleton del cliente OpenRouter."""
    global _client
    if _client is None:
        _client = OpenRouterClient()
    return _client
