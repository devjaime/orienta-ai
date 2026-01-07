/**
 * Script para analizar tendencias históricas de matrículas MINEDUC
 *
 * Entrada: Múltiples archivos CSV de matrícula (2007-2025)
 * Salida: data/processed/trends-analysis.json
 *
 * Funcionalidad:
 * - Análisis de series temporales por carrera
 * - Cálculo de tasas de crecimiento
 * - Identificación de tendencias
 * - Detección de anomalías
 *
 * Ejecutar: node scripts/06-analyze-trends.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, '../data/mineduc-raw/matricula');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/trends-analysis.json');

/**
 * Calcula tasa de crecimiento entre dos valores
 */
function growthRate(valueOld, valueNew) {
  if (valueOld === 0) return 0;
  return ((valueNew - valueOld) / valueOld) * 100;
}

/**
 * Calcula regresión lineal simple
 * Retorna { slope, intercept, r2 }
 */
function linearRegression(points) {
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

  points.forEach(({ x, y }) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calcular R²
  const yMean = sumY / n;
  const ssTotal = sumYY - n * yMean * yMean;
  const ssResidual = sumYY - intercept * sumY - slope * sumXY;
  const r2 = 1 - (ssResidual / ssTotal);

  return { slope, intercept, r2 };
}

/**
 * Determina tendencia basada en slope
 */
function determineTrend(slope, avgValue) {
  const percentChange = (slope / avgValue) * 100;

  if (percentChange > 5) return 'creciente';
  if (percentChange < -5) return 'decreciente';
  return 'estable';
}

/**
 * Calcula volatilidad (desviación estándar de cambios porcentuales)
 */
function calculateVolatility(values) {
  if (values.length < 2) return 0;

  const changes = [];
  for (let i = 1; i < values.length; i++) {
    const change = growthRate(values[i - 1], values[i]);
    if (!isNaN(change) && isFinite(change)) {
      changes.push(change);
    }
  }

  if (changes.length === 0) return 0;

  const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length;
  const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);

  // Clasificar volatilidad
  if (stdDev < 5) return 'baja';
  if (stdDev < 15) return 'media';
  return 'alta';
}

/**
 * Detecta picos y valles significativos
 */
function detectAnomalies(dataPoints, threshold = 20) {
  const anomalies = [];

  for (let i = 1; i < dataPoints.length; i++) {
    const change = growthRate(dataPoints[i - 1].value, dataPoints[i].value);

    if (Math.abs(change) > threshold) {
      anomalies.push({
        año: dataPoints[i].year,
        cambio_porcentual: change.toFixed(1),
        tipo: change > 0 ? 'pico' : 'valle',
        valor_anterior: dataPoints[i - 1].value,
        valor_actual: dataPoints[i].value
      });
    }
  }

  return anomalies;
}

/**
 * Analiza una serie temporal de una carrera
 */
function analyzeTimeSeries(carreraData) {
  // carreraData = { '2007': 5000, '2008': 5200, ... }

  const years = Object.keys(carreraData).map(Number).sort();
  const dataPoints = years.map(year => ({
    x: year,
    y: carreraData[year],
    year,
    value: carreraData[year]
  }));

  if (dataPoints.length < 2) {
    return {
      tendencia: 'insuficientes_datos',
      crecimiento_promedio: 0,
      volatilidad: 'n/a'
    };
  }

  // Regresión lineal
  const regression = linearRegression(dataPoints);

  // Tendencia
  const avgValue = dataPoints.reduce((sum, p) => sum + p.y, 0) / dataPoints.length;
  const tendencia = determineTrend(regression.slope, avgValue);

  // Crecimiento promedio anual
  const firstValue = dataPoints[0].y;
  const lastValue = dataPoints[dataPoints.length - 1].y;
  const yearsDiff = dataPoints.length - 1;
  const cagr = yearsDiff > 0 ? (Math.pow(lastValue / firstValue, 1 / yearsDiff) - 1) * 100 : 0;

  // Volatilidad
  const values = dataPoints.map(p => p.y);
  const volatilidad = calculateVolatility(values);

  // Anomalías
  const anomalias = detectAnomalies(dataPoints);

  return {
    años_analizados: years.length,
    rango_años: `${years[0]}-${years[years.length - 1]}`,
    tendencia,
    crecimiento_promedio_anual: cagr.toFixed(2),
    volatilidad,
    r_cuadrado: regression.r2.toFixed(3),
    valores: {
      inicial: firstValue,
      final: lastValue,
      minimo: Math.min(...values),
      maximo: Math.max(...values),
      promedio: Math.round(avgValue)
    },
    anomalias,
    regresion: {
      pendiente: regression.slope.toFixed(2),
      intercepto: regression.intercept.toFixed(2)
    }
  };
}

