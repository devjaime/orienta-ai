/**
 * Algoritmo de Scoring Holland RIASEC
 * Sistema de desempate: suma total → intensidad alta → bajo rechazo → alfabético
 * Cálculo de nivel de certeza
 */

/**
 * Calcula puntajes por dimensión
 * @param {Object} responses - {1: 4, 2: 5, 3: 3, ...} (pregunta_id: respuesta)
 * @returns {Object} - {R: 23, I: 28, A: 22, S: 25, E: 15, C: 12}
 */
export function calcularPuntajesPorDimension(responses) {
  const puntajes = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // Mapeo de preguntas a dimensiones (6 preguntas por dimensión)
  const dimensionMap = {
    1: 'R', 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R',
    7: 'I', 8: 'I', 9: 'I', 10: 'I', 11: 'I', 12: 'I',
    13: 'A', 14: 'A', 15: 'A', 16: 'A', 17: 'A', 18: 'A',
    19: 'S', 20: 'S', 21: 'S', 22: 'S', 23: 'S', 24: 'S',
    25: 'E', 26: 'E', 27: 'E', 28: 'E', 29: 'E', 30: 'E',
    31: 'C', 32: 'C', 33: 'C', 34: 'C', 35: 'C', 36: 'C'
  };

  Object.entries(responses).forEach(([preguntaId, respuesta]) => {
    const dimension = dimensionMap[parseInt(preguntaId)];
    if (dimension && respuesta >= 1 && respuesta <= 5) {
      puntajes[dimension] += respuesta;
    }
  });

  return puntajes;
}

/**
 * Ordena dimensiones por puntaje (mayor a menor)
 * @param {Object} puntajes - {R: 23, I: 28, ...}
 * @returns {Array} - [["I", 28], ["S", 25], ...]
 */
function ordenarPorPuntaje(puntajes) {
  return Object.entries(puntajes)
    .sort((a, b) => {
      // Primero por puntaje (mayor a menor)
      if (b[1] !== a[1]) return b[1] - a[1];
      // Si hay empate, orden alfabético
      return a[0].localeCompare(b[0]);
    });
}

/**
 * Cuenta intensidad alta (respuestas 4-5) por dimensión
 * @param {Object} responses - Respuestas del test
 * @returns {Object} - {R: 3, I: 5, ...}
 */
function contarIntensidadAlta(responses) {
  const intensidad = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  const dimensionMap = {
    1: 'R', 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R',
    7: 'I', 8: 'I', 9: 'I', 10: 'I', 11: 'I', 12: 'I',
    13: 'A', 14: 'A', 15: 'A', 16: 'A', 17: 'A', 18: 'A',
    19: 'S', 20: 'S', 21: 'S', 22: 'S', 23: 'S', 24: 'S',
    25: 'E', 26: 'E', 27: 'E', 28: 'E', 29: 'E', 30: 'E',
    31: 'C', 32: 'C', 33: 'C', 34: 'C', 35: 'C', 36: 'C'
  };

  Object.entries(responses).forEach(([preguntaId, respuesta]) => {
    const dimension = dimensionMap[parseInt(preguntaId)];
    if (dimension && respuesta >= 4) {
      intensidad[dimension]++;
    }
  });

  return intensidad;
}

/**
 * Cuenta rechazo bajo (respuestas 1-2) por dimensión
 * @param {Object} responses - Respuestas del test
 * @returns {Object} - {R: 1, I: 0, ...}
 */
function contarRechazo(responses) {
  const rechazo = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  const dimensionMap = {
    1: 'R', 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R',
    7: 'I', 8: 'I', 9: 'I', 10: 'I', 11: 'I', 12: 'I',
    13: 'A', 14: 'A', 15: 'A', 16: 'A', 17: 'A', 18: 'A',
    19: 'S', 20: 'S', 21: 'S', 22: 'S', 23: 'S', 24: 'S',
    25: 'E', 26: 'E', 27: 'E', 28: 'E', 29: 'E', 30: 'E',
    31: 'C', 32: 'C', 33: 'C', 34: 'C', 35: 'C', 36: 'C'
  };

  Object.entries(responses).forEach(([preguntaId, respuesta]) => {
    const dimension = dimensionMap[parseInt(preguntaId)];
    if (dimension && respuesta <= 2) {
      rechazo[dimension]++;
    }
  });

  return rechazo;
}

/**
 * Aplica sistema de desempate completo
 * @param {Array} ranking - Ranking inicial por puntaje
 * @param {Object} intensidad - Conteo de intensidad alta
 * @param {Object} rechazo - Conteo de rechazo
 * @returns {Array} - Ranking final después de desempatar
 */
function aplicarDesempate(ranking, intensidad, rechazo) {
  // Agrupar dimensiones con el mismo puntaje
  const grupos = [];
  let i = 0;

  while (i < ranking.length) {
    const puntajeActual = ranking[i][1];
    const grupoEmpate = [ranking[i]];

    let j = i + 1;
    while (j < ranking.length && ranking[j][1] === puntajeActual) {
      grupoEmpate.push(ranking[j]);
      j++;
    }

    if (grupoEmpate.length > 1) {
      // Hay empate, desempatar por intensidad
      grupoEmpate.sort((a, b) => {
        const intensidadA = intensidad[a[0]];
        const intensidadB = intensidad[b[0]];

        if (intensidadB !== intensidadA) {
          return intensidadB - intensidadA; // Mayor intensidad primero
        }

        // Si aún empata, desempatar por menor rechazo
        const rechazoA = rechazo[a[0]];
        const rechazoB = rechazo[b[0]];

        if (rechazoA !== rechazoB) {
          return rechazoA - rechazoB; // Menor rechazo primero
        }

        // Si aún empata, orden alfabético
        return a[0].localeCompare(b[0]);
      });
    }

    grupos.push(...grupoEmpate);
    i = j;
  }

  return grupos;
}

