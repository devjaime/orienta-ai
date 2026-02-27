/**
 * Servicio Vocari IA con OpenRouter
 * 
 * Este servicio genera el análisis vocacional avanzado usando modelos 
 * de última generación (Gemini 2.0 Flash) vía OpenRouter API.
 */

import { supabase } from './supabase';

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Genera el análisis IA basado en el test RIASEC y data del MINEDUC
 * @param {Object} userData - Datos del estudiante
 * @param {Object} testResults - Puntajes RIASEC (R, I, A, S, E, C)
 * @param {Array} carrerasMineduc - Lista de carreras con empleabilidad e ingresos
 * @returns {Promise<string>} Análisis TXT/Markdown para el PDF
 */
export async function generateAIVocationalAnalysis(userData, testResults, carrerasMineduc) {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn('API Key de OpenRouter no encontrada. Usando modo offline.');
      return 'Análisis IA temporalmente no disponible.';
    }

    // El prompt maestro que "vende" el valor de la plataforma
    const prompt = `
      Eres un Orientador Vocacional Experto en el mercado laboral chileno. 
      Analiza los resultados del Test RIASEC de ${userData.nombre} y crucémoslo con 
      la oferta académica real de Chile según datos del MINEDUC.

      RESULTADOS RIASEC:
      - Realista: ${testResults.R}
      - Investigador: ${testResults.I}
      - Artístico: ${testResults.A}
      - Social: ${testResults.S}
      - Emprendedor: ${testResults.E}
      - Convencional: ${testResults.C}

      CARRERAS SUGERIDAS (MINEDUC):
      ${carrerasMineduc.map(c => `- ${c.nombre}: Empleabilidad ${c.empleabilidad_1_año}%, Ingreso 4to año: $${c.ingreso_4to_año}`).join('\n')}

      INSTRUCCIONES:
      1. Explica qué significa su perfil Holland predominante.
      2. Justifica por qué las carreras sugeridas encajan con su personalidad.
      3. Analiza el mercado laboral chileno para estas opciones (empleabilidad e ingresos).
      4. Da 3 consejos prácticos para elegir entre estas opciones.
      5. Sé motivador, profesional y empático.
      
      Escribe en formato Markdown enfocado en un joven de 4to medio.
    `;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vocari.cl',
        'X-Title': 'Vocari.cl - AI Vocational Assistant',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error('Error en la comunicación con OpenRouter.');
    }

    const data = await response.json();
    const analysisMarkdown = data.choices[0].message.content;

    // Guardar el análisis en la tabla de reportes
    await supabase
      .from('reports')
      .update({ ai_analysis: analysisMarkdown })
      .eq('user_id', userData.id);

    return analysisMarkdown;

  } catch (error) {
    console.error('Error generando análisis IA:', error);
    return 'Lo sentimos, hubo un error al generar tu análisis personalizado. Reintenta en unos minutos o contacta a hola@vocari.cl';
  }
}
