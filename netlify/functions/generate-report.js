// Netlify Function: generate-report
// Genera el contenido del informe vocacional usando Claude API

const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function handler(event) {
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

  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('Variables de entorno faltantes para generate-report');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Configuración incompleta' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'JSON inválido' })
    };
  }

  const { reportId } = payload;

  if (!reportId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'reportId es requerido' })
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el informe con datos del plan
    const { data: report, error: reportError } = await supabase
      .from('paid_reports')
      .select(`
        *,
        plan:report_plans(name, display_name, features)
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Error obteniendo informe:', reportError);
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: 'Informe no encontrado' })
      };
    }

    const testSnapshot = report.test_result_snapshot || {};
    const isPremium = report.plan?.name === 'premium';

    // Generar contenido del informe con Claude
    const reportContent = await generateReportContent(apiKey, testSnapshot);

    // Generar datos de explicación visual si es premium
    let visualExplanation = null;
    if (isPremium) {
      visualExplanation = await generateVisualData(apiKey, testSnapshot);
    }

    // Guardar contenido generado y cambiar status a 'review'
    const { error: updateError } = await supabase
      .from('paid_reports')
      .update({
        report_content: reportContent,
        visual_explanation: visualExplanation,
        status: 'review'
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error guardando contenido del informe:', updateError);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: 'Error guardando informe' })
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, reportId })
    };

  } catch (err) {
    console.error('Error generando informe:', err);

    // Intentar marcar el error en la base de datos
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('paid_reports')
        .update({
          status: 'review',
          report_content: { error: 'Error en generación automática. Requiere revisión manual.' }
        })
        .eq('id', reportId);
    } catch (dbErr) {
      console.error('Error actualizando estado de error:', dbErr);
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Error generando informe' })
    };
  }
};

/**
 * Genera el contenido del informe vocacional usando Claude API
 */
async function generateReportContent(apiKey, testSnapshot) {
  const { codigo_holland, certeza, puntajes, carreras_recomendadas } = testSnapshot;

  const dimensionNames = {
    R: 'Realista', I: 'Investigador', A: 'Artístico',
    S: 'Social', E: 'Emprendedor', C: 'Convencional'
  };

  const puntajesInfo = puntajes
    ? Object.entries(puntajes)
        .sort(([, a], [, b]) => b - a)
        .map(([dim, score]) => `${dimensionNames[dim] || dim}: ${score}/30`)
        .join('\n')
    : 'No disponible';

  const carrerasInfo = carreras_recomendadas
    ? (Array.isArray(carreras_recomendadas)
        ? carreras_recomendadas.slice(0, 5).map(c =>
            typeof c === 'string' ? c : (c.nombre || c.name || JSON.stringify(c))
          ).join(', ')
        : JSON.stringify(carreras_recomendadas))
    : 'No especificadas';

  const prompt = `Eres un orientador vocacional experto. Genera un informe vocacional profesional y detallado para un estudiante chileno.

**Datos del estudiante:**
- Código Holland: ${codigo_holland || 'No disponible'}
- Nivel de certeza: ${certeza || 'No disponible'}
- Puntajes RIASEC:
${puntajesInfo}
- Carreras recomendadas preliminares: ${carrerasInfo}

Genera el informe en formato JSON con las siguientes secciones. Cada sección debe ser texto detallado (mínimo 200 palabras):

{
  "perfil_riasec": "Descripción detallada del perfil vocacional del estudiante. Explica qué significa su código Holland, cómo interactúan sus dimensiones dominantes, y qué dice esto sobre sus intereses y aptitudes naturales.",
  "analisis_detallado": "Análisis profundo de cada dimensión RIASEC del estudiante. Para las 3 dimensiones más altas, explica en detalle las características, habilidades asociadas, entornos de trabajo preferidos y tipos de actividades que disfrutan.",
  "carreras_recomendadas": "Listado detallado de 5-8 carreras recomendadas con justificación. Para cada carrera, explica por qué encaja con su perfil, qué universidades chilenas la ofrecen, y perspectivas laborales basándote en datos del mercado chileno.",
  "siguientes_pasos": "Guía práctica de los siguientes pasos que el estudiante debería tomar. Incluye: investigar carreras específicas, visitar universidades, hablar con profesionales del área, considerar factores como ubicación y costo, y recursos adicionales disponibles."
}

**Importante:**
- Escribe en español chileno, tono profesional pero cercano
- Usa datos reales del contexto educativo chileno (universidades, DEMRE, etc.)
- No uses emojis en el informe
- Responde SOLO con el JSON válido, sin texto adicional`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  try {
    return JSON.parse(text);
  } catch (parseErr) {
    // Si Claude no devuelve JSON válido, extraer el JSON del texto
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback: guardar como texto plano
    return {
      perfil_riasec: text,
      analisis_detallado: '',
      carreras_recomendadas: '',
      siguientes_pasos: ''
    };
  }
}

/**
 * Genera datos estructurados para la explicación visual (Plan Premium)
 */
async function generateVisualData(apiKey, testSnapshot) {
  const { codigo_holland, puntajes, carreras_recomendadas } = testSnapshot;

  const prompt = `Genera datos para una presentación visual del perfil vocacional de un estudiante.

Código Holland: ${codigo_holland || 'N/A'}
Puntajes: ${JSON.stringify(puntajes || {})}
Carreras: ${JSON.stringify(carreras_recomendadas || [])}

Responde SOLO con JSON válido:
{
  "resumen_perfil": "Frase corta (1-2 oraciones) que describe el perfil vocacional",
  "fortalezas": ["fortaleza 1", "fortaleza 2", "fortaleza 3", "fortaleza 4"],
  "top_carreras": ["Carrera 1", "Carrera 2", "Carrera 3"],
  "siguiente_paso": "Mensaje motivacional sobre el siguiente paso a seguir (2-3 oraciones)"
}`;

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
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    console.error('Claude API error for visual data:', response.status);
    return null;
  }

  const data = await response.json();
  const text = data.content[0].text;

  try {
    return JSON.parse(text);
  } catch (parseErr) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  }
}
