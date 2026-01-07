/**
 * Script para proyectar demanda y salarios a 5 años
 *
 * Entrada: data/processed/trends-analysis.json
 * Salida: data/processed/future-projections.json
 *
 * Metodologías:
 * - Regresión lineal para tendencias estables
 * - Media móvil exponencial para suavizar volatilidad
 * - Factores de corrección por saturación
 *
 * Ejecutar: node scripts/07-project-future.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRENDS_FILE = path.join(__dirname, '../data/processed/trends-analysis.json');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/future-projections.json');

// Años a proyectar
const CURRENT_YEAR = 2025;
const PROJECTION_YEARS = 5;
const TARGET_YEAR = CURRENT_YEAR + PROJECTION_YEARS; // 2030

/**
 * Proyección con regresión lineal
 */
function projectLinear(regression, year) {
  return regression.pendiente * year + parseFloat(regression.intercepto);
}

/**
 * Media móvil exponencial
 */
function exponentialMovingAverage(values, alpha = 0.3) {
  const ema = [values[0]];

  for (let i = 1; i < values.length; i++) {
    ema[i] = alpha * values[i] + (1 - alpha) * ema[i - 1];
  }

  return ema;
}

/**
 * Proyección con EMA
 */
function projectEMA(dataPoints, yearsAhead, alpha = 0.3) {
  const values = dataPoints.map(p => p.value);
  const ema = exponentialMovingAverage(values, alpha);

  // Calcular tasa de crecimiento promedio reciente (últimos 3 años)
  const recentEMA = ema.slice(-3);
  const avgGrowth = (recentEMA[recentEMA.length - 1] - recentEMA[0]) / recentEMA.length;

  // Proyectar
  const projections = [];
  let lastValue = ema[ema.length - 1];

  for (let i = 1; i <= yearsAhead; i++) {
    lastValue += avgGrowth;
    projections.push(Math.round(lastValue));
  }

  return projections;
}

/**
 * Calcula nivel de confianza basado en R² y volatilidad
 */
function calculateConfidence(r2, volatilidad, yearsAhead) {
  let confidence = parseFloat(r2);

  // Penalizar por volatilidad
  if (volatilidad === 'alta') confidence *= 0.7;
  if (volatilidad === 'media') confidence *= 0.85;

  // Decrecer confianza con años hacia adelante
  confidence *= Math.pow(0.95, yearsAhead - 1);

  return Math.max(0.5, Math.min(0.99, confidence));
}

/**
 * Ajusta proyección por factores externos
 */
function applyExternalFactors(baseProjection, carrera, year) {
  let adjusted = baseProjection;

  // Factores de corrección específicos por tipo de carrera
  // (Estos deberían venir de investigación real)

  const techCareers = ['informática', 'computación', 'data', 'ia', 'software'];
  const healthCareers = ['medicina', 'enfermería', 'salud', 'kinesiología'];
  const saturatedCareers = ['psicología', 'derecho', 'periodismo'];

  const carreraLower = carrera.toLowerCase();

  // Tech: Crecimiento acelerado
  if (techCareers.some(term => carreraLower.includes(term))) {
    adjusted *= 1 + (0.08 * (year - CURRENT_YEAR)); // +8% anual adicional
  }

  // Salud: Crecimiento moderado por envejecimiento poblacional
  if (healthCareers.some(term => carreraLower.includes(term))) {
    adjusted *= 1 + (0.04 * (year - CURRENT_YEAR)); // +4% anual adicional
  }

  // Saturadas: Desaceleración
  if (saturatedCareers.some(term => carreraLower.includes(term))) {
    adjusted *= 1 - (0.02 * (year - CURRENT_YEAR)); // -2% anual
  }

  return Math.round(adjusted);
}

/**
 * Genera proyecciones para una carrera
 */
function generateProjections(carrera, analisis) {
  const { regresion, valores, r_cuadrado, volatilidad, datos_historicos } = analisis;

  const projections = {};

  for (let year = CURRENT_YEAR + 1; year <= TARGET_YEAR; year++) {
    const yearsAhead = year - CURRENT_YEAR;

    // Proyección base con regresión lineal
    let baseProjection = projectLinear(regresion, year);

    // Ajustar por factores externos
    const adjusted = applyExternalFactors(baseProjection, carrera, year);

    // Calcular confianza
    const confidence = calculateConfidence(r_cuadrado, volatilidad, yearsAhead);

    // Rango de error (±10% en el peor caso)
    const errorMargin = adjusted * (0.05 + (0.05 * yearsAhead / PROJECTION_YEARS));

    projections[year] = {
      matricula_proyectada: adjusted,
      confianza: parseFloat(confidence.toFixed(2)),
      rango_minimo: Math.round(adjusted - errorMargin),
      rango_maximo: Math.round(adjusted + errorMargin),
      metodologia: volatilidad === 'alta' ? 'EMA' : 'regresion_lineal'
    };
  }

  // Calcular tasa de crecimiento proyectada
  const growthRate = ((projections[TARGET_YEAR].matricula_proyectada - valores.final) / valores.final) * 100;

  return {
    proyecciones_por_ano: projections,
    resumen: {
      valor_actual_2024: valores.final,
      valor_proyectado_2030: projections[TARGET_YEAR].matricula_proyectada,
      crecimiento_total_porcentual: growthRate.toFixed(1),
      confianza_promedio: (
        Object.values(projections).reduce((sum, p) => sum + p.confianza, 0) /
        Object.keys(projections).length
      ).toFixed(2)
    }
  };
}

