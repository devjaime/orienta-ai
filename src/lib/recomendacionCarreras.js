import carrerasData from '../data/carreras.json';
import { calcularCompatibilidad } from './riasecScoring';

/**
 * Motor de Recomendación de Carreras
 * Matchea el perfil RIASEC del usuario con 30 carreras
 * Retorna top 6 carreras más compatibles
 */

/**
 * Obtiene todas las carreras
 */
export function getAllCarreras() {
  return carrerasData.carreras || [];
}

/**
 * Obtiene carreras por área
 * @param {String} area - "Tecnología", "Salud", etc.
 */
export function getCarrerasPorArea(area) {
  const carreras = getAllCarreras();
  return carreras.filter(c => c.area === area);
}

/**
 * Obtiene áreas únicas
 */
export function getAreas() {
  return carrerasData.metadata?.areas || [];
}

/**
 * MOTOR DE RECOMENDACIÓN PRINCIPAL
 * @param {String} codigoUsuario - "ISA", "ECS", etc.
 * @param {Object} options - Filtros opcionales
 * @returns {Array} - Top 6 carreras con score de compatibilidad
 */
export function recomendarCarreras(codigoUsuario, options = {}) {
  const {
    topN = 6,
    minScore = 0,
    areas = null, // Filtro por áreas específicas
    duracionMax = null, // Filtro por duración máxima
    empleabilidadMin = null, // Filtro por empleabilidad mínima
    salarioMin = null // Filtro por salario mínimo
  } = options;

  let carreras = getAllCarreras();

  // Aplicar filtros
  if (areas && areas.length > 0) {
    carreras = carreras.filter(c => areas.includes(c.area));
  }

  if (duracionMax) {
    carreras = carreras.filter(c => c.duracion_anos <= duracionMax);
  }

  if (empleabilidadMin) {
    const empleabilidadOrder = ['Baja', 'Media', 'Alta', 'Muy Alta'];
    const minIndex = empleabilidadOrder.indexOf(empleabilidadMin);
    carreras = carreras.filter(c => {
      const carreraIndex = empleabilidadOrder.indexOf(c.empleabilidad);
      return carreraIndex >= minIndex;
    });
  }

  if (salarioMin) {
    carreras = carreras.filter(c => c.salario_promedio_chile_clp >= salarioMin);
  }

  // Calcular compatibilidad para cada carrera
  const carrerasConScore = carreras.map(carrera => {
    const score = calcularCompatibilidad(codigoUsuario, carrera.codigo_holland);
    return {
      ...carrera,
      compatibilidad_score: score,
      compatibilidad_porcentaje: score,
      match_explicacion: getMatchExplicacion(codigoUsuario, carrera.codigo_holland, score)
    };
  });

  // Filtrar por score mínimo
  const carrerasFiltradas = carrerasConScore.filter(c => c.compatibilidad_score >= minScore);

  // Ordenar por compatibilidad (mayor a menor)
  carrerasFiltradas.sort((a, b) => b.compatibilidad_score - a.compatibilidad_score);

  // Retornar top N
  return carrerasFiltradas.slice(0, topN);
}

/**
 * Genera explicación del match entre usuario y carrera
 */
function getMatchExplicacion(codigoUsuario, codigoCarrera, score) {
  const user = codigoUsuario.split('');
  const career = codigoCarrera.split('');

  const dimensionNames = {
    R: 'Realista',
    I: 'Investigador',
    A: 'Artístico',
    S: 'Social',
    E: 'Emprendedor',
    C: 'Convencional'
  };

  const coincidencias = [];

  if (user[0] === career[0]) {
    coincidencias.push(`Ambos priorizan el perfil ${dimensionNames[user[0]]}`);
  }

  if (user[1] === career[1]) {
    coincidencias.push(`Coinciden en el segundo lugar: ${dimensionNames[user[1]]}`);
  }

  if (user[2] === career[2]) {
    coincidencias.push(`Coinciden en el tercer lugar: ${dimensionNames[user[2]]}`);
  }

  // Buscar coincidencias en posiciones diferentes
  user.forEach((letra, idx) => {
    const careerIdx = career.indexOf(letra);
    if (careerIdx !== -1 && careerIdx !== idx) {
      coincidencias.push(`Comparten interés ${dimensionNames[letra]}`);
    }
  });

  if (coincidencias.length === 0) {
    return 'Perfiles complementarios que pueden ofrecer una experiencia vocacional diversa.';
  }

  return coincidencias.join('. ');
}

/**
 * Obtiene estadísticas de las recomendaciones
 */
