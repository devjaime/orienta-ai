"""
Tests del pipeline de IA (T3.11).

Tests unitarios con mock de OpenRouter para verificar:
- PII scrubbing
- Validacion de output JSON
- Pipeline completo con respuestas simuladas
- Cache layer
- Cost tracking
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai_engine.openrouter_client import LLMResponse


# ---------------------------------------------------------------------------
# Datos de ejemplo
# ---------------------------------------------------------------------------

SAMPLE_TRANSCRIPT = """
Orientador: Hola, ¿como estas hoy?
Estudiante: Bien, gracias. Estuve pensando en lo que hablamos la semana pasada sobre las carreras de ingeniería.
Orientador: ¡Que bueno! ¿Que fue lo que mas te llamo la atencion?
Estudiante: Me gusta mucho la programacion. He estado aprendiendo Python por mi cuenta y me fascina crear cosas con codigo. También me interesa la inteligencia artificial.
Orientador: Interesante. ¿Has tenido alguna experiencia practica?
Estudiante: Si, hice un proyecto en el colegio donde programe un chatbot simple. Mis compañeros dijeron que fue muy bueno.
Orientador: Eso muestra iniciativa y habilidad tecnica. ¿Como te sientes respecto a tu futuro?
Estudiante: Un poco ansioso, la verdad. Hay tantas opciones y no se si estoy eligiendo bien. Mis papas quieren que estudie medicina.
Orientador: Es normal sentirse así. Lo importante es explorar tus intereses genuinos. ¿Que te gusta hacer en tu tiempo libre?
Estudiante: Programar, jugar videojuegos y leer sobre tecnología. A veces dibujo diseños de interfaces de apps.
Orientador: Parece que tienes un perfil muy ligado a la tecnologia y el diseño. Vamos a explorar eso mas a fondo.
"""

MOCK_SUMMARY_RESPONSE = (
    "## Resumen de Sesion\n\n"
    "**Contexto**: El estudiante retoma la conversacion sobre carreras de ingenieria.\n\n"
    "**Temas Discutidos**:\n"
    "- Interes en programacion y Python\n"
    "- Experiencia con chatbot escolar\n"
    "- Ansiedad sobre futuro vocacional\n"
    "- Presion familiar hacia medicina\n\n"
    "**Hallazgos Clave**:\n"
    "- Fuerte interes autodidacta en programacion\n"
    "- Habilidad demostrada con proyecto practico\n\n"
    "**Estado Emocional**: Ansioso pero motivado.\n\n"
    "**Proximos Pasos**:\n"
    "- Explorar carreras de tecnologia\n"
    "- Aplicar test RIASEC\n"
)

MOCK_INTERESTS_RESPONSE = json.dumps([
    {
        "interest": "Programacion y desarrollo de software",
        "confidence": 0.9,
        "evidence": "Ha estado aprendiendo Python por su cuenta y le fascina crear cosas con codigo",
        "holland_category": "I",
        "explicit": True,
        "is_new": True,
    },
    {
        "interest": "Inteligencia Artificial",
        "confidence": 0.7,
        "evidence": "Menciono interes en inteligencia artificial",
        "holland_category": "I",
        "explicit": True,
        "is_new": True,
    },
    {
        "interest": "Diseño de interfaces",
        "confidence": 0.5,
        "evidence": "A veces dibujo diseños de interfaces de apps",
        "holland_category": "A",
        "explicit": True,
        "is_new": True,
    },
])

MOCK_SKILLS_RESPONSE = json.dumps([
    {
        "skill": "Programacion en Python",
        "confidence": 0.8,
        "evidence": "Ha aprendido Python por su cuenta y creo un chatbot",
        "skill_type": "hard",
        "level": "intermedio",
    },
    {
        "skill": "Iniciativa y aprendizaje autonomo",
        "confidence": 0.85,
        "evidence": "Aprendiendo por su cuenta, proyecto propio",
        "skill_type": "soft",
        "level": "avanzado",
    },
])

MOCK_SENTIMENT_RESPONSE = json.dumps({
    "overall": "mixto",
    "score": 0.3,
    "engagement": "alto",
    "anxiety_indicators": ["Ansiedad sobre eleccion de carrera", "Presion familiar"],
    "motivation": "alta",
    "key_moments": [
        "Entusiasmo al hablar de programacion",
        "Ansiedad al mencionar expectativas de los padres",
    ],
})

MOCK_SUGGESTIONS_RESPONSE = json.dumps({
    "suggested_tests": [
        {
            "test_id": "riasec-holland",
            "test_name": "Test RIASEC Holland",
            "reason": "Para confirmar perfil Investigativo y Artistico detectado",
            "priority": "alta",
        },
    ],
    "suggested_games": [],
})


def _make_llm_response(content: str, model: str = "anthropic/claude-3.5-sonnet") -> LLMResponse:
    """Helper para crear LLMResponse mock."""
    return LLMResponse(
        content=content,
        model_used=model,
        input_tokens=500,
        output_tokens=300,
        total_tokens=800,
        latency_ms=1200.0,
        cost_usd=0.015,
        fallback_used=False,
        cache_hit=False,
    )


# ===========================================================================
# Test: PII Scrubber
# ===========================================================================


class TestPIIScrubber:
    """Tests para el modulo de PII scrubbing."""

    def test_scrub_rut(self) -> None:
        from app.ai_engine.pii_scrubber import scrub_pii

        text = "El RUT del estudiante es 12.345.678-9"
        result = scrub_pii(text)
        assert "12.345.678-9" not in result
        assert "[RUT_REMOVIDO]" in result

    def test_scrub_email(self) -> None:
        from app.ai_engine.pii_scrubber import scrub_pii

        text = "Su correo es juan.perez@gmail.com"
        result = scrub_pii(text)
        assert "juan.perez@gmail.com" not in result
        assert "[EMAIL_REMOVIDO]" in result

    def test_scrub_speaker_names(self) -> None:
        from app.ai_engine.pii_scrubber import scrub_pii

        text = "Juan Perez dijo que Maria Garcia es su orientadora"
        speaker_map = {"Juan Perez": "Estudiante", "Maria Garcia": "Orientador"}
        result = scrub_pii(text, speaker_map)
        assert "Juan" not in result
        assert "Maria" not in result
        assert "Estudiante" in result
        assert "Orientador" in result

    def test_verify_no_pii_clean(self) -> None:
        from app.ai_engine.pii_scrubber import verify_no_pii

        clean_text = "El Estudiante expreso interes en programacion"
        warnings = verify_no_pii(clean_text)
        assert len(warnings) == 0

    def test_verify_no_pii_dirty(self) -> None:
        from app.ai_engine.pii_scrubber import verify_no_pii

        dirty_text = "Juan tiene RUT 12.345.678-9 y correo juan@test.com"
        warnings = verify_no_pii(dirty_text)
        assert len(warnings) >= 1

    def test_build_speaker_map(self) -> None:
        from app.ai_engine.pii_scrubber import build_speaker_map

        speaker_map = build_speaker_map(
            student_name="Carlos Lopez",
            orientador_name="Ana Torres",
        )
        assert speaker_map["Carlos Lopez"] == "Estudiante"
        assert speaker_map["Ana Torres"] == "Orientador"


# ===========================================================================
# Test: Validacion de Output
# ===========================================================================


class TestValidation:
    """Tests para validacion de output LLM."""

    def test_parse_json_clean(self) -> None:
        from app.ai_engine.validation import parse_json_response

        result = parse_json_response('{"key": "value"}')
        assert result == {"key": "value"}

    def test_parse_json_markdown_block(self) -> None:
        from app.ai_engine.validation import parse_json_response

        result = parse_json_response('```json\n{"key": "value"}\n```')
        assert result == {"key": "value"}

    def test_parse_json_with_surrounding_text(self) -> None:
        from app.ai_engine.validation import parse_json_response

        result = parse_json_response('Here is the result: {"key": "value"} end')
        assert result == {"key": "value"}

    def test_parse_json_array(self) -> None:
        from app.ai_engine.validation import parse_json_response

        result = parse_json_response('[{"a": 1}, {"b": 2}]')
        assert isinstance(result, list)
        assert len(result) == 2

    def test_parse_json_invalid_raises(self) -> None:
        from app.ai_engine.validation import parse_json_response

        with pytest.raises(ValueError, match="No se pudo parsear"):
            parse_json_response("this is not json at all")

    def test_validate_json_output_pydantic(self) -> None:
        from app.ai_engine.validation import validate_json_output
        from app.sessions.schemas import EmotionalSentiment

        content = MOCK_SENTIMENT_RESPONSE
        result = validate_json_output(content, EmotionalSentiment)
        assert result.overall == "mixto"
        assert result.score == 0.3

    def test_validate_json_list(self) -> None:
        from app.ai_engine.validation import validate_json_list
        from app.sessions.schemas import InterestDetected

        result = validate_json_list(MOCK_INTERESTS_RESPONSE, InterestDetected)
        assert len(result) == 3
        assert result[0].interest == "Programacion y desarrollo de software"
        assert result[0].confidence == 0.9

    def test_validate_confidence_range(self) -> None:
        from app.ai_engine.validation import validate_confidence_range

        items = [{"confidence": 0.5}, {"confidence": 1.0}, {"confidence": 0.0}]
        validate_confidence_range(items)  # Should not raise

    def test_validate_confidence_out_of_range(self) -> None:
        from app.ai_engine.validation import validate_confidence_range

        items = [{"confidence": 1.5}]
        with pytest.raises(ValueError, match="fuera de rango"):
            validate_confidence_range(items)

    def test_validate_sentiment_score(self) -> None:
        from app.ai_engine.validation import validate_sentiment_score

        validate_sentiment_score(0.5)
        validate_sentiment_score(-1.0)
        validate_sentiment_score(1.0)

    def test_validate_sentiment_score_out_of_range(self) -> None:
        from app.ai_engine.validation import validate_sentiment_score

        with pytest.raises(ValueError, match="fuera de rango"):
            validate_sentiment_score(1.5)


# ===========================================================================
# Test: Prompts
# ===========================================================================


class TestPrompts:
    """Tests para los prompt templates."""

    def test_all_templates_registered(self) -> None:
        from app.ai_engine.prompts import ALL_TEMPLATES

        assert len(ALL_TEMPLATES) == 5
        assert "session_summary" in ALL_TEMPLATES
        assert "interest_detection" in ALL_TEMPLATES
        assert "skills_detection" in ALL_TEMPLATES
        assert "sentiment_analysis" in ALL_TEMPLATES
        assert "test_game_suggestions" in ALL_TEMPLATES

    def test_summary_render(self) -> None:
        from app.ai_engine.prompts import SESSION_SUMMARY

        messages = SESSION_SUMMARY.render(
            session_date="2026-03-08",
            duration="30",
            student_grade="3ro Medio",
            transcript_text="Texto de prueba",
        )
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert "2026-03-08" in messages[1]["content"]
        assert "3ro Medio" in messages[1]["content"]

    def test_model_tier_mapping(self) -> None:
        from app.ai_engine.prompts import MODEL_TIER_MAP, get_model_for_template, SESSION_SUMMARY, SENTIMENT_ANALYSIS

        sonnet_model = get_model_for_template(SESSION_SUMMARY)
        haiku_model = get_model_for_template(SENTIMENT_ANALYSIS)
        assert "sonnet" in sonnet_model
        assert "haiku" in haiku_model

    def test_sonnet_templates(self) -> None:
        from app.ai_engine.prompts import ALL_TEMPLATES

        sonnet_templates = [t for t in ALL_TEMPLATES.values() if t.model_tier == "sonnet"]
        assert len(sonnet_templates) == 3  # summary, interests, skills

    def test_haiku_templates(self) -> None:
        from app.ai_engine.prompts import ALL_TEMPLATES

        haiku_templates = [t for t in ALL_TEMPLATES.values() if t.model_tier == "haiku"]
        assert len(haiku_templates) == 2  # sentiment, suggestions


# ===========================================================================
# Test: Pipeline (con mock de OpenRouter)
# ===========================================================================


class TestTranscriptAnalysisPipeline:
    """Tests del pipeline completo con OpenRouter mockeado."""

    @pytest.fixture
    def mock_client(self) -> MagicMock:
        """Crea un OpenRouterClient mock que retorna respuestas simuladas."""
        client = MagicMock()

        # Secuencia de respuestas: summary, interests, skills, sentiment, suggestions
        # Notar que summary no pasa por call_and_validate, usa chat directo
        responses = [
            # Steps 2-4 (Sonnet, paralelo): summary, interests, skills
            _make_llm_response(MOCK_SUMMARY_RESPONSE, "anthropic/claude-3.5-sonnet"),
            _make_llm_response(MOCK_INTERESTS_RESPONSE, "anthropic/claude-3.5-sonnet"),
            _make_llm_response(MOCK_SKILLS_RESPONSE, "anthropic/claude-3.5-sonnet"),
            # Steps 5-6 (Haiku, paralelo): sentiment, suggestions
            _make_llm_response(MOCK_SENTIMENT_RESPONSE, "anthropic/claude-3.5-haiku"),
            _make_llm_response(MOCK_SUGGESTIONS_RESPONSE, "anthropic/claude-3.5-haiku"),
        ]

        call_count = 0

        async def mock_chat(**kwargs):
            nonlocal call_count
            idx = call_count
            call_count += 1
            if idx < len(responses):
                return responses[idx]
            return _make_llm_response("{}", "unknown")

        client.chat = mock_chat
        return client

    @pytest.mark.asyncio
    async def test_pipeline_runs_successfully(self, mock_client: MagicMock) -> None:
        """Verifica que el pipeline completo se ejecuta y retorna resultado."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
            session_date="2026-03-08",
            duration_minutes=30,
            student_grade="3ro Medio",
        )

        assert result.success is True
        assert len(result.summary) > 0
        assert "Resumen" in result.summary

    @pytest.mark.asyncio
    async def test_pipeline_detects_interests(self, mock_client: MagicMock) -> None:
        """Verifica que el pipeline detecta intereses."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
            session_date="2026-03-08",
            duration_minutes=30,
        )

        assert len(result.interests) == 3
        assert result.interests[0]["interest"] == "Programacion y desarrollo de software"
        assert result.interests[0]["confidence"] == 0.9

    @pytest.mark.asyncio
    async def test_pipeline_detects_skills(self, mock_client: MagicMock) -> None:
        """Verifica que el pipeline detecta habilidades."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
        )

        assert len(result.skills) == 2
        assert result.skills[0]["skill"] == "Programacion en Python"
        assert result.skills[0]["skill_type"] == "hard"

    @pytest.mark.asyncio
    async def test_pipeline_analyzes_sentiment(self, mock_client: MagicMock) -> None:
        """Verifica analisis de sentimiento."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
        )

        assert result.sentiment["overall"] == "mixto"
        assert result.sentiment["score"] == 0.3
        assert result.sentiment["engagement"] == "alto"
        assert len(result.sentiment["anxiety_indicators"]) == 2

    @pytest.mark.asyncio
    async def test_pipeline_generates_suggestions(self, mock_client: MagicMock) -> None:
        """Verifica que el pipeline sugiere tests."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
        )

        assert len(result.suggested_tests) == 1
        assert result.suggested_tests[0]["test_id"] == "riasec-holland"

    @pytest.mark.asyncio
    async def test_pipeline_tracks_metrics(self, mock_client: MagicMock) -> None:
        """Verifica que el pipeline trackea metricas (tokens, costo, tiempo)."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
        )

        assert result.total_tokens > 0
        assert result.total_cost_usd > 0
        assert result.processing_time_seconds > 0
        assert len(result.llm_responses) == 5  # 5 llamadas LLM
        assert len(result.models_used) == 5

    @pytest.mark.asyncio
    async def test_pipeline_scrubs_pii(self, mock_client: MagicMock) -> None:
        """Verifica que PII se remueve antes de enviar al LLM."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        transcript_with_pii = (
            "Juan Perez: Mi RUT es 12.345.678-9 y mi correo es juan@test.com\n"
            "Maria Garcia: Entendido, vamos a hablar de tus intereses."
        )

        # Capturar los mensajes enviados al LLM
        captured_messages = []

        async def capturing_chat(**kwargs):
            captured_messages.append(kwargs.get("messages", []))
            return _make_llm_response(MOCK_SUMMARY_RESPONSE)

        mock_client.chat = capturing_chat

        pipeline = TranscriptAnalysisPipeline(client=mock_client)
        await pipeline.run(
            transcript_text=transcript_with_pii,
            student_name="Juan Perez",
            orientador_name="Maria Garcia",
        )

        # Verificar que PII no esta en los mensajes enviados
        for msg_list in captured_messages:
            for msg in msg_list:
                content = msg.get("content", "")
                assert "12.345.678-9" not in content
                assert "juan@test.com" not in content

    @pytest.mark.asyncio
    async def test_pipeline_handles_partial_failure(self) -> None:
        """El pipeline debe funcionar aunque alguna etapa falle."""
        from app.ai_engine.pipelines import TranscriptAnalysisPipeline

        client = MagicMock()
        call_count = 0

        async def failing_chat(**kwargs):
            nonlocal call_count
            call_count += 1
            # Solo el resumen funciona, el resto falla
            if call_count == 1:
                return _make_llm_response(MOCK_SUMMARY_RESPONSE)
            raise Exception("Simulated failure")

        client.chat = failing_chat

        pipeline = TranscriptAnalysisPipeline(client=client)
        result = await pipeline.run(
            transcript_text=SAMPLE_TRANSCRIPT,
        )

        # El resumen debe estar presente
        assert result.success is True
        assert len(result.summary) > 0
        # Pero deben haber errores registrados
        assert len(result.errors) > 0


