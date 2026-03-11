"""
Vocari Backend - Router de Chat IA.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.middleware import get_current_user
from app.auth.models import User

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    data: ChatRequest,
    current_user: User | None = Depends(get_current_user),
) -> ChatResponse:
    """Chat con IA orientacional."""
    try:
        from app.ai_engine.openrouter_client import get_openrouter_client

        client = get_openrouter_client()

        system_prompt = """Eres Vocari, un asistente de orientación vocacional con IA. Tu rol es:

1. Ayudar a estudiantes (16-24 años) a descubrir su perfil vocacional
2. Explicar sobre carreras profesionales y técnicas en Chile
3. Dar información sobre el mercado laboral chileno (empleabilidad, salarios)
4. Explicar el modelo RIASEC de intereses profesionales
5. Responder dudas sobre universidades, institutos y procesos de admisión
6. Dar consejos sobre cómo explorar opciones de carrera

Directrices:
- Usa un tono amigable, profesional y motivador
- Sé específico sobre datos del mercado laboral chileno
- Cuando no sepas algo, dilo honestamente
- Pregunta por el perfil o intereses del usuario para dar mejores recomendaciones
- No des consejos médicos ni de salud mental - deriva a profesionales
- Recuerda que cada persona es única - evita generalizaciones

Información útil que puedes usar:
- El modelo RIASEC tiene 6 dimensiones: Realista (R), Investigador (I), Artístico (A), Social (S), Emprendedor (E), Convencional (C)
- Las carreras técnicas duran 2-3 años, las profesionales 4-6 años
- Los salarios varían enormemente según carrera, experiencia y región
- La empleabilidad también varía según el campo"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": data.message},
        ]

        if client.api_key:
            response = await client.chat(
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )
            return ChatResponse(response=response.content)
        else:
            return ChatResponse(
                response="Hola. Soy Vocari, tu asistente de orientación vocacional. Actualmente el servicio de chat con IA no está disponible, pero puedes hacer el test vocacional gratis en /test-gratis para descubrir tu perfil."
            )

    except Exception as e:
        return ChatResponse(
            response=f"Disculpa, tuve un problema al procesar tu mensaje. El servicio de IA puede estar temporalmente no disponible. Por favor intenta más tarde o contáctanos."
        )
