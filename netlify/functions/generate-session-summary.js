// Netlify Function: generate-session-summary
// Genera resumen IA de apuntes de sesiones de orientación usando Claude API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function handler(event) {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
    };
  }

  // Validar que existe API key
  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;

  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY no configurada');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'API Key no configurada. Configura CLAUDE_API_KEY en Netlify.'
      })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON' })
    };
  }

  const { session_id, raw_notes } = payload;

  // Validar datos requeridos
  if (!session_id || !raw_notes) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Faltan datos: session_id y raw_notes son requeridos'
      })
    };
  }

  if (raw_notes.length < 50) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Las notas son demasiado cortas. Escribe al menos 50 caracteres.'
      })
    };
  }

  try {
    // Construir prompt para análisis de sesión
    const prompt = construirPromptSesion(raw_notes);

    // Llamar a Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: `Error de Claude API: ${response.status}`
        })
      };
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    // Parsear respuesta JSON de Claude
    let analysis;
    try {
      analysis = JSON.parse(aiResponse);
    } catch (parseErr) {
      console.error('Error parseando respuesta de Claude:', parseErr);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: 'Error procesando respuesta de IA'
        })
      };
    }

    // Generar resumen corto del análisis
    const summary = generarResumenCorto(analysis);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        summary,
        analysis,
        metadata: {
          session_id,
          timestamp: new Date().toISOString(),
          notes_length: raw_notes.length
        }
      })
    };

  } catch {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Error interno del servidor'
      })
    };
  }
};

/**
 * Construye el prompt para Claude para analizar notas de sesión
 */
function construirPromptSesion(rawNotes) {
  return `Eres un asistente experto en orientación educacional. Te proporcionaré apuntes en texto plano de una sesión de orientación con un estudiante.

**APUNTES DE LA SESIÓN:**
${rawNotes}

**TU TAREA:**
Analiza estos apuntes y genera un análisis estructurado en formato JSON con la siguiente estructura exacta:

{
  "puntos_clave": [
    "Punto clave 1 (máximo 100 caracteres)",
    "Punto clave 2",
    "Punto clave 3"
  ],
  "recomendaciones": [
    "Recomendación específica 1",
    "Recomendación específica 2"
  ],
  "proximos_pasos": [
    "Acción concreta 1",
    "Acción concreta 2"
  ],
  "areas_preocupacion": [
    "Área de preocupación 1 (si aplica)",
    "Área de preocupación 2 (si aplica)"
  ],
  "sentimiento_general": "positivo",
  "temas_discutidos": [
    "Tema 1",
    "Tema 2"
  ],
  "nivel_compromiso": "alto",
  "notas_orientador": "Observaciones adicionales del orientador en 1-2 oraciones"
}

**INSTRUCCIONES:**
1. **puntos_clave**: 2-5 puntos más importantes de la sesión
2. **recomendaciones**: Sugerencias específicas para el estudiante (mínimo 2)
3. **proximos_pasos**: Acciones concretas a realizar antes de la próxima sesión
4. **areas_preocupacion**: Aspectos que requieren atención (puede estar vacío si no hay)
5. **sentimiento_general**: "positivo", "neutro" o "negativo" según el tono de la sesión
6. **temas_discutidos**: Lista de temas principales abordados
7. **nivel_compromiso**: "alto", "medio" o "bajo" según el compromiso del estudiante
8. **notas_orientador**: Síntesis breve para el orientador

**IMPORTANTE:**
- Responde SOLO con el JSON, sin texto adicional
- Sé conciso pero específico
- Usa lenguaje profesional pero empático
- Si no hay áreas de preocupación, usa array vacío []
- Mantén cada ítem breve y accionable`;
}

/**
 * Genera un resumen corto legible para humanos del análisis
 */
function generarResumenCorto(analysis) {
  const { puntos_clave, sentimiento_general, nivel_compromiso } = analysis;

  const sentimientoEmoji = {
    'positivo': '😊',
    'neutro': '😐',
    'negativo': '😟'
  };

  const compromisoTexto = {
    'alto': 'muy comprometido',
    'medio': 'moderadamente comprometido',
    'bajo': 'poco comprometido'
  };

  return `Sesión ${sentimiento_general} ${sentimientoEmoji[sentimiento_general] || ''}. El estudiante mostró ${compromisoTexto[nivel_compromiso] || 'compromiso variable'}. Puntos clave: ${puntos_clave.slice(0, 2).join(', ')}.`;
}
