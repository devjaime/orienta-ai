/**
 * Script para analizar datos actuales y generar baseline para proyecciones
 *
 * Entrada: data/processed/carreras-enriquecidas.json
 * Salida: data/processed/trends-analysis.json
 *
 * Funcionalidad:
 * - Análisis de matrícula actual 2025
 * - Cálculo de saturación de mercado
 * - Clasificación por área y vocación RIASEC
 * - Identificación de tendencias por sector
 *
 * Ejecutar: node scripts/06-analyze-trends-real.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../data/processed/carreras-enriquecidas.json');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/trends-analysis.json');

/**
 * Clasifica carreras por sector industrial
 */
function classifySector(carrera) {
  const nombre = carrera.nombre.toLowerCase();

  // Tecnología e Informática
  if (nombre.includes('informática') || nombre.includes('computación') ||
      nombre.includes('software') || nombre.includes('data')) {
    return 'tecnología';
  }

  // Salud
  if (nombre.includes('medicina') || nombre.includes('enfermería') ||
      nombre.includes('salud') || nombre.includes('kinesiología') ||
      nombre.includes('nutrición') || nombre.includes('odontología') ||
      nombre.includes('fonoaudiología')) {
    return 'salud';
  }

  // Ingeniería
  if (nombre.includes('ingeniería') || nombre.includes('ingenieria')) {
    return 'ingeniería';
  }

  // Ciencias Sociales
  if (nombre.includes('psicología') || nombre.includes('sociología') ||
      nombre.includes('trabajo social')) {
    return 'ciencias_sociales';
  }

  // Negocios
  if (nombre.includes('administración') || nombre.includes('comercial') ||
      nombre.includes('contador') || nombre.includes('auditor')) {
    return 'negocios';
  }

  // Educación
  if (nombre.includes('pedagogía') || nombre.includes('educación')) {
    return 'educación';
  }

  // Derecho
  if (nombre.includes('derecho')) {
    return 'derecho';
  }

  // Artes y Diseño
  if (nombre.includes('diseño') || nombre.includes('arquitectura') ||
      nombre.includes('publicidad')) {
    return 'artes_diseño';
  }

  // Ciencias
  if (nombre.includes('bioquímica') || nombre.includes('química') ||
      nombre.includes('geología')) {
    return 'ciencias';
  }

  return 'otros';
}

/**
 * Calcula nivel de saturación basado en matrícula
 */
function calculateSaturation(matricula) {
  // Umbrales basados en datos chilenos
  if (matricula > 50000) return { nivel: 'muy_alta', factor: -0.03 };
  if (matricula > 30000) return { nivel: 'alta', factor: -0.01 };
  if (matricula > 15000) return { nivel: 'media', factor: 0.02 };
  if (matricula > 5000) return { nivel: 'baja', factor: 0.05 };
  return { nivel: 'muy_baja', factor: 0.08 };
}

/**
 * Obtiene factor de crecimiento por sector
 */
function getSectorGrowthFactor(sector) {
  const factors = {
    'tecnología': 0.12,        // +12% anual (alta demanda)
    'salud': 0.06,            // +6% (envejecimiento poblacional)
    'ingeniería': 0.04,       // +4% (infraestructura)
    'ciencias': 0.03,         // +3% (estable)
    'negocios': 0.02,         // +2% (moderado)
    'educación': 0.01,        // +1% (baja demanda)
    'ciencias_sociales': -0.02, // -2% (saturación)
    'derecho': -0.03,         // -3% (alta saturación)
    'artes_diseño': 0.03,     // +3% (moderado)
    'otros': 0.02             // +2% (default)
  };

  return factors[sector] || 0.02;
}

/**
 * Analiza tendencias de empleabilidad
 */
function analyzeEmployability(carrera) {
  const empStr = carrera.empleabilidad?.toLowerCase() || 'media';

  let score = 50;
  let nivel = 'media';

  if (empStr.includes('alta') || empStr.includes('excelente')) {
    score = 85;
    nivel = 'alta';
  } else if (empStr.includes('muy buena') || empStr.includes('buena')) {
    score = 70;
    nivel = 'buena';
  } else if (empStr.includes('baja') || empStr.includes('difícil')) {
    score = 30;
    nivel = 'baja';
  }

  return { nivel, score };
}

/**
 * Calcula índice de oportunidad (0-100)
 */