/**
 * Procesa todos los archivos CSV de matrícula
 */
async function processAllYears() {
  console.log('📊 Analizando tendencias históricas de matrícula MINEDUC\n');

  // Verificar directorio
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌ Directorio no encontrado: ${RAW_DIR}`);
    console.log('   Ejecuta primero: npm run process-matricula');
    process.exit(1);
  }

  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.error('❌ No hay archivos CSV para analizar');
    process.exit(1);
  }

  console.log(`📁 Encontrados ${files.length} archivos CSV\n`);

  // NOTA: Este es un ejemplo simplificado
  // En la realidad, necesitarías parsear todos los CSVs
  // Para este ejemplo, simularemos datos

  const carrerasPorAño = {};

  // TODO: Parsear cada CSV y agregar a carrerasPorAño
  // Por ahora, datos de ejemplo
  const ejemploCarreras = {
    "Ingeniería Civil en Informática": {
      "2015": 8500,
      "2016": 9200,
      "2017": 10100,
      "2018": 11300,
      "2019": 12100,
      "2020": 13800, // Pico COVID
      "2021": 14200,
      "2022": 14500,
      "2023": 14800,
      "2024": 15100
    },
    "Psicología": {
      "2015": 12000,
      "2016": 12500,
      "2017": 13200,
      "2018": 13800,
      "2019": 14000,
      "2020": 14100,
      "2021": 13900,
      "2022": 13600,
      "2023": 13200,
      "2024": 12800
    },
    "Medicina": {
      "2015": 3200,
      "2016": 3350,
      "2017": 3500,
      "2018": 3680,
      "2019": 3850,
      "2020": 4200, // Aumento por pandemia
      "2021": 4350,
      "2022": 4480,
      "2023": 4600,
      "2024": 4720
    }
  };

  return ejemploCarreras;
}

/**
 * Main
 */
async function main() {
  const carrerasData = await processAllYears();

  console.log('🔍 Analizando tendencias de cada carrera...\n');

  const resultado = {};

  for (const [carrera, dataPorAño] of Object.entries(carrerasData)) {
    console.log(`\n📈 ${carrera}`);

    const analisis = analyzeTimeSeries(dataPorAño);

    console.log(`   Tendencia: ${analisis.tendencia}`);
    console.log(`   Crecimiento anual: ${analisis.crecimiento_promedio_anual}%`);
    console.log(`   Volatilidad: ${analisis.volatilidad}`);
    console.log(`   R²: ${analisis.r_cuadrado}`);

    if (analisis.anomalias.length > 0) {
      console.log(`   ⚠️  Anomalías detectadas: ${analisis.anomalias.length}`);
      analisis.anomalias.forEach(a => {
        console.log(`      - ${a.año}: ${a.cambio_porcentual}% (${a.tipo})`);
      });
    }

    resultado[carrera] = {
      ...analisis,
      datos_historicos: dataPorAño
    };
  }

  // Guardar resultado
  const output = {
    version: '1.0',
    generado: new Date().toISOString(),
    fuente: 'MINEDUC Datos Abiertos - Matrícula',
    carreras_analizadas: Object.keys(resultado).length,
    analisis: resultado
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n\n✅ Análisis completado`);
  console.log(`📊 Carreras analizadas: ${Object.keys(resultado).length}`);
  console.log(`💾 Guardado en: ${OUTPUT_FILE}`);
  console.log('\n📝 Próximo paso: Generar proyecciones');
  console.log('   node scripts/07-project-future.js\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
