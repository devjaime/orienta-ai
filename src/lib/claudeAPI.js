/**
 * Cliente para la función Netlify que conecta con Claude API
 * Wrapper para facilitar el uso desde el frontend
 */

const NETLIFY_FUNCTION_URL = '/.netlify/functions/generate-explanation';

/**
 * Genera explicación personalizada del perfil RIASEC
 * @param {Object} resultadoTest - Resultado completo del test
 * @returns {Promise<String>} - Explicación generada por Claude
 */
export async function generarExplicacionIA(resultadoTest) {
  const { codigo_holland, certeza, puntajes, ranking_completo } = resultadoTest;

  try {
    const response = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo_holland,
        certeza,
        puntajes,
        ranking_completo,
        tipo: 'explicacion'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al generar explicación');
    }

    const data = await response.json();
    return data.explicacion;

  } catch (err) {
    console.error('Error generando explicación IA:', err);
    throw err;
  }
}

/**
 * Inicia conversación con Claude sobre orientación vocacional
 * @param {Object} context - Contexto del estudiante (perfil RIASEC)
 * @param {String} pregunta - Pregunta del usuario
 * @returns {Promise<String>} - Respuesta de Claude
 */
export async function conversarConIA(context, pregunta) {
  try {
    const response = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo_holland: context.codigo_holland,
        certeza: context.certeza,
        puntajes: context.puntajes,
        ranking_completo: context.ranking_completo,
        tipo: 'conversacion',
        pregunta
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la conversación');
    }

    const data = await response.json();
    return data.explicacion;

  } catch (err) {
    console.error('Error en conversación IA:', err);
    throw err;
  }
}

/**
 * Verifica si Claude API está configurada
 */
export async function verificarClaudeAPI() {
  try {
    const response = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo_holland: 'TEST',
        puntajes: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
        tipo: 'test'
      })
    });

    // Si retorna 500 con mensaje de API key, está mal configurada
    if (response.status === 500) {
      const error = await response.json();
      if (error.error?.includes('API Key')) {
        return { configurada: false, mensaje: 'API Key no configurada' };
      }
    }

    return { configurada: true };

  } catch (err) {
    return { configurada: false, mensaje: err.message };
  }
}
