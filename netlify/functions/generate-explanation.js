// Netlify Function: generate-explanation
// Genera explicación personalizada del perfil RIASEC usando Claude API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Rate limiting: almacenamiento en memoria de IPs y sus intentos
// Formato: { ip: [timestamp1, timestamp2, ...] }
const ipAttempts = new Map();
const MAX_TESTS_PER_IP = 3;
const TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Verifica si una IP ha excedido el límite de intentos
 * @param {string} ip - Dirección IP del cliente
 * @returns {object} - { allowed: boolean, remaining: number }
 */
function checkRateLimit(ip) {
  const now = Date.now();

  // Obtener intentos previos de esta IP
  let attempts = ipAttempts.get(ip) || [];

  // Limpiar intentos antiguos (>24 horas)
  attempts = attempts.filter(timestamp => now - timestamp < TIME_WINDOW_MS);

  // Verificar si ha excedido el límite
  if (attempts.length >= MAX_TESTS_PER_IP) {
    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = TIME_WINDOW_MS - (now - oldestAttempt);
    const hoursUntilReset = Math.ceil(timeUntilReset / (60 * 60 * 1000));

    return {
      allowed: false,
      remaining: 0,
      resetIn: hoursUntilReset
    };
  }

  // Registrar nuevo intento
  attempts.push(now);
  ipAttempts.set(ip, attempts);

  return {
    allowed: true,
    remaining: MAX_TESTS_PER_IP - attempts.length
  };
}

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

  // Obtener IP del cliente (Netlify provee esto en headers)
  const clientIP = event.headers['x-nf-client-connection-ip'] ||
                   event.headers['client-ip'] ||
                   'unknown';

  // Verificar rate limit por IP
  const rateLimitCheck = checkRateLimit(clientIP);
  if (!rateLimitCheck.allowed) {
    console.log(`⚠️ Rate limit excedido para IP: ${clientIP}`);
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Límite de uso alcanzado',
        message: `Has alcanzado el límite de ${MAX_TESTS_PER_IP} tests en 24 horas. Intenta nuevamente en ${rateLimitCheck.resetIn} hora(s).`,
        resetIn: rateLimitCheck.resetIn
      })
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
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON' })
    };
  }

  const {
    codigo_holland,
    certeza,
    puntajes,
    ranking_completo,
    tipo = 'explicacion' // 'explicacion' | 'conversacion'
  } = payload;

  // Validar datos requeridos
  if (!codigo_holland || !puntajes) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Faltan datos: codigo_holland y puntajes son requeridos'
      })
    };
  }

  try {
    // Construir prompt personalizado
    const prompt = construirPrompt({
      codigo_holland,
      certeza,
      puntajes,
      ranking_completo,
      tipo
    });

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
        max_tokens: 1024,
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
    const explanation = data.content[0].text;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        explicacion: explanation,
        metadata: {
          codigo_holland,
          certeza,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (err) {
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
 * Construye el prompt para Claude según el tipo de solicitud
 */
function construirPrompt({ codigo_holland, certeza, puntajes, ranking_completo, tipo }) {
  const dimensionNames = {
    R: 'Realista',
    I: 'Investigador',
    A: 'Artístico',
    S: 'Social',
    E: 'Emprendedor',
    C: 'Convencional'
  };

  const [d1, d2, d3] = codigo_holland.split('');

  const top3Info = ranking_completo
    ? ranking_completo.slice(0, 3).map(r =>
        `${dimensionNames[r.dimension]}: ${r.puntaje}/30 puntos`
      ).join('\n')
    : '';

  if (tipo === 'conversacion') {
    // Modo conversacional (para chat)
    return `Eres un orientador vocacional experto que ayuda a jóvenes de 15-18 años a descubrir su vocación.

El estudiante acaba de completar el test Holland RIASEC y obtuvo:

**Código Holland:** ${codigo_holland}
**Perfil:** ${dimensionNames[d1]}-${dimensionNames[d2]}-${dimensionNames[d3]}
**Nivel de certeza:** ${certeza}

**Puntajes detallados:**
${top3Info}

Tu rol es:
- Explicar de forma cálida y motivadora qué significa su perfil
- Responder sus preguntas sobre carreras y vocación
- Ayudarle a explorar opciones profesionales
- Ser empático y alentador

Responde en un tono cercano, como un orientador que realmente le importa su futuro. Usa ejemplos concretos y evita tecnicismos.`;
  }

  // Modo explicación (generación inicial)
  return `Eres un orientador vocacional experto. Un estudiante de secundaria acaba de completar el test Holland RIASEC.

**Resultados:**
- Código Holland: ${codigo_holland}
- Perfil: ${dimensionNames[d1]}-${dimensionNames[d2]}-${dimensionNames[d3]}
- Certeza: ${certeza}

**Puntajes por dimensión:**
${top3Info}

Genera una explicación personalizada de 250-300 palabras que incluya:

1. **¿Qué significa tu perfil ${codigo_holland}?** (2-3 oraciones)
   - Explica de forma simple qué representa cada letra dominante
   - Usa un tono motivador y cercano

2. **Tus fortalezas naturales** (3-4 puntos)
   - Habilidades que destacan según su perfil
   - Ejemplos concretos de actividades que disfruta

3. **Ambientes donde brillarás** (2-3 ejemplos)
   - Tipos de trabajos o entornos laborales ideales
   - Por qué encajan con su perfil

4. **Mensaje motivador final** (1-2 oraciones)
   - Validación de su perfil
   - Invitación a explorar las carreras recomendadas

**Tono:** Cálido, motivador, juvenil (pero no infantil). Como un mentor que realmente cree en su potencial.

**Formato:** Párrafos cortos, fáciles de leer. Sin listas numeradas. Usa emojis ocasionalmente (máximo 3-4).

NO menciones:
- Tecnicismos del modelo Holland
- Carreras específicas (eso viene después)
- Limitaciones o debilidades

Genera solo la explicación, sin introducción ni despedida.`;
}