function calculateOpportunityIndex(carrera, sector) {
  let index = 50; // Base

  // Factor de sector (+/- 20 puntos)
  const sectorFactor = getSectorGrowthFactor(sector);
  index += sectorFactor * 100;

  // Factor de saturación (+/- 15 puntos)
  if (carrera.mineduc_data?.matricula_actual) {
    const saturation = calculateSaturation(carrera.mineduc_data.matricula_actual);
    index += saturation.factor * 300;
  }

  // Factor de empleabilidad (+/- 20 puntos)
  const employability = analyzeEmployability(carrera);
  index += (employability.score - 50) * 0.4;

  // Factor de instituciones (más instituciones = más demanda)
  if (carrera.mineduc_data?.instituciones_ofrecen_count) {
    const instCount = carrera.mineduc_data.instituciones_ofrecen_count;
    if (instCount > 30) index += 10;
    else if (instCount > 15) index += 5;
    else if (instCount < 5) index -= 5;
  }

  // Limitar entre 0-100
  return Math.max(0, Math.min(100, Math.round(index)));
}

/**
 * Genera análisis completo de una carrera
 */
function analyzeCareer(carrera) {
  const sector = classifySector(carrera);
  const sectorGrowth = getSectorGrowthFactor(sector);

  const matriculaActual = carrera.mineduc_data?.matricula_actual || null;
  const saturation = matriculaActual ? calculateSaturation(matriculaActual) : null;

  const employability = analyzeEmployability(carrera);
  const opportunityIndex = calculateOpportunityIndex(carrera, sector);

  // Calcular tasa de crecimiento proyectada compuesta
  let projectedGrowth = sectorGrowth;
  if (saturation) {
    projectedGrowth += saturation.factor;
  }

  // Determinar tendencia
  let tendencia = 'estable';
  if (projectedGrowth > 0.05) tendencia = 'creciente';
  else if (projectedGrowth < -0.02) tendencia = 'decreciente';

  return {
    nombre: carrera.nombre,
    codigo_holland: carrera.codigo_holland,
    area: carrera.area,
    sector,

    // Datos actuales
    datos_2025: {
      matricula: matriculaActual,
      instituciones: carrera.mineduc_data?.instituciones_ofrecen_count || null,
      regiones: carrera.mineduc_data?.regiones_disponibles?.length || null,
      titulados: carrera.mineduc_data?.titulados_ultimo_ano || null,
      tasa_titulacion: carrera.mineduc_data?.tasa_titulacion || null
    },

    // Análisis
    analisis: {
      tendencia,
      saturacion: saturation?.nivel || 'desconocida',
      empleabilidad: employability.nivel,
      empleabilidad_score: employability.score,
      oportunidad_index: opportunityIndex,
      crecimiento_sector: (sectorGrowth * 100).toFixed(1) + '%',
      crecimiento_proyectado: (projectedGrowth * 100).toFixed(1) + '%'
    },

    // Factores para proyecciones
    factores_proyeccion: {
      factor_sector: sectorGrowth,
      factor_saturacion: saturation?.factor || 0,
      factor_total: projectedGrowth,
      confianza: calculateConfidence(carrera, matriculaActual)
    }
  };
}

/**
 * Calcula nivel de confianza de las proyecciones
 */
function calculateConfidence(carrera, matricula) {
  let confidence = 0.70; // Base

  // Más confianza si tenemos datos MINEDUC
  if (matricula) confidence += 0.15;

  // Más confianza si hay múltiples instituciones
  const instCount = carrera.mineduc_data?.instituciones_ofrecen_count || 0;
  if (instCount > 20) confidence += 0.10;
  else if (instCount > 10) confidence += 0.05;

  return Math.min(0.95, confidence);
}

/**
 * Genera estadísticas por sector
 */
function generateSectorStats(carreras) {
  const bySector = {};

  carreras.forEach(analisis => {
    const sector = analisis.sector;
    if (!bySector[sector]) {
      bySector[sector] = {
        carreras: [],
        total_matricula: 0,
        avg_oportunidad: 0
      };
    }

    bySector[sector].carreras.push(analisis.nombre);
    bySector[sector].total_matricula += analisis.datos_2025.matricula || 0;
  });

  // Calcular promedios
  Object.keys(bySector).forEach(sector => {
    const carrerasSector = carreras.filter(c => c.sector === sector);
    const avgOpp = carrerasSector.reduce((sum, c) => sum + c.analisis.oportunidad_index, 0) / carrerasSector.length;
    bySector[sector].avg_oportunidad = Math.round(avgOpp);
    bySector[sector].count = carrerasSector.length;
  });

  return bySector;
}

