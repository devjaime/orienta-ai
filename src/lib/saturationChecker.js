/**
 * Utilidad para verificar saturación de carreras basado en proyecciones
 */

// Carreras conocidas con alta saturación (basado en análisis MINEDUC 2025)
const SATURATED_CAREERS = {
  // Crítica
  'Psicología': { level: 'crítica', matricula: 54890, crecimiento: -22.3 },
  'Derecho': { level: 'crítica', matricula: 48541, crecimiento: -18.4 },

  // Alta
  'Ingeniería Civil en Informática': { level: 'alta', matricula: 30086, crecimiento: 68.0, note: 'Alta demanda pero con saturación proyectada' },
  'Enfermería': { level: 'alta', matricula: 36736, crecimiento: 27.4 },
  'Ingeniería Comercial': { level: 'alta', matricula: 43793, crecimiento: 15.8 },
  'Periodismo': { level: 'media', matricula: 6117, note: 'Mercado competitivo' }
};

// Mapeo de códigos RIASEC a carreras típicas
const RIASEC_TO_CAREERS = {
  // Social-Investigativo-Artístico (ej: Psicología)
  'SIA': ['Psicología', 'Trabajo Social', 'Sociología'],
  'SAI': ['Psicología', 'Pedagogía'],
  'SIE': ['Trabajo Social', 'Sociología'],

  // Emprendedor (ej: Derecho, Negocios)
  'ESC': ['Derecho', 'Administración de Empresas', 'Ingeniería Comercial'],
  'ECS': ['Derecho', 'Contador Auditor'],
  'ESI': ['Ingeniería Comercial'],

  // Investigativo-Realista-Convencional (ej: Ingenierías)
  'IRC': ['Ingeniería Civil en Informática', 'Ingeniería Civil'],
  'IRS': ['Medicina', 'Enfermería'],
  'ISA': ['Medicina', 'Bioquímica'],
  'ISR': ['Enfermería', 'Kinesiología'],

  // Artístico
  'AIS': ['Periodismo', 'Diseño Gráfico'],
  'AIE': ['Publicidad', 'Periodismo'],
  'ASE': ['Diseño Gráfico', 'Arquitectura']
};

/**
 * Obtiene carreras típicas para un código RIASEC
 */
export function getTypicalCareersForCode(riasecCode) {
  if (!riasecCode || riasecCode.length !== 3) return [];

  // Buscar coincidencia exacta
  const exact = RIASEC_TO_CAREERS[riasecCode];
  if (exact) return exact;

  // Buscar por las dos primeras dimensiones
  const twoLetters = riasecCode.substring(0, 2);
  const matches = Object.keys(RIASEC_TO_CAREERS)
    .filter(key => key.startsWith(twoLetters))
    .flatMap(key => RIASEC_TO_CAREERS[key]);

  return [...new Set(matches)];
}

/**
 * Verifica si una carrera está saturada
 */
export function checkCareerSaturation(careerName) {
  const saturation = SATURATED_CAREERS[careerName];
  return saturation || null;
}

/**
 * Obtiene alertas de saturación para un código RIASEC
 */
export function getSaturationAlertsForCode(riasecCode) {
  const typicalCareers = getTypicalCareersForCode(riasecCode);

  const alerts = typicalCareers
    .map(career => {
      const saturation = checkCareerSaturation(career);
      if (!saturation) return null;

      return {
        career,
        level: saturation.level,
        matricula: saturation.matricula,
        crecimiento: saturation.crecimiento,
        note: saturation.note
      };
    })
    .filter(alert => alert !== null);

  return alerts;
}

/**
 * Genera mensaje de alerta personalizado
 */
export function generateSaturationMessage(alerts) {
  if (alerts.length === 0) {
    return {
      type: 'info',
      title: '✅ Buenas perspectivas',
      message: 'Las carreras típicas de tu perfil muestran oportunidades equilibradas en el mercado laboral.'
    };
  }

  const critical = alerts.filter(a => a.level === 'crítica');
  const high = alerts.filter(a => a.level === 'alta');

  if (critical.length > 0) {
    const careerNames = critical.map(a => a.career).join(', ');
    return {
      type: 'critical',
      title: '⚠️ Alta Saturación Detectada',
      message: `Las siguientes carreras muestran saturación crítica: ${careerNames}. Considera especializaciones de nicho, áreas emergentes o campos relacionados con mejor proyección.`,
      careers: critical
    };
  }

  if (high.length > 0) {
    const careerNames = high.map(a => a.career).join(', ');
    return {
      type: 'warning',
      title: '⚡ Saturación Moderada',
      message: `${careerNames} presenta saturación moderada. Para destacar, será importante obtener postgrados, certificaciones especializadas o experiencia práctica durante la carrera.`,
      careers: high
    };
  }

  return {
    type: 'info',
    title: 'ℹ️ Mercado Equilibrado',
    message: 'Las carreras de tu perfil muestran perspectivas equilibradas.',
    careers: alerts
  };
}

/**
 * Verifica saturación en tiempo real durante el test
 * Retorna alerta si el perfil parcial indica carreras saturadas
 */
export function checkPartialTestSaturation(partialScores) {
  // Calcular código RIASEC parcial basado en puntajes actuales
  const dimensions = ['R', 'I', 'A', 'S', 'E', 'C'];
  const sorted = dimensions
    .map(dim => ({
      dim,
      score: partialScores[dim] || 0
    }))
    .sort((a, b) => b.score - a.score);

  // Generar código parcial con top 3
  const partialCode = sorted.slice(0, 3).map(d => d.dim).join('');

  // Verificar alertas
  const alerts = getSaturationAlertsForCode(partialCode);

  if (alerts.length > 0) {
    return {
      show: true,
      code: partialCode,
      alerts,
      message: generateSaturationMessage(alerts)
    };
  }

  return {
    show: false,
    code: partialCode,
    alerts: [],
    message: null
  };
}
