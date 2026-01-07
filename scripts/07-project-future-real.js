/**
 * Script para proyectar demanda, matrícula y salarios a 5 años
 *
 * Entrada: data/processed/trends-analysis.json
 * Salida: data/processed/future-projections.json
 *
 * Metodología:
 * - Proyección exponencial basada en factores de crecimiento
 * - Ajustes por saturación y demanda del mercado
 * - Proyección de salarios considerando inflación + demanda
 * - Intervalos de confianza para cada proyección
 *
 * Ejecutar: node scripts/07-project-future-real.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../data/processed/trends-analysis.json');
const CARRERAS_FILE = path.join(__dirname, '../data/processed/carreras-enriquecidas.json');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/future-projections.json');

const CURRENT_YEAR = 2025;
const PROJECTION_YEARS = 5;
const TARGET_YEAR = CURRENT_YEAR + PROJECTION_YEARS; // 2030

// Parámetros macroeconómicos
const INFLATION_RATE = 0.03; // 3% anual (Chile promedio)
const BASE_SALARY_GROWTH = 0.02; // 2% real adicional

/**
 * Proyecta matrícula año por año
 */
function projectEnrollment(baseValue, growthFactor, saturationFactor, years) {
  const projections = {};
  let currentValue = baseValue;

  for (let i = 1; i <= years; i++) {
    const year = CURRENT_YEAR + i;

    // Factor de desaceleración gradual por saturación
    const deceleration = 1 - (saturationFactor * i / years);
    const adjustedGrowth = growthFactor * Math.max(0.3, deceleration);

    // Proyección exponencial
    currentValue = currentValue * (1 + adjustedGrowth);

    // Calcular intervalo de confianza (se amplía con el tiempo)
    const errorMargin = currentValue * (0.05 + (0.03 * i / years));

    projections[year] = {
      matricula_proyectada: Math.round(currentValue),
      crecimiento_anual: (adjustedGrowth * 100).toFixed(1) + '%',
      intervalo_minimo: Math.round(currentValue - errorMargin),
      intervalo_maximo: Math.round(currentValue + errorMargin)
    };
  }

  return projections;
}

/**
 * Proyecta salarios considerando demanda y oferta
 */
function projectSalary(baseSalary, growthFactor, opportunityIndex, years) {
  const projections = {};
  let currentSalary = baseSalary;

  // Factor de demanda basado en índice de oportunidad
  const demandFactor = (opportunityIndex - 50) / 1000; // -0.05 a +0.05

  for (let i = 1; i <= years; i++) {
    const year = CURRENT_YEAR + i;

    // Crecimiento = Inflación + Crecimiento base + Demanda + Factor de crecimiento del sector
    const totalGrowth = INFLATION_RATE + BASE_SALARY_GROWTH + demandFactor + (growthFactor * 0.3);

    currentSalary = currentSalary * (1 + totalGrowth);

    projections[year] = {
      salario_proyectado: Math.round(currentSalary),
      crecimiento_real: ((totalGrowth - INFLATION_RATE) * 100).toFixed(1) + '%'
    };
  }

  return projections;
}

/**
 * Calcula demanda laboral proyectada
 */
function projectDemand(currentEnrollment, titulationRate, employabilityScore, years) {
  const projections = {};

  // Estimar egresados anuales (asumiendo 5 años de carrera)
  const avgGraduates = currentEnrollment ? (currentEnrollment / 5) * (titulationRate || 0.7) : null;

  if (!avgGraduates) {
    return null;
  }

  for (let i = 1; i <= years; i++) {
    const year = CURRENT_YEAR + i;

    // Factor de absorción del mercado basado en empleabilidad
    const absorptionRate = employabilityScore / 100;

    const projectedGraduates = Math.round(avgGraduates * (1 + (i * 0.02))); // 2% crecimiento anual
    const employedGraduates = Math.round(projectedGraduates * absorptionRate);
    const unemployedGraduates = projectedGraduates - employedGraduates;

    projections[year] = {
      egresados_estimados: projectedGraduates,
      empleados_estimados: employedGraduates,
      desempleados_estimados: unemployedGraduates,
      tasa_empleabilidad: (absorptionRate * 100).toFixed(1) + '%'
    };
  }

  return projections;
}

/**
 * Evalúa saturación futura
 */