export function getEstadisticasRecomendaciones(recomendaciones) {
  if (!recomendaciones || recomendaciones.length === 0) {
    return null;
  }

  const areas = [...new Set(recomendaciones.map(r => r.area))];
  const scorePromedio = recomendaciones.reduce((sum, r) => sum + r.compatibilidad_score, 0) / recomendaciones.length;
  const mejorMatch = recomendaciones[0];

  return {
    total_carreras: recomendaciones.length,
    areas_representadas: areas,
    score_promedio: Math.round(scorePromedio),
    mejor_match: {
      nombre: mejorMatch.nombre,
      score: mejorMatch.compatibilidad_score
    },
    empleabilidad_promedio: calcularEmpleabilidadPromedio(recomendaciones),
    salario_promedio: Math.round(
      recomendaciones.reduce((sum, r) => sum + r.salario_promedio_chile_clp, 0) / recomendaciones.length
    )
  };
}

/**
 * Calcula empleabilidad promedio
 */
function calcularEmpleabilidadPromedio(recomendaciones) {
  const empleabilidadValues = {
    'Baja': 1,
    'Media': 2,
    'Alta': 3,
    'Muy Alta': 4
  };

  const empleabilidadNames = ['Baja', 'Media', 'Alta', 'Muy Alta'];

  const promedio = recomendaciones.reduce((sum, r) => {
    return sum + (empleabilidadValues[r.empleabilidad] || 0);
  }, 0) / recomendaciones.length;

  const index = Math.round(promedio) - 1;
  return empleabilidadNames[Math.max(0, Math.min(3, index))];
}

/**
 * Busca carreras por nombre (para autocompletado)
 */
export function buscarCarrerasPorNombre(query) {
  const carreras = getAllCarreras();
  const queryLower = query.toLowerCase();

  return carreras
    .filter(c => c.nombre.toLowerCase().includes(queryLower))
    .slice(0, 10); // Máximo 10 resultados
}

/**
 * Obtiene una carrera por ID
 */
export function getCarreraPorId(id) {
  const carreras = getAllCarreras();
  return carreras.find(c => c.id === parseInt(id));
}

/**
 * Genera reporte de compatibilidad detallado
 */
export function generarReporteCompatibilidad(codigoUsuario, carreraId) {
  const carrera = getCarreraPorId(carreraId);

  if (!carrera) {
    return null;
  }

  const score = calcularCompatibilidad(codigoUsuario, carrera.codigo_holland);
  const explicacion = getMatchExplicacion(codigoUsuario, carrera.codigo_holland, score);

  return {
    carrera,
    compatibilidad: {
      score,
      porcentaje: score,
      nivel: score >= 75 ? 'Excelente' : score >= 60 ? 'Muy buena' : score >= 40 ? 'Buena' : 'Moderada',
      explicacion
    },
    perfil_usuario: codigoUsuario,
    perfil_carrera: carrera.codigo_holland,
    coincidencias: analizarCoincidencias(codigoUsuario, carrera.codigo_holland),
    diferencias: analizarDiferencias(codigoUsuario, carrera.codigo_holland)
  };
}

/**
 * Analiza coincidencias letra por letra
 */
function analizarCoincidencias(user, career) {
  const userArr = user.split('');
  const careerArr = career.split('');

  const dimensionNames = {
    R: 'Realista',
    I: 'Investigador',
    A: 'Artístico',
    S: 'Social',
    E: 'Emprendedor',
    C: 'Convencional'
  };

  const coincidencias = [];

  userArr.forEach((letra, idx) => {
    if (careerArr[idx] === letra) {
      coincidencias.push({
        dimension: letra,
        nombre: dimensionNames[letra],
        posicion: idx + 1,
        tipo: 'exacta'
      });
    } else if (careerArr.includes(letra)) {
      coincidencias.push({
        dimension: letra,
        nombre: dimensionNames[letra],
        posicion_usuario: idx + 1,
        posicion_carrera: careerArr.indexOf(letra) + 1,
        tipo: 'presente'
      });
    }
  });

  return coincidencias;
}

/**
 * Analiza diferencias entre perfiles
 */
function analizarDiferencias(user, career) {
  const userArr = user.split('');
  const careerArr = career.split('');

  const dimensionNames = {
    R: 'Realista',
    I: 'Investigador',
    A: 'Artístico',
    S: 'Social',
    E: 'Emprendedor',
    C: 'Convencional'
  };

  const diferencias = {
    solo_usuario: [],
    solo_carrera: []
  };

  userArr.forEach(letra => {
    if (!careerArr.includes(letra)) {
      diferencias.solo_usuario.push({
        dimension: letra,
        nombre: dimensionNames[letra]
      });
    }
  });

  careerArr.forEach(letra => {
    if (!userArr.includes(letra)) {
      diferencias.solo_carrera.push({
        dimension: letra,
        nombre: dimensionNames[letra]
      });
    }
  });

  return diferencias;
}
