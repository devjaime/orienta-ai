"""
Vocari Backend - Router de Chat / Orientador Virtual.

Endpoint para el chat con la orientadora virtual Valeria.
Usa OpenRouter si hay API key configurada; si no, respuestas scripted de fallback.
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.middleware import get_current_user
from app.auth.models import User
from app.common.database import get_async_session

logger = structlog.get_logger()

router = APIRouter()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

HOLLAND_DESCRIPTIONS: dict[str, str] = {
    "R": "Realista",
    "I": "Investigador",
    "A": "Artistico",
    "S": "Social",
    "E": "Emprendedor",
    "C": "Convencional",
}

HOLLAND_FULL: dict[str, str] = {
    "R": "Realista - te gusta trabajar con objetos, maquinas y actividades fisicas",
    "I": "Investigador - disfrutas analizar, investigar y resolver problemas complejos",
    "A": "Artistico - eres creativo y expresivo, valoras la libertad y la estetica",
    "S": "Social - te motiva ayudar, ensenar y trabajar con personas",
    "E": "Emprendedor - te gusta liderar, persuadir y alcanzar metas ambiciosas",
    "C": "Convencional - prefieres el orden, la precision y los sistemas bien organizados",
}


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    student_context: bool = True


class ChatResponse(BaseModel):
    reply: str
    model_used: str


# ---------------------------------------------------------------------------
# Fallback scripted responses (cuando no hay API key)
# ---------------------------------------------------------------------------

def _scripted_fallback(last_message: str) -> str:
    """Genera una respuesta scripted basada en palabras clave."""
    msg = last_message.lower()

    if any(kw in msg for kw in ["test", "riasec", "prueba", "holland"]):
        return (
            "El test RIASEC es una herramienta de orientacion vocacional que mide seis tipos de "
            "personalidad: Realista (R), Investigador (I), Artistico (A), Social (S), Emprendedor (E) "
            "y Convencional (C). Tu codigo Holland representa tus tres tipos dominantes y nos ayuda a "
            "encontrar carreras que se alinean con tu forma natural de ser. Si aun no lo has hecho, "
            "te invito a realizar el test en la seccion Tests. Solo toma unos minutos y sus resultados "
            "son muy reveladores!"
        )

    if any(kw in msg for kw in ["carrera", "estudiar", "universidad", "profesion", "futuro"]):
        return (
            "Elegir una carrera es una de las decisiones mas importantes de tu vida, y es completamente "
            "normal sentir dudas. Me gustaria conocerte mejor para orientarte. Cuentame: "
            "Que actividades disfrutas hacer en tu tiempo libre? Hay alguna materia escolar que te "
            "resulte especialmente interesante o en la que te destaques? Con esa informacion podemos "
            "explorar opciones que realmente te motiven."
        )

    if any(kw in msg for kw in ["hola", "buenos", "buenas", "saludos", "hi", "hey"]):
        return (
            "Hola! Que bueno verte por aqui. Soy Valeria, tu orientadora vocacional en Vocari. "
            "Estoy aqui para ayudarte a explorar tus intereses, entender tu perfil vocacional y "
            "descubrir carreras que se adapten a quien eres. Puedes preguntarme lo que quieras: "
            "sobre el test RIASEC, sobre carreras especificas, o simplemente contarme tus "
            "inquietudes sobre el futuro. Por donde te gustaria comenzar?"
        )

    if any(kw in msg for kw in ["gracias", "adios", "hasta", "bye", "chao", "ciao"]):
        return (
            "Ha sido un placer acompanarte en esta exploracion! Recuerda que el autoconocimiento "
            "es un proceso continuo: no hay prisa. Cuando quieras seguir conversando o tengas nuevas "
            "preguntas, aqui estare. Mucho exito en tu camino vocacional!"
        )

    return (
        "Entiendo que este proceso puede generar muchas preguntas, y eso es completamente normal. "
        "La exploracion vocacional es un viaje personal que toma tiempo. Lo importante es ir "
        "descubriendo poco a poco que te apasiona y que se te da bien. Puedes contarme mas sobre "
        "lo que tienes en mente? Estoy aqui para escucharte y orientarte en lo que necesites."
    )


# ---------------------------------------------------------------------------
# System prompt builder
# ---------------------------------------------------------------------------

def _build_system_prompt(
    name: str,
    holland_code: str,
    scores: dict,
    careers: list[str],
) -> str:
    code_letters = list(holland_code) if holland_code else []
    holland_desc = " + ".join(
        HOLLAND_DESCRIPTIONS.get(c, c) for c in code_letters[:3]
    ) if code_letters else "Sin codigo asignado aun"

    scores_str = (
        f"R={scores.get('R', 0)}, I={scores.get('I', 0)}, A={scores.get('A', 0)}, "
        f"S={scores.get('S', 0)}, E={scores.get('E', 0)}, C={scores.get('C', 0)}"
    )
    careers_str = ", ".join(careers) if careers else "Aun no calculadas (invita al estudiante a completar el test RIASEC)"

    return f"""Eres Valeria, una orientadora vocacional experta de la plataforma Vocari. Apoyas a estudiantes chilenos de 16-24 anos en su proceso de exploracion vocacional.