function evaluateFutureSaturation(currentMatricula, projectedMatricula2030, sector) {
  if (!currentMatricula) return null;

  const growth = ((projectedMatricula2030 - currentMatricula) / currentMatricula) * 100;

  // Umbrales de saturación por sector
  const thresholds = {
    'tecnología': 100000,      // Alta capacidad de absorción
    'salud': 80000,
    'ingeniería': 70000,
    'ciencias': 30000,
    'negocios': 60000,
    'educación': 50000,
    'ciencias_sociales': 40000,
    'derecho': 35000,
    'artes_diseño': 40000,
    'otros': 40000
  };

  const threshold = thresholds[sector] || 40000;

  let nivel = 'baja';
  let alerta = null;

  if (projectedMatricula2030 > threshold * 1.5) {
    nivel = 'crítica';
    alerta = 'Alta saturación proyectada. Considerar especialización o áreas emergentes.';
  } else if (projectedMatricula2030 > threshold) {
    nivel = 'alta';
    alerta = 'Saturación moderada proyectada. Importante destacar con postgrados o certificaciones.';
  } else if (projectedMatricula2030 > threshold * 0.7) {
    nivel = 'media';
    alerta = null;
  }

  return {
    nivel,
    matricula_actual: currentMatricula,
    matricula_proyectada_2030: projectedMatricula2030,
    crecimiento_total: growth.toFixed(1) + '%',
    umbral_saturacion: threshold,
    alerta
  };
}

/**
 * Genera recomendación integral
 */
function generateRecommendation(analisis, proyecciones) {
  const {opportunityIndex, tendencia, saturacion } = analisis.analisis;
  const saturation2030 = proyecciones.saturacion_futura;

  let nivel = 'moderado';
  let mensaje = '';
  let emoji = '➡️';
  let acciones = [];

  // Alta oportunidad + baja saturación futura
  if (opportunityIndex > 75 && (!saturation2030 || saturation2030.nivel !== 'crítica')) {
    nivel = 'excelente';
    emoji = '🚀';
    mensaje = 'Excelente proyección. Alta demanda con buena capacidad de absorción del mercado.';
    acciones = [
      'Aprovechar el momento para ingresar a la carrera',
      'Considerar especializaciones emergentes',
      'Networking temprano en la industria'
    ];
  }
  // Buena oportunidad
  else if (opportunityIndex > 60 && tendencia !== 'decreciente') {
    nivel = 'bueno';
    emoji = '📈';
    mensaje = 'Buenas perspectivas. Se espera crecimiento sostenido en los próximos años.';
    acciones = [
      'Complementar con habilidades técnicas o digitales',
      'Buscar instituciones con buena empleabilidad',
      'Considerar prácticas profesionales tempranas'
    ];
  }
  // Saturación alta
  else if (saturacion === 'muy_alta' || saturacion === 'alta') {
    nivel = 'precaución';
    emoji = '⚠️';
    mensaje = 'Mercado saturado. Es crucial diferenciarse para destacar.';
    acciones = [
      'Enfocarse en especializaciones de nicho',
      'Obtener experiencia práctica durante la carrera',
      'Considerar postgrados o certificaciones internacionales',
      'Desarrollar habilidades complementarias (idiomas, tecnología)'
    ];
  }
  // Tendencia decreciente
  else if (tendencia === 'decreciente') {
    nivel = 'precaución';
    emoji = '⚠️';
    mensaje = 'Tendencia a la baja. Considerar áreas de especialización emergentes.';
    acciones = [
      'Investigar áreas emergentes dentro del campo',
      'Complementar con habilidades digitales',
      'Considerar doble titulación o minor complementario'
    ];
  }
  // Moderado
  else {
    nivel = 'moderado';
    emoji = '➡️';
    mensaje = 'Perspectivas estables. Requiere diferenciación para destacar.';
    acciones = [
      'Enfocarse en prácticas profesionales de calidad',
      'Desarrollar red de contactos en la industria',
      'Considerar especializaciones según intereses'
    ];
  }

  return { nivel, emoji, mensaje, acciones };
}

/**
 * Genera proyección completa para una carrera
 */