/**
 * Calcula nivel de certeza basado en diferencias entre dimensiones
 * @param {Array} ranking - Ranking final
 * @returns {String} - "Exploratoria" | "Media" | "Alta"
 */
function calcularNivelCerteza(ranking) {
  if (ranking.length < 4) return 'Exploratoria';

  const diff1a2 = ranking[0][1] - ranking[1][1];
  const diff2a3 = ranking[1][1] - ranking[2][1];
  const diff3a4 = ranking[2][1] - ranking[3][1];

  const diferenciaPromedio = (diff1a2 + diff2a3 + diff3a4) / 3;

  // Criterios de certeza
  if (diferenciaPromedio >= 4) return 'Alta';
  if (diferenciaPromedio >= 2) return 'Media';
  return 'Exploratoria';
}

/**
 * ALGORITMO PRINCIPAL: Calcula código RIASEC completo
 * @param {Object} responses - {1: 4, 2: 5, ...}
 * @returns {Object} - Resultado completo del test
 */
export function calcularCodigoRIASEC(responses) {
  // Validar respuestas
  if (!responses || Object.keys(responses).length < 36) {
    throw new Error('Debe responder las 36 preguntas del test');
  }

  // 1. Calcular puntajes por dimensión
  const puntajes = calcularPuntajesPorDimension(responses);

  // 2. Ordenar por puntaje total
  let ranking = ordenarPorPuntaje(puntajes);

  // 3. Calcular intensidad y rechazo para desempate
  const intensidad = contarIntensidadAlta(responses);
  const rechazo = contarRechazo(responses);

  // 4. Aplicar sistema de desempate completo
  ranking = aplicarDesempate(ranking, intensidad, rechazo);

  // 5. Generar código Holland (top 3 letras)
  const codigo = ranking.slice(0, 3).map(r => r[0]).join('');

  // 6. Calcular nivel de certeza
  const certeza = calcularNivelCerteza(ranking);

  // 7. Retornar resultado completo
  return {
    codigo_holland: codigo,
    certeza,
    puntajes,
    ranking_completo: ranking.map(r => ({
      dimension: r[0],
      puntaje: r[1]
    })),
    estadisticas: {
      intensidad_alta: intensidad,
      rechazo: rechazo,
      dimension_dominante: ranking[0][0],
      puntaje_maximo: ranking[0][1],
      puntaje_minimo: ranking[5][1],
      rango: ranking[0][1] - ranking[5][1]
    }
  };
}

/**
 * Genera resumen interpretativo del perfil
 * @param {Object} resultado - Resultado del calcularCodigoRIASEC
 * @returns {Object} - Interpretación del perfil
 */
export function generarInterpretacion(resultado) {
  const { codigo_holland, certeza, ranking_completo } = resultado;

  const dimensionNames = {
    R: 'Realista',
    I: 'Investigador',
    A: 'Artístico',
    S: 'Social',
    E: 'Emprendedor',
    C: 'Convencional'
  };

  const top3 = ranking_completo.slice(0, 3);

  return {
    codigo: codigo_holland,
    certeza,
    perfil: `${dimensionNames[top3[0].dimension]}-${dimensionNames[top3[1].dimension]}-${dimensionNames[top3[2].dimension]}`,
    dimensiones_principales: top3.map(d => ({
      letra: d.dimension,
      nombre: dimensionNames[d.dimension],
      puntaje: d.puntaje,
      porcentaje: Math.round((d.puntaje / 30) * 100) // Máximo 30 (6 preguntas x 5)
    })),
    mensaje_certeza: getCertezaMessage(certeza),
    fortalezas: top3.slice(0, 2).map(d => dimensionNames[d.dimension]),
    dimensiones_secundarias: ranking_completo.slice(3).map(d => dimensionNames[d.dimension])
  };
}

/**
 * Mensaje según nivel de certeza
 */
function getCertezaMessage(certeza) {
  const messages = {
    'Alta': 'Tu perfil muestra una orientación vocacional clara y definida. Las dimensiones principales se destacan significativamente.',
    'Media': 'Tu perfil muestra tendencias claras, aunque algunas dimensiones tienen puntajes similares. Esto es normal y refleja versatilidad.',
    'Exploratoria': 'Tu perfil muestra intereses variados sin una orientación única dominante. Esto sugiere flexibilidad y múltiples opciones vocacionales.'
  };

  return messages[certeza] || messages['Media'];
}

/**
 * Calcula compatibilidad entre perfil del usuario y perfil de una carrera
 * @param {String} codigoUsuario - "ISA"
 * @param {String} codigoCarrera - "SIA"
 * @returns {Number} - Score de 0-100
 */
export function calcularCompatibilidad(codigoUsuario, codigoCarrera) {
  if (!codigoUsuario || !codigoCarrera) return 0;

  const user = codigoUsuario.toUpperCase().split('');
  const career = codigoCarrera.toUpperCase().split('');

  let score = 0;

  // Coincidencia exacta en posición: +40 puntos
  if (user[0] === career[0]) score += 40;
  if (user[1] === career[1]) score += 25;
  if (user[2] === career[2]) score += 15;

  // Coincidencia en cualquier posición: +10 puntos adicionales por letra
  user.forEach(letra => {
    if (career.includes(letra) && user.indexOf(letra) !== career.indexOf(letra)) {
      score += 10;
    }
  });

  return Math.min(score, 100); // Máximo 100
}