/**
 * Proyecta salarios basándose en inflación y demanda
 */
function projectSalaries(carrera, currentSalary, demandGrowth) {
  const INFLATION_RATE = 0.03; // 3% anual
  const DEMAND_FACTOR = demandGrowth > 50 ? 0.05 : demandGrowth > 20 ? 0.03 : 0.01;

  const projections = {};

  for (let year = CURRENT_YEAR + 1; year <= TARGET_YEAR; year++) {
    const yearsAhead = year - CURRENT_YEAR;
    const projected = currentSalary * Math.pow(1 + INFLATION_RATE + DEMAND_FACTOR, yearsAhead);

    projections[year] = Math.round(projected);
  }

  return projections;
}

/**
 * Main
 */
async function main() {
  console.log('🔮 Generando proyecciones a 5 años\n');

  // Verificar archivo de tendencias
  if (!fs.existsSync(TRENDS_FILE)) {
    console.error(`❌ No se encontró: ${TRENDS_FILE}`);
    console.log('   Ejecuta primero: node scripts/06-analyze-trends.js');
    process.exit(1);
  }

  // Cargar análisis de tendencias
  const trendsData = JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf-8'));
  const { analisis } = trendsData;

  console.log(`📊 Proyectando ${Object.keys(analisis).length} carreras...\n`);

  const resultado = {};

  for (const [carrera, analisisCarrera] of Object.entries(analisis)) {
    console.log(`\n🔮 ${carrera}`);

    const proyecciones = generateProjections(carrera, analisisCarrera);

    console.log(`   2024: ${proyecciones.resumen.valor_actual_2024.toLocaleString()}`);
    console.log(`   2030: ${proyecciones.resumen.valor_proyectado_2030.toLocaleString()}`);
    console.log(`   Crecimiento: ${proyecciones.resumen.crecimiento_total_porcentual}%`);
    console.log(`   Confianza: ${(proyecciones.resumen.confianza_promedio * 100).toFixed(0)}%`);

    // Proyecciones de salario (ejemplo - estos datos deberían venir de MINEDUC)
    const salarioActual = 1500000; // Placeholder
    const salarioProyecciones = projectSalaries(
      carrera,
      salarioActual,
      parseFloat(proyecciones.resumen.crecimiento_total_porcentual)
    );

    resultado[carrera] = {
      ...proyecciones,
      proyecciones_salario: salarioProyecciones,
      recomendacion: generateRecommendation(proyecciones.resumen)
    };
  }

  // Guardar
  const output = {
    version: '1.0',
    generado: new Date().toISOString(),
    año_base: CURRENT_YEAR,
    año_objetivo: TARGET_YEAR,
    años_proyectados: PROJECTION_YEARS,
    metodologia: 'Regresión lineal + factores externos',
    proyecciones: resultado
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n\n✅ Proyecciones generadas`);
  console.log(`🎯 Horizonte: ${CURRENT_YEAR} → ${TARGET_YEAR}`);
  console.log(`💾 Guardado en: ${OUTPUT_FILE}`);
  console.log('\n📝 Próximo paso: Analizar por vocación RIASEC');
  console.log('   node scripts/08-analyze-riasec.js\n');
}

/**
 * Genera recomendación basada en proyecciones
 */
function generateRecommendation(resumen) {
  const growth = parseFloat(resumen.crecimiento_total_porcentual);
  const confidence = parseFloat(resumen.confianza_promedio);

  if (growth > 30 && confidence > 0.75) {
    return {
      nivel: 'excelente',
      mensaje: 'Alta proyección de crecimiento con buena confiabilidad. Excelente opción.',
      emoji: '🚀'
    };
  }

  if (growth > 10 && confidence > 0.70) {
    return {
      nivel: 'bueno',
      mensaje: 'Crecimiento positivo esperado. Buena opción con perspectivas favorables.',
      emoji: '📈'
    };
  }

  if (growth > 0) {
    return {
      nivel: 'moderado',
      mensaje: 'Crecimiento moderado. Opción estable con leve tendencia positiva.',
      emoji: '➡️'
    };
  }

  return {
    nivel: 'precaucion',
    mensaje: 'Tendencia decreciente o estancada. Considerar especialización o áreas emergentes.',
    emoji: '⚠️'
  };
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