function generateProjection(analisis, carreraData) {
  const { datos_2025, factores_proyeccion, analisis: analisisCarrera, sector } = analisis;

  // Proyección de matrícula
  const enrollmentProjections = projectEnrollment(
    datos_2025.matricula || 10000, // Valor por defecto si no hay datos
    factores_proyeccion.factor_total,
    factores_proyeccion.factor_saturacion < 0 ? Math.abs(factores_proyeccion.factor_saturacion) : 0,
    PROJECTION_YEARS
  );

  // Proyección de salarios
  const baseSalary = carreraData.salario_promedio_chile_clp || 1200000;
  const salaryProjections = projectSalary(
    baseSalary,
    factores_proyeccion.factor_total,
    analisisCarrera.oportunidad_index,
    PROJECTION_YEARS
  );

  // Proyección de demanda laboral
  const demandProjections = projectDemand(
    datos_2025.matricula,
    datos_2025.tasa_titulacion,
    analisisCarrera.empleabilidad_score,
    PROJECTION_YEARS
  );

  // Evaluación de saturación futura
  const saturationFuture = evaluateFutureSaturation(
    datos_2025.matricula,
    enrollmentProjections[TARGET_YEAR].matricula_proyectada,
    sector
  );

  // Recomendación
  const proyeccionesObj = {
    matricula_2025: datos_2025.matricula,
    matricula_2030: enrollmentProjections[TARGET_YEAR].matricula_proyectada,
    saturacion_futura: saturationFuture
  };

  const recomendacion = generateRecommendation(analisis, proyeccionesObj);

  return {
    nombre: analisis.nombre,
    codigo_holland: analisis.codigo_holland,
    sector: analisis.sector,

    // Valores base
    datos_base_2025: {
      matricula: datos_2025.matricula,
      salario_promedio: baseSalary,
      instituciones: datos_2025.instituciones,
      empleabilidad: analisisCarrera.empleabilidad,
      oportunidad_index: analisisCarrera.oportunidad_index
    },

    // Proyecciones
    proyecciones_matricula: enrollmentProjections,
    proyecciones_salario: salaryProjections,
    proyecciones_demanda: demandProjections,

    // Análisis futuro
    saturacion_futura: saturationFuture,

    // Resumen ejecutivo
    resumen: {
      crecimiento_matricula_total: (
        ((enrollmentProjections[TARGET_YEAR].matricula_proyectada - (datos_2025.matricula || 10000)) /
          (datos_2025.matricula || 10000)) * 100
      ).toFixed(1) + '%',
      crecimiento_salario_real_total: (
        ((salaryProjections[TARGET_YEAR].salario_proyectado - baseSalary) / baseSalary - (INFLATION_RATE * PROJECTION_YEARS)) * 100
      ).toFixed(1) + '%',
      tendencia: analisisCarrera.tendencia,
      confianza: factores_proyeccion.confianza
    },

    // Recomendación
    recomendacion
  };
}

/**
 * Main
 */