# ===========================================================================
# Test: Cache Layer
# ===========================================================================


class TestCacheLayer:
    """Tests para el cache layer de IA."""

    def test_non_cacheable_types(self) -> None:
        from app.ai_engine.cache import NON_CACHEABLE

        assert "session_summary" in NON_CACHEABLE
        assert "sentiment_analysis" in NON_CACHEABLE
        # Estos NO deberian estar en non_cacheable
        assert "riasec_explain" not in NON_CACHEABLE

    def test_cache_ttl_values(self) -> None:
        from app.ai_engine.cache import CacheTTL

        assert CacheTTL.RIASEC_EXPLANATION == 86400  # 24h
        assert CacheTTL.CAREER_RECOMMENDATION == 3600  # 1h
        assert CacheTTL.CAREER_SIMULATION == 21600  # 6h
        assert CacheTTL.TEST_SUGGESTIONS == 1800  # 30min

    def test_make_cache_key(self) -> None:
        from app.ai_engine.cache import _make_cache_key

        key = _make_cache_key("riasec_explain", "RIA", "sonnet")
        assert key == "vocari:ai:riasec_explain:RIA:sonnet"

    def test_hash_content(self) -> None:
        from app.ai_engine.cache import _hash_content

        hash1 = _hash_content("hello world")
        hash2 = _hash_content("hello world")
        hash3 = _hash_content("different content")
        assert hash1 == hash2  # Deterministic
        assert hash1 != hash3
        assert len(hash1) == 16  # Truncated