PERFIL DEL ESTUDIANTE:
- Nombre: {name}
- Codigo Holland: {holland_code or "Pendiente"} ({holland_desc})
- Puntajes RIASEC: {scores_str}
- Carreras mas compatibles: {careers_str}

INSTRUCCIONES:
- Usa un tono calido, empatico y motivador como una orientadora real
- Responde siempre en espanol
- Relaciona tus respuestas con el perfil Holland del estudiante cuando sea relevante
- Puedes hacer preguntas reflexivas para profundizar en sus intereses
- Respuestas concisas (2-4 parrafos maximo)
- Si el estudiante no ha hecho el test RIASEC, invitalo a hacerlo"""


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/orientador", response_model=ChatResponse)
async def chat_orientador(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_async_session),
) -> ChatResponse:
    """
    Chat con la orientadora virtual Valeria.
    Usa OpenRouter si hay API key; si no, respuestas scripted.
    """
    from sqlalchemy import text

    # --- Obtener contexto del estudiante ---
    name = getattr(user, "full_name", None) or user.name or user.email or "Estudiante"
    holland_code = ""
    scores: dict = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
    top_careers: list[str] = []

    if body.student_context:
        try:
            # Ultimo resultado RIASEC del estudiante
            result = await db.execute(
                text(
                    "SELECT result_code, scores FROM test_results "
                    "WHERE user_id = :uid AND test_type = 'riasec' "
                    "ORDER BY created_at DESC LIMIT 1"
                ),
                {"uid": str(user.id)},
            )
            row = result.fetchone()
            if row:
                holland_code = row[0] or ""
                raw_scores = row[1] or {}
                if isinstance(raw_scores, dict):
                    scores = {k: raw_scores.get(k, 0) for k in "RIASEC"}

            # Top 3 carreras por codigo Holland
            if holland_code:
                first_letter = holland_code[0] if holland_code else "S"
                careers_result = await db.execute(
                    text(
                        "SELECT name FROM careers "
                        "WHERE holland_codes::text ILIKE :pattern AND is_active = true "
                        "ORDER BY employability DESC LIMIT 3"
                    ),
                    {"pattern": f'%"{first_letter}"%'},
                )
                top_careers = [r[0] for r in careers_result.fetchall()]
        except Exception as ctx_err:
            logger.warning("Error obteniendo contexto del estudiante", error=str(ctx_err)[:200])

    # --- Intentar OpenRouter ---
    try:
        from app.ai_engine.openrouter_client import get_openrouter_client

        client = get_openrouter_client()

        if not client.api_key:
            raise ValueError("Sin API key configurada")

        system_prompt = _build_system_prompt(name, holland_code, scores, top_careers)

        openrouter_messages = [{"role": "system", "content": system_prompt}]
        # Solo los ultimos 10 mensajes para el contexto
        for m in body.messages[-10:]:
            openrouter_messages.append({"role": m.role, "content": m.content})

        llm_response = await client.chat(
            messages=openrouter_messages,
            temperature=0.7,
            max_tokens=600,
        )

        return ChatResponse(
            reply=llm_response.content,
            model_used=llm_response.model_used,
        )

    except Exception as llm_err:
        logger.info(
            "Usando respuesta scripted (OpenRouter no disponible)",
            reason=str(llm_err)[:100],
        )

    # --- Fallback scripted ---
    last_user_msg = ""
    for m in reversed(body.messages):
        if m.role == "user":
            last_user_msg = m.content
            break

    reply = _scripted_fallback(last_user_msg)
    return ChatResponse(reply=reply, model_used="scripted-fallback")
