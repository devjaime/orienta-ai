/**
 * Gestor de datos históricos de matrícula MINEDUC
 *
 * Este módulo maneja la carga y procesamiento de datos de múltiples años
 * Actualmente tenemos datos de 2025, pero está preparado para agregar años anteriores
 */

// Configuración de años disponibles
const AVAILABLE_YEARS = {
  2025: {
    file: '/data/processed/matricula-agregado.json',
    processed: true,
    description: 'Datos MINEDUC 2025 - Base actual'
  }
  // Aquí se pueden agregar años adicionales en el futuro:
  // 2024: {
  //   file: '/data/processed/matricula-2024.json',
  //   processed: false,
  //   description: 'Datos MINEDUC 2024'
  // },
  // 2023: {
  //   file: '/data/processed/matricula-2023.json',
  //   processed: false,
  //   description: 'Datos MINEDUC 2023'
  // }
};

/**
 * Obtiene lista de años disponibles
 */
export function getAvailableYears() {
  return Object.keys(AVAILABLE_YEARS).map(Number).sort((a, b) => b - a);
}

/**
 * Verifica si hay datos históricos (más de un año)
 */
export function hasHistoricalData() {
  return getAvailableYears().length > 1;
}

/**
 * Carga datos de un año específico
 */
export async function loadYearData(year) {
  const yearConfig = AVAILABLE_YEARS[year];

  if (!yearConfig) {
    throw new Error(`No hay datos disponibles para el año ${year}`);
  }

  try {
    const response = await fetch(yearConfig.file);
    if (!response.ok) {
      throw new Error(`Error cargando datos del año ${year}`);
    }

    const data = await response.json();
    return {
      year,
      data: data.carreras || data,
      metadata: {
        total_carreras: data.total_carreras || Object.keys(data.carreras || data).length,
        total_estudiantes: data.total_estudiantes || 0,
        generado: data.generado,
        fuente: data.fuente
      }
    };
  } catch (error) {
    console.error(`Error cargando año ${year}:`, error);
    return null;
  }
}

/**
 * Carga datos de todos los años disponibles
 */
export async function loadAllHistoricalData() {
  const years = getAvailableYears();
  const promises = years.map(year => loadYearData(year));

  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}

/**
 * Construye serie temporal para una carrera específica
 */
export function buildCareerTimeSeries(careerName, historicalData) {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return null;
  }

  const timeSeries = historicalData.map(yearData => {
    const careerData = yearData.data[careerName] || yearData.data[normalizeCareerName(careerName)];

    return {
      year: yearData.year,
      matricula: careerData?.matricula_total || careerData?.matricula_actual || 0,
      instituciones: careerData?.instituciones_count || 0,
      titulados: careerData?.titulados_total || null
    };
  }).sort((a, b) => a.year - b.year);

  // Calcular tasa de crecimiento anual
  for (let i = 1; i < timeSeries.length; i++) {
    const prev = timeSeries[i - 1].matricula;
    const curr = timeSeries[i].matricula;

    if (prev > 0) {
      timeSeries[i].growth_rate = ((curr - prev) / prev * 100).toFixed(1);
    }
  }

  return timeSeries;
}

/**
 * Normaliza nombre de carrera para búsqueda
 */
function normalizeCareerName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Calcula estadísticas comparativas entre años
 */
export function calculateYearComparison(careerName, historicalData) {
  const timeSeries = buildCareerTimeSeries(careerName, historicalData);

  if (!timeSeries || timeSeries.length < 2) {
    return {
      available: false,
      message: 'Se necesitan datos de al menos 2 años para comparar'
    };
  }

  const firstYear = timeSeries[0];
  const lastYear = timeSeries[timeSeries.length - 1];

  const totalGrowth = ((lastYear.matricula - firstYear.matricula) / firstYear.matricula * 100);
  const yearsSpan = lastYear.year - firstYear.year;
  const avgAnnualGrowth = totalGrowth / yearsSpan;

  // Detectar tendencia
  let trend = 'estable';
  if (avgAnnualGrowth > 5) trend = 'creciente';
  else if (avgAnnualGrowth < -5) trend = 'decreciente';

  // Detectar volatilidad
  const growthRates = timeSeries
    .filter(t => t.growth_rate !== undefined)
    .map(t => parseFloat(t.growth_rate));

  const volatility = growthRates.length > 0
    ? Math.sqrt(growthRates.reduce((sum, rate) => sum + Math.pow(rate, 2), 0) / growthRates.length)
    : 0;

  let volatilityLevel = 'baja';
  if (volatility > 15) volatilityLevel = 'alta';
  else if (volatility > 8) volatilityLevel = 'media';

  return {
    available: true,
    timeSeries,
    stats: {
      firstYear: firstYear.year,
      lastYear: lastYear.year,
      yearsSpan,
      initialMatricula: firstYear.matricula,
      currentMatricula: lastYear.matricula,
      totalGrowth: totalGrowth.toFixed(1) + '%',
      avgAnnualGrowth: avgAnnualGrowth.toFixed(1) + '%',
      trend,
      volatility: volatility.toFixed(1),
      volatilityLevel
    }
  };
}

/**
 * Genera gráfico de datos históricos para Recharts
 */
export function prepareHistoricalChartData(careerName, historicalData) {
  const timeSeries = buildCareerTimeSeries(careerName, historicalData);

  if (!timeSeries) {
    return [];
  }

  return timeSeries.map(point => ({
    año: point.year,
    Matrícula: point.matricula,
    Instituciones: point.instituciones,
    Titulados: point.titulados
  }));
}

/**
 * Obtiene carreras con mayor cambio en el período
 */
export function getTopChangingCareers(historicalData, limit = 10) {
  if (!historicalData || historicalData.length < 2) {
    return [];
  }

  const firstYearData = historicalData[0].data;
  const lastYearData = historicalData[historicalData.length - 1].data;

  const changes = [];

  Object.keys(firstYearData).forEach(careerKey => {
    const firstYear = firstYearData[careerKey];
    const lastYear = lastYearData[careerKey];

    if (firstYear && lastYear) {
      const matriculaFirst = firstYear.matricula_total || firstYear.matricula_actual || 0;
      const matriculaLast = lastYear.matricula_total || lastYear.matricula_actual || 0;

      if (matriculaFirst > 0) {
        const percentChange = ((matriculaLast - matriculaFirst) / matriculaFirst) * 100;

        changes.push({
          career: firstYear.nombre_original || careerKey,
          firstYearMatricula: matriculaFirst,
          lastYearMatricula: matriculaLast,
          absoluteChange: matriculaLast - matriculaFirst,
          percentChange: percentChange.toFixed(1)
        });
      }
    }
  });

  // Top crecimiento
  const topGrowing = [...changes]
    .sort((a, b) => parseFloat(b.percentChange) - parseFloat(a.percentChange))
    .slice(0, limit);

  // Top decrecimiento
  const topDeclining = [...changes]
    .sort((a, b) => parseFloat(a.percentChange) - parseFloat(b.percentChange))
    .slice(0, limit);

  return {
    growing: topGrowing,
    declining: topDeclining
  };
}

/**
 * Placeholder para futura funcionalidad: predicción basada en histórico
 */
export function predictFutureTrend(careerName, historicalData, yearsAhead = 5) {
  // TODO: Implementar cuando tengamos múltiples años de datos
  // Por ahora, usar las proyecciones existentes del modelo

  return {
    available: false,
    message: 'Predicción basada en histórico disponible cuando tengamos datos de 3+ años'
  };
}