# ===========================================================================
# Test: Cost Tracking Model
# ===========================================================================


class TestCostTracking:
    """Tests para el modelo y servicio de cost tracking."""

    def test_ai_usage_log_model_fields(self) -> None:
        """Verifica que el modelo tiene todos los campos esperados."""
        from app.ai_engine.cost_tracking import AIUsageLog

        # Verificar que la tabla existe en metadata
        assert AIUsageLog.__tablename__ == "ai_usage_logs"

        # Verificar campos clave
        columns = {c.name for c in AIUsageLog.__table__.columns}
        expected = {
            "id", "session_id", "institution_id", "pipeline_name",
            "prompt_version", "model_requested", "model_used",
            "input_tokens", "output_tokens", "total_tokens",
            "latency_ms", "cost_usd", "success", "fallback_used",
            "cache_hit", "validation_retries", "error_message",
            "created_at",
        }
        assert expected.issubset(columns)

    def test_ai_usage_log_repr(self) -> None:
        from app.ai_engine.cost_tracking import AIUsageLog

        log = AIUsageLog(
            pipeline_name="session_summary",
            model_used="anthropic/claude-3.5-sonnet",
            cost_usd=0.015,
        )
        repr_str = repr(log)
        assert "session_summary" in repr_str
        assert "claude-3.5-sonnet" in repr_str


