"""
Vocari Backend - Pipeline de Analisis de Transcripcion (T3.3).

Pipeline principal: se ejecuta como job asincrono (rq) despues de cada sesion.

Flujo (specs/ai-engine.md seccion 4.1):
  Step 1: Pre-procesamiento (limpiar texto, PII scrubbing)
  Steps 2-4: Sonnet en paralelo (resumen, intereses, habilidades)
  Steps 5-6: Haiku en paralelo (sentimiento, sugerencias)
  Step 7: Post-procesamiento (validar, almacenar en session_ai_analyses)

Total llamadas LLM: 5 (3 Sonnet + 2 Haiku)
Costo estimado: $0.05-$0.10 por sesion
Tiempo estimado: 15-45 segundos (paralelo donde posible)
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import structlog

from app.ai_engine.openrouter_client import LLMResponse, OpenRouterClient, get_openrouter_client
from app.ai_engine.pii_scrubber import build_speaker_map, scrub_pii
from app.ai_engine.prompts import (
    INTEREST_DETECTION,
    MODEL_TIER_MAP,
    SENTIMENT_ANALYSIS,
    SESSION_SUMMARY,
    SKILLS_DETECTION,
    TEST_GAME_SUGGESTIONS,
    get_model_for_template,
)
from app.ai_engine.validation import call_and_validate, parse_json_response
from app.sessions.schemas import (
    EmotionalSentiment,
    InterestDetected,
    SkillDetected,
    SuggestedGame,
    SuggestedTest,
)

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Pipeline Result
# ---------------------------------------------------------------------------


@dataclass
class PipelineResult:
    """Resultado completo del pipeline de analisis."""

    summary: str = ""
    interests: list[dict[str, Any]] = field(default_factory=list)
    skills: list[dict[str, Any]] = field(default_factory=list)
    sentiment: dict[str, Any] = field(default_factory=dict)
    suggested_tests: list[dict[str, Any]] = field(default_factory=list)
    suggested_games: list[dict[str, Any]] = field(default_factory=list)

    # Metadata
    models_used: list[str] = field(default_factory=list)
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    processing_time_seconds: float = 0.0
    llm_responses: list[LLMResponse] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def success(self) -> bool:
        """True si al menos el resumen se genero."""
        return bool(self.summary)

    @property
    def primary_model(self) -> str:
        """Modelo principal usado (el mas frecuente)."""
        if not self.models_used:
            return "unknown"
        from collections import Counter
        return Counter(self.models_used).most_common(1)[0][0]

    def _accumulate_response(self, response: LLMResponse) -> None:
        """Acumula metricas de una respuesta LLM."""
        self.models_used.append(response.model_used)
        self.total_tokens += response.total_tokens
        self.total_cost_usd += response.cost_usd
        self.llm_responses.append(response)


# ---------------------------------------------------------------------------
# Pydantic models internos para validacion de respuestas LLM
# ---------------------------------------------------------------------------

# Nota: Reutilizamos los schemas de sessions/schemas.py
# (InterestDetected, SkillDetected, EmotionalSentiment, SuggestedTest, SuggestedGame)

# Schema para el resultado de sugerencias (es un objeto con dos listas)
from pydantic import BaseModel


class SuggestionsOutput(BaseModel):
    """Schema para validar output del LLM de sugerencias."""

    suggested_tests: list[SuggestedTest] = []
    suggested_games: list[SuggestedGame] = []


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------


class TranscriptAnalysisPipeline:
    """
    Pipeline que analiza una transcripcion de sesion y genera:
    - Resumen estructurado
    - Intereses detectados
    - Habilidades detectadas
    - Analisis de sentimiento
    - Sugerencias de tests/juegos
    """

    def __init__(
        self,
        client: OpenRouterClient | None = None,
    ) -> None:
        self.client = client or get_openrouter_client()

    async def run(
        self,
        *,
        transcript_text: str,
        session_date: str = "",
        duration_minutes: int = 30,
        student_grade: str = "",
        student_name: str | None = None,
        orientador_name: str | None = None,
        previous_interests: str = "Ninguno",
        riasec_code: str = "No disponible",
        previous_skills: str = "Ninguno",
        game_results: str = "Ninguno",
        available_tests: str = "Test RIASEC Holland (36 preguntas)",
        available_games: str = "No hay juegos disponibles aun",
        profile_gaps: str = "Perfil inicial, todas las areas son relevantes",
    ) -> PipelineResult:
        """
        Ejecuta el pipeline completo de analisis de transcripcion.

        Returns:
            PipelineResult con todos los analisis y metricas
        """
        start_time = time.monotonic()
        result = PipelineResult()

        logger.info(
            "Iniciando pipeline de analisis",
            transcript_length=len(transcript_text),
            duration=duration_minutes,
        )

        # ---------------------------------------------------------------
        # Step 1: Pre-procesamiento — PII scrubbing
        # ---------------------------------------------------------------
        speaker_map = build_speaker_map(
            student_name=student_name,
            orientador_name=orientador_name,
        )
        clean_transcript = scrub_pii(transcript_text, speaker_map)

        logger.info(
            "Pre-procesamiento completado",
            original_length=len(transcript_text),
            cleaned_length=len(clean_transcript),
            speakers_mapped=len(speaker_map),
        )

        # ---------------------------------------------------------------
        # Steps 2-4: Sonnet en paralelo (resumen, intereses, habilidades)
        # ---------------------------------------------------------------
        sonnet_model = get_model_for_template(SESSION_SUMMARY)

        summary_task = self._run_summary(
            clean_transcript,
            session_date=session_date,
            duration_minutes=duration_minutes,
            student_grade=student_grade,
            model=sonnet_model,
        )
        interests_task = self._run_interest_detection(
            clean_transcript,
            previous_interests=previous_interests,
            riasec_code=riasec_code,
            model=sonnet_model,
        )
        skills_task = self._run_skills_detection(
            clean_transcript,
            game_results=game_results,
            previous_skills=previous_skills,
            model=sonnet_model,
        )

        sonnet_results = await asyncio.gather(
            summary_task, interests_task, skills_task,
            return_exceptions=True,
        )

        # Procesar resultados de Sonnet
        # Summary
        if isinstance(sonnet_results[0], Exception):
            error_msg = f"Error en resumen: {sonnet_results[0]}"
            result.errors.append(error_msg)
            logger.error(error_msg)
        else:
            summary_text, summary_response = sonnet_results[0]
            result.summary = summary_text
            result._accumulate_response(summary_response)

        # Interests
        if isinstance(sonnet_results[1], Exception):
            error_msg = f"Error en intereses: {sonnet_results[1]}"
            result.errors.append(error_msg)
            logger.error(error_msg)
        else:
            interests_list, interests_response = sonnet_results[1]
            result.interests = interests_list
            result._accumulate_response(interests_response)

        # Skills
        if isinstance(sonnet_results[2], Exception):
            error_msg = f"Error en habilidades: {sonnet_results[2]}"
            result.errors.append(error_msg)
            logger.error(error_msg)
        else:
            skills_list, skills_response = sonnet_results[2]
            result.skills = skills_list
            result._accumulate_response(skills_response)

        # ---------------------------------------------------------------
        # Steps 5-6: Haiku en paralelo (sentimiento, sugerencias)
        # ---------------------------------------------------------------
        haiku_model = get_model_for_template(SENTIMENT_ANALYSIS)

        # Preparar inputs para sugerencias (necesita resultados de steps previos)
        interests_text = json.dumps(result.interests, ensure_ascii=False) if result.interests else "No detectados"
        skills_text = json.dumps(result.skills, ensure_ascii=False) if result.skills else "No detectados"
        summary_for_suggestions = result.summary or "Resumen no disponible"

        sentiment_task = self._run_sentiment_analysis(
            clean_transcript,
            model=haiku_model,
        )
        suggestions_task = self._run_test_suggestions(
            session_summary=summary_for_suggestions,
            interests_detected=interests_text,
            skills_detected=skills_text,
            available_tests=available_tests,
            available_games=available_games,
            profile_gaps=profile_gaps,
            model=haiku_model,
        )

        haiku_results = await asyncio.gather(
            sentiment_task, suggestions_task,
            return_exceptions=True,
        )

        # Procesar resultados de Haiku
        # Sentiment
        if isinstance(haiku_results[0], Exception):
            error_msg = f"Error en sentimiento: {haiku_results[0]}"
            result.errors.append(error_msg)
            logger.error(error_msg)
        else:
            sentiment_dict, sentiment_response = haiku_results[0]
            result.sentiment = sentiment_dict
            result._accumulate_response(sentiment_response)

        # Suggestions
        if isinstance(haiku_results[1], Exception):
            error_msg = f"Error en sugerencias: {haiku_results[1]}"
            result.errors.append(error_msg)
            logger.error(error_msg)
        else:
            suggestions_data, suggestions_response = haiku_results[1]
            result.suggested_tests = suggestions_data.get("suggested_tests", [])
            result.suggested_games = suggestions_data.get("suggested_games", [])
            result._accumulate_response(suggestions_response)

        # ---------------------------------------------------------------
        # Step 7: Post-procesamiento
        # ---------------------------------------------------------------
        result.processing_time_seconds = time.monotonic() - start_time

        logger.info(
            "Pipeline completado",
            success=result.success,
            total_tokens=result.total_tokens,
            total_cost_usd=round(result.total_cost_usd, 5),
            processing_time=round(result.processing_time_seconds, 2),
            errors=len(result.errors),
            interests_count=len(result.interests),
            skills_count=len(result.skills),
        )

        return result

    # -------------------------------------------------------------------
    # Step 2: Resumen de sesion
    # -------------------------------------------------------------------

    async def _run_summary(
        self,
        transcript_text: str,
        *,
        session_date: str,
        duration_minutes: int,
        student_grade: str,
        model: str,
    ) -> tuple[str, LLMResponse]:
        """Genera resumen estructurado de la sesion."""
        messages = SESSION_SUMMARY.render(
            session_date=session_date or "No especificada",
            duration=str(duration_minutes),
            student_grade=student_grade or "No especificado",
            transcript_text=transcript_text,
        )

        response = await self.client.chat(
            messages=messages,
            model=model,
            temperature=0.3,
            max_tokens=2048,
        )

        logger.info(
            "Resumen generado",
            tokens=response.total_tokens,
            model=response.model_used,
        )

        return response.content, response

    # -------------------------------------------------------------------
    # Step 3: Deteccion de intereses
    # -------------------------------------------------------------------

    async def _run_interest_detection(
        self,
        transcript_text: str,
        *,
        previous_interests: str,
        riasec_code: str,
        model: str,
    ) -> tuple[list[dict[str, Any]], LLMResponse]:
        """Detecta intereses vocacionales en la transcripcion."""
        messages = INTEREST_DETECTION.render(
            transcript_text=transcript_text,
            previous_interests=previous_interests,
            riasec_code=riasec_code,
        )

        validated, response = await call_and_validate(
            self.client,
            messages=messages,
            schema=InterestDetected,
            model=model,
            is_list=True,
            temperature=0.3,
        )

        interests = [item.model_dump() for item in validated]

        logger.info(
            "Intereses detectados",
            count=len(interests),
            model=response.model_used,
        )

        return interests, response

    # -------------------------------------------------------------------
    # Step 4: Deteccion de habilidades
    # -------------------------------------------------------------------

    async def _run_skills_detection(
        self,
        transcript_text: str,
        *,
        game_results: str,
        previous_skills: str,
        model: str,
    ) -> tuple[list[dict[str, Any]], LLMResponse]:
        """Detecta habilidades del estudiante."""
        messages = SKILLS_DETECTION.render(
            transcript_text=transcript_text,
            game_results=game_results,
            previous_skills=previous_skills,
        )

        validated, response = await call_and_validate(
            self.client,
            messages=messages,
            schema=SkillDetected,
            model=model,
            is_list=True,
            temperature=0.3,
        )

        skills = [item.model_dump() for item in validated]

        logger.info(
            "Habilidades detectadas",
            count=len(skills),
            model=response.model_used,
        )

        return skills, response

    # -------------------------------------------------------------------
    # Step 5: Analisis de sentimiento
    # -------------------------------------------------------------------

    async def _run_sentiment_analysis(
        self,
        transcript_text: str,
        *,
        model: str,
    ) -> tuple[dict[str, Any], LLMResponse]:
        """Analiza el estado emocional del estudiante."""
        messages = SENTIMENT_ANALYSIS.render(
            transcript_text=transcript_text,
        )

        validated, response = await call_and_validate(
            self.client,
            messages=messages,
            schema=EmotionalSentiment,
            model=model,
            is_list=False,
            temperature=0.3,
        )

        sentiment = validated.model_dump()

        logger.info(
            "Sentimiento analizado",
            overall=sentiment.get("overall"),
            score=sentiment.get("score"),
            model=response.model_used,
        )

        return sentiment, response

    # -------------------------------------------------------------------
    # Step 6: Sugerencias de tests/juegos
    # -------------------------------------------------------------------

    async def _run_test_suggestions(
        self,
        *,
        session_summary: str,
        interests_detected: str,
        skills_detected: str,
        available_tests: str,
        available_games: str,
        profile_gaps: str,
        model: str,
    ) -> tuple[dict[str, Any], LLMResponse]:
        """Sugiere tests y juegos relevantes."""
        messages = TEST_GAME_SUGGESTIONS.render(
            session_summary=session_summary,
            interests_detected=interests_detected,
            skills_detected=skills_detected,
            available_tests=available_tests,
            available_games=available_games,
            profile_gaps=profile_gaps,
        )

        validated, response = await call_and_validate(
            self.client,
            messages=messages,
            schema=SuggestionsOutput,
            model=model,
            is_list=False,
            temperature=0.4,
        )

        suggestions = validated.model_dump()

        logger.info(
            "Sugerencias generadas",
            tests_count=len(suggestions.get("suggested_tests", [])),
            games_count=len(suggestions.get("suggested_games", [])),
            model=response.model_used,
        )

        return suggestions, response