/**
 * Genera ranking de carreras
 */
function generateRankings(carreras) {
  return {
    por_oportunidad: [...carreras]
      .sort((a, b) => b.analisis.oportunidad_index - a.analisis.oportunidad_index)
      .slice(0, 10)
      .map(c => ({
        nombre: c.nombre,
        oportunidad_index: c.analisis.oportunidad_index,
        tendencia: c.analisis.tendencia
      })),

    por_matricula: [...carreras]
      .filter(c => c.datos_2025.matricula)
      .sort((a, b) => b.datos_2025.matricula - a.datos_2025.matricula)
      .slice(0, 10)
      .map(c => ({
        nombre: c.nombre,
        matricula: c.datos_2025.matricula,
        saturacion: c.analisis.saturacion
      })),

    alto_crecimiento: [...carreras]
      .filter(c => c.factores_proyeccion.factor_total > 0.05)
      .sort((a, b) => b.factores_proyeccion.factor_total - a.factores_proyeccion.factor_total)
      .map(c => ({
        nombre: c.nombre,
        crecimiento_proyectado: c.analisis.crecimiento_proyectado,
        sector: c.sector
      })),

    saturadas: [...carreras]
      .filter(c => c.analisis.saturacion === 'muy_alta' || c.analisis.saturacion === 'alta')
      .map(c => ({
        nombre: c.nombre,
        matricula: c.datos_2025.matricula,
        saturacion: c.analisis.saturacion
      }))
  };
}

/**
 * Main
 */
async function main() {
  console.log('📊 Analizando datos actuales y tendencias\n');

  // Verificar archivo
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ No se encontró: ${INPUT_FILE}`);
    console.log('   Ejecuta primero: npm run merge-carreras');
    process.exit(1);
  }

  // Cargar datos
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const carreras = data.carreras || data;

  console.log(`📂 Cargadas ${carreras.length} carreras\n`);
  console.log('🔍 Analizando cada carrera...\n');

  // Analizar cada carrera
  const analisis = carreras.map(carrera => {
    const result = analyzeCareer(carrera);

    console.log(`✅ ${result.nombre}`);
    console.log(`   Sector: ${result.sector}`);
    console.log(`   Tendencia: ${result.analisis.tendencia}`);
    console.log(`   Oportunidad: ${result.analisis.oportunidad_index}/100`);
    console.log(`   Crecimiento proyectado: ${result.analisis.crecimiento_proyectado}\n`);

    return result;
  });

  // Generar estadísticas
  console.log('📈 Generando estadísticas por sector...\n');
  const sectorStats = generateSectorStats(analisis);

  console.log('🏆 Generando rankings...\n');
  const rankings = generateRankings(analisis);

  // Guardar resultado
  const output = {
    version: '2.0',
    generado: new Date().toISOString(),
    año_base: 2025,
    fuente: 'Carreras enriquecidas + Análisis de tendencias',
    total_carreras: analisis.length,

    carreras: analisis,
    estadisticas_sector: sectorStats,
    rankings,

    metadata: {
      sectores_analizados: Object.keys(sectorStats).length,
      carreras_crecimiento: rankings.alto_crecimiento.length,
      carreras_saturadas: rankings.saturadas.length
    }
  };

  // Crear directorio si no existe
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Resumen
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESUMEN DE ANÁLISIS                                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Carreras analizadas: ${analisis.length}`);
  console.log(`🏢 Sectores identificados: ${Object.keys(sectorStats).length}`);
  console.log(`📈 Carreras con alto crecimiento: ${rankings.alto_crecimiento.length}`);
  console.log(`⚠️  Carreras saturadas: ${rankings.saturadas.length}\n`);

  console.log('🏆 Top 5 por Índice de Oportunidad:');
  rankings.por_oportunidad.slice(0, 5).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.nombre} - ${c.oportunidad_index}/100`);
  });

  console.log('\n💾 Archivo guardado:', OUTPUT_FILE);
  console.log('\n📝 Próximo paso: Generar proyecciones a 5 años');
  console.log('   node scripts/07-project-future-real.js\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
