"""
Vocari Backend - Prompt Templates (T3.2).

5 templates parametrizados y versionados para el pipeline de analisis
de transcripciones de sesiones.

Referencia: specs/ai-engine.md seccion 5.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

PROMPT_VERSION = "1.0.0"


@dataclass(frozen=True)
class PromptTemplate:
    """Template de prompt con system y user message."""

    name: str
    version: str
    model_tier: str  # "sonnet" | "haiku"
    system: str
    user_template: str

    def render(self, **kwargs: Any) -> list[dict[str, str]]:
        """Renderiza el prompt con las variables proporcionadas."""
        return [
            {"role": "system", "content": self.system},
            {"role": "user", "content": self.user_template.format(**kwargs)},
        ]


# ---------------------------------------------------------------------------
# 5.1 Resumen de Sesion
# ---------------------------------------------------------------------------

SESSION_SUMMARY = PromptTemplate(
    name="session_summary",
    version=PROMPT_VERSION,
    model_tier="sonnet",
    system=(
        "Eres un asistente de orientacion vocacional para estudiantes de colegio en Chile. "
        "Tu tarea es resumir una sesion de orientacion vocacional entre un orientador y un estudiante. "
        "El resumen debe ser objetivo, profesional y util para el orientador. "
        "Responde siempre en espanol chileno."
    ),
    user_template=(
        "## Transcripcion de Sesion\n\n"
        "Fecha: {session_date}\n"
        "Duracion: {duration} minutos\n"
        "Estudiante: Estudiante ({student_grade})\n"
        "Orientador: Orientador\n\n"
        "### Transcripcion:\n"
        "{transcript_text}\n\n"
        "### Instrucciones:\n"
        "Genera un resumen estructurado con las siguientes secciones:\n\n"
        "1. **Contexto**: Situacion general del estudiante al inicio de la sesion (1-2 oraciones)\n"
        "2. **Temas Discutidos**: Lista de los principales temas abordados (3-5 puntos)\n"
        "3. **Hallazgos Clave**: Descubrimientos importantes sobre el estudiante (2-4 puntos)\n"
        "4. **Estado Emocional**: Observacion breve del estado emocional del estudiante\n"
        "5. **Proximos Pasos**: Acciones acordadas o sugeridas (2-3 puntos)\n"
        "6. **Notas para el Orientador**: Observaciones internas utiles en futuras sesiones\n\n"
        "Mantener el resumen entre 200-400 palabras. Ser concreto y evitar generalidades."
    ),
)


# ---------------------------------------------------------------------------
# 5.2 Deteccion de Intereses
# ---------------------------------------------------------------------------

INTEREST_DETECTION = PromptTemplate(
    name="interest_detection",
    version=PROMPT_VERSION,
    model_tier="sonnet",
    system=(
        "Eres un psicologo especializado en orientacion vocacional para adolescentes. "
        "Tu tarea es detectar intereses vocacionales a partir de una conversacion. "
        "Debes identificar intereses explicitos (mencionados directamente) e implicitos (inferidos del contexto). "
        "Responde siempre en formato JSON."
    ),
    user_template=(
        "## Transcripcion de Sesion\n"
        "{transcript_text}\n\n"
        "## Perfil Previo del Estudiante (si existe)\n"
        "Intereses previamente detectados: {previous_interests}\n"
        "Codigo RIASEC: {riasec_code}\n\n"
        "## Instrucciones\n"
        "Identifica todos los intereses vocacionales detectables en la conversacion.\n\n"
        "Para cada interes, proporciona:\n"
        '- "interest": nombre del interes (en espanol)\n'
        '- "confidence": nivel de confianza de 0.0 a 1.0\n'
        '- "evidence": cita textual o parafrasis que sustenta el interes\n'
        '- "holland_category": categoria Holland (R, I, A, S, E, C) mas cercana\n'
        '- "explicit": true si el estudiante lo menciono directamente, false si es inferido\n'
        '- "is_new": true si no estaba en el perfil previo\n\n'
        "Responde SOLO con un JSON array valido. Ejemplo:\n"
        "[\n"
        "  {{\n"
        '    "interest": "Programacion y desarrollo de software",\n'
        '    "confidence": 0.85,\n'
        '    "evidence": "El estudiante menciono que pasa horas programando en Python por diversion",\n'
        '    "holland_category": "I",\n'
        '    "explicit": true,\n'
        '    "is_new": false\n'
        "  }}\n"
        "]"
    ),
)


# ---------------------------------------------------------------------------
# 5.3 Deteccion de Habilidades
# ---------------------------------------------------------------------------

SKILLS_DETECTION = PromptTemplate(
    name="skills_detection",
    version=PROMPT_VERSION,
    model_tier="sonnet",
    system=(
        "Eres un psicologo especializado en evaluacion de habilidades de adolescentes. "
        "Tu tarea es detectar habilidades (hard skills y soft skills) a partir de una conversacion "
        "de orientacion vocacional. "
        "Responde siempre en formato JSON."
    ),
    user_template=(
        "## Transcripcion de Sesion\n"
        "{transcript_text}\n\n"
        "## Datos Adicionales del Estudiante\n"
        "Resultados de juegos recientes: {game_results}\n"
        "Perfil previo: {previous_skills}\n\n"
        "## Instrucciones\n"
        "Identifica habilidades del estudiante evidenciadas en la conversacion.\n\n"
        "Para cada habilidad:\n"
        '- "skill": nombre de la habilidad (en espanol)\n'
        '- "confidence": nivel de confianza de 0.0 a 1.0\n'
        '- "evidence": evidencia textual\n'
        '- "skill_type": "hard" (tecnica) o "soft" (blanda/interpersonal)\n'
        '- "level": "basico", "intermedio" o "avanzado" (si es inferible)\n\n'
        "Responde SOLO con un JSON array valido."
    ),
)


# ---------------------------------------------------------------------------
# 5.4 Analisis de Sentimiento
# ---------------------------------------------------------------------------

SENTIMENT_ANALYSIS = PromptTemplate(
    name="sentiment_analysis",
    version=PROMPT_VERSION,
    model_tier="haiku",
    system=(
        "Eres un psicologo clinico especializado en adolescentes. "
        "Analiza el estado emocional de un estudiante durante una sesion de orientacion vocacional. "
        "Tu analisis debe ser sensible, objetivo y util para el orientador. "
        "Responde en formato JSON."
    ),
    user_template=(
        "## Transcripcion de Sesion\n"
        "{transcript_text}\n\n"
        "## Instrucciones\n"
        "Analiza el estado emocional del estudiante durante la sesion.\n\n"
        "Proporciona:\n"
        '1. "overall": sentimiento general ("positivo", "neutro", "negativo", "mixto")\n'
        '2. "score": puntuacion de -1.0 (muy negativo) a 1.0 (muy positivo)\n'
        '3. "engagement": nivel de participacion ("alto", "medio", "bajo")\n'
        '4. "anxiety_indicators": lista de indicadores de ansiedad sobre el futuro (strings)\n'
        '5. "motivation": nivel de motivacion percibido ("alta", "media", "baja")\n'
        '6. "key_moments": momentos emocionales significativos (max 5 strings descriptivos)\n\n'
        "Responde SOLO con un JSON object valido con estos campos."
    ),
)


# ---------------------------------------------------------------------------
# 5.5 Sugerencia de Tests/Juegos
# ---------------------------------------------------------------------------

TEST_GAME_SUGGESTIONS = PromptTemplate(
    name="test_game_suggestions",
    version=PROMPT_VERSION,
    model_tier="haiku",
    system=(
        "Eres un orientador vocacional con amplio conocimiento en evaluacion psicometrica "
        "y gamificacion educativa. "
        "Tu tarea es recomendar evaluaciones y juegos que ayuden a profundizar el conocimiento "
        "del perfil vocacional del estudiante."
    ),
    user_template=(
        "## Resumen de Sesion\n"
        "{session_summary}\n\n"
        "## Intereses Detectados\n"
        "{interests_detected}\n\n"
        "## Habilidades Detectadas\n"
        "{skills_detected}\n\n"
        "## Tests Disponibles\n"
        "{available_tests}\n\n"
        "## Juegos Disponibles\n"
        "{available_games}\n\n"
        "## Areas de Incertidumbre del Perfil\n"
        "{profile_gaps}\n\n"
        "## Instrucciones\n"
        "Recomienda tests y juegos que ayuden a:\n"
        "1. Confirmar o refutar habilidades detectadas con baja confianza\n"
        "2. Explorar intereses emergentes\n"
        "3. Llenar vacios en el perfil del estudiante\n"
        "4. Mantener al estudiante motivado y engaged\n\n"
        "Para cada recomendacion:\n"
        '- "test_id" o "game_id": identificador\n'
        '- "test_name" o "game_name": nombre descriptivo\n'
        '- "reason": por que se recomienda (en espanol)\n'
        '- "priority": "alta", "media", "baja"\n\n'
        'Responde en JSON: {{ "suggested_tests": [...], "suggested_games": [...] }}'
    ),
)


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

ALL_TEMPLATES: dict[str, PromptTemplate] = {
    "session_summary": SESSION_SUMMARY,
    "interest_detection": INTEREST_DETECTION,
    "skills_detection": SKILLS_DETECTION,
    "sentiment_analysis": SENTIMENT_ANALYSIS,
    "test_game_suggestions": TEST_GAME_SUGGESTIONS,
}

# Mapeo de template a modelo recomendado
MODEL_TIER_MAP: dict[str, str] = {
    "sonnet": "anthropic/claude-3.5-sonnet",
    "haiku": "anthropic/claude-3.5-haiku",
}


def get_model_for_template(template: PromptTemplate) -> str:
    """Retorna el modelo recomendado para un template."""
    return MODEL_TIER_MAP.get(template.model_tier, "anthropic/claude-3.5-sonnet")