# ===========================================================================
# Test: OpenRouter Client (unit)
# ===========================================================================


class TestOpenRouterClient:
    """Tests unitarios del OpenRouter client."""

    def test_estimate_cost_sonnet(self) -> None:
        from app.ai_engine.openrouter_client import OpenRouterClient

        cost = OpenRouterClient._estimate_cost(
            "anthropic/claude-3.5-sonnet",
            input_tokens=1000,
            output_tokens=500,
        )
        # (1000 * 3.0 + 500 * 15.0) / 1_000_000 = 0.0105
        assert abs(cost - 0.0105) < 0.0001

    def test_estimate_cost_haiku(self) -> None:
        from app.ai_engine.openrouter_client import OpenRouterClient

        cost = OpenRouterClient._estimate_cost(
            "anthropic/claude-3.5-haiku",
            input_tokens=1000,
            output_tokens=500,
        )
        # (1000 * 0.25 + 500 * 1.25) / 1_000_000 = 0.000875
        assert abs(cost - 0.000875) < 0.0001

    def test_estimate_cost_unknown_model(self) -> None:
        from app.ai_engine.openrouter_client import OpenRouterClient

        cost = OpenRouterClient._estimate_cost(
            "unknown/model",
            input_tokens=1000,
            output_tokens=500,
        )
        # Uses default (1.0, 5.0): (1000 * 1.0 + 500 * 5.0) / 1_000_000 = 0.0035
        assert abs(cost - 0.0035) < 0.0001

    def test_llm_response_dataclass(self) -> None:
        response = LLMResponse(
            content="test",
            model_used="anthropic/claude-3.5-sonnet",
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            latency_ms=500.0,
            cost_usd=0.01,
        )
        assert response.content == "test"
        assert response.fallback_used is False
        assert response.cache_hit is False