async function main() {
  console.log('🔮 Generando proyecciones a 5 años (2025 → 2030)\n');

  // Verificar archivos
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ No se encontró: ${INPUT_FILE}`);
    console.log('   Ejecuta primero: node scripts/06-analyze-trends-real.js');
    process.exit(1);
  }

  if (!fs.existsSync(CARRERAS_FILE)) {
    console.error(`❌ No se encontró: ${CARRERAS_FILE}`);
    process.exit(1);
  }

  // Cargar datos
  console.log('📂 Cargando análisis de tendencias...');
  const trendsData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const carrerasData = JSON.parse(fs.readFileSync(CARRERAS_FILE, 'utf-8'));

  const analisis = trendsData.carreras;
  const carreras = carrerasData.carreras || carrerasData;

  console.log(`✅ ${analisis.length} carreras a proyectar\n`);
  console.log('🔮 Generando proyecciones...\n');

  // Generar proyecciones
  const proyecciones = {};

  analisis.forEach((analisisCarrera, index) => {
    const carreraData = carreras.find(c => c.nombre === analisisCarrera.nombre);

    if (!carreraData) {
      console.warn(`⚠️  No se encontró data para: ${analisisCarrera.nombre}`);
      return;
    }

    const proyeccion = generateProjection(analisisCarrera, carreraData);

    console.log(`${proyeccion.recomendacion.emoji} ${proyeccion.nombre}`);
    console.log(`   2025: ${proyeccion.datos_base_2025.matricula?.toLocaleString() || 'N/A'} estudiantes`);
    console.log(`   2030: ${proyeccion.proyecciones_matricula[TARGET_YEAR].matricula_proyectada.toLocaleString()} estudiantes`);
    console.log(`   Crecimiento: ${proyeccion.resumen.crecimiento_matricula_total}`);
    console.log(`   Salario 2030: $${proyeccion.proyecciones_salario[TARGET_YEAR].salario_proyectado.toLocaleString()}`);
    console.log(`   Recomendación: ${proyeccion.recomendacion.nivel}\n`);

    proyecciones[analisisCarrera.nombre] = proyeccion;
  });

  // Generar rankings de proyecciones
  const rankings = {
    mayor_crecimiento_matricula: Object.values(proyecciones)
      .sort((a, b) => {
        const growthA = parseFloat(a.resumen.crecimiento_matricula_total);
        const growthB = parseFloat(b.resumen.crecimiento_matricula_total);
        return growthB - growthA;
      })
      .slice(0, 10)
      .map(p => ({
        nombre: p.nombre,
        crecimiento: p.resumen.crecimiento_matricula_total,
        sector: p.sector
      })),

    mayor_crecimiento_salario: Object.values(proyecciones)
      .sort((a, b) => {
        const growthA = parseFloat(a.resumen.crecimiento_salario_real_total);
        const growthB = parseFloat(b.resumen.crecimiento_salario_real_total);
        return growthB - growthA;
      })
      .slice(0, 10)
      .map(p => ({
        nombre: p.nombre,
        crecimiento_real: p.resumen.crecimiento_salario_real_total,
        salario_2030: p.proyecciones_salario[TARGET_YEAR].salario_proyectado
      })),

    recomendadas: Object.values(proyecciones)
      .filter(p => p.recomendacion.nivel === 'excelente' || p.recomendacion.nivel === 'bueno')
      .sort((a, b) => b.datos_base_2025.oportunidad_index - a.datos_base_2025.oportunidad_index)
      .map(p => ({
        nombre: p.nombre,
        oportunidad_index: p.datos_base_2025.oportunidad_index,
        recomendacion: p.recomendacion.nivel,
        sector: p.sector
      })),

    saturacion_critica: Object.values(proyecciones)
      .filter(p => p.saturacion_futura?.nivel === 'crítica' || p.saturacion_futura?.nivel === 'alta')
      .map(p => ({
        nombre: p.nombre,
        saturacion: p.saturacion_futura.nivel,
        alerta: p.saturacion_futura.alerta
      }))
  };

  // Guardar resultado
  const output = {
    version: '2.0',
    generado: new Date().toISOString(),
    año_base: CURRENT_YEAR,
    año_objetivo: TARGET_YEAR,
    años_proyectados: PROJECTION_YEARS,
    parametros: {
      inflacion_anual: (INFLATION_RATE * 100) + '%',
      crecimiento_base_salarios: (BASE_SALARY_GROWTH * 100) + '%'
    },
    total_carreras: Object.keys(proyecciones).length,

    proyecciones,
    rankings,

    metodologia: {
      matricula: 'Proyección exponencial con factores de saturación',
      salarios: 'Inflación + crecimiento real + factor de demanda',
      demanda: 'Estimación basada en tasa de titulación y empleabilidad',
      confianza: 'Basada en calidad de datos y volatilidad del sector'
    }
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Resumen
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔮 RESUMEN DE PROYECCIONES                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Carreras proyectadas: ${Object.keys(proyecciones).length}`);
  console.log(`📅 Horizonte: ${CURRENT_YEAR} → ${TARGET_YEAR} (${PROJECTION_YEARS} años)`);
  console.log(`🚀 Carreras recomendadas: ${rankings.recomendadas.length}`);
  console.log(`⚠️  Saturación crítica: ${rankings.saturacion_critica.length}\n`);

  console.log('🏆 Top 5 Mayor Crecimiento Proyectado:');
  rankings.mayor_crecimiento_matricula.slice(0, 5).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.nombre} - ${c.crecimiento} (${c.sector})`);
  });

  console.log('\n💰 Top 5 Mayor Crecimiento Salarial Real:');
  rankings.mayor_crecimiento_salario.slice(0, 5).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.nombre} - ${c.crecimiento_real}`);
  });

  if (rankings.saturacion_critica.length > 0) {
    console.log('\n⚠️  Carreras con Saturación Proyectada:');
    rankings.saturacion_critica.forEach(c => {
      console.log(`   - ${c.nombre} (${c.saturacion})`);
    });
  }

  console.log('\n💾 Archivo guardado:', OUTPUT_FILE);
  console.log('\n📝 Próximo paso: Análisis por vocación RIASEC');
  console.log('   node scripts/08-analyze-riasec.js\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  console.error(error.stack);
  process.exit(1);
});
