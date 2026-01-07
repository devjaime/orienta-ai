/**
 * Script para analizar carreras por código RIASEC y vocación
 *
 * Entrada:
 *   - data/processed/trends-analysis.json
 *   - data/processed/future-projections.json
 *   - data/processed/carreras-enriquecidas.json
 *
 * Salida: data/processed/riasec-analysis.json
 *
 * Funcionalidad:
 * - Agrupación por código Holland (RIASEC)
 * - Análisis de demanda por perfil vocacional
 * - Identificación de carreras saturadas por vocación
 * - Recomendaciones por tipo de personalidad
 *
 * Ejecutar: node scripts/08-analyze-riasec.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARRERAS_FILE = path.join(__dirname, '../data/processed/carreras-enriquecidas.json');
const TRENDS_FILE = path.join(__dirname, '../data/processed/trends-analysis.json');
const PROJECTIONS_FILE = path.join(__dirname, '../data/processed/future-projections.json');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/riasec-analysis.json');

// Descripción de perfiles RIASEC
const RIASEC_PROFILES = {
  'R': {
    nombre: 'Realista',
    dimension: 'Realistic',
    descripcion: 'Personas prácticas que disfrutan trabajar con sus manos, herramientas y objetos físicos.',
    caracteristicas: ['Práctico', 'Físico', 'Concreto', 'Técnico'],
    entornos: ['Taller', 'Campo', 'Construcción', 'Mecánica']
  },
  'I': {
    nombre: 'Investigativo',
    dimension: 'Investigative',
    descripcion: 'Pensadores analíticos interesados en la ciencia, investigación y resolución de problemas.',
    caracteristicas: ['Analítico', 'Científico', 'Intelectual', 'Curioso'],
    entornos: ['Laboratorio', 'Investigación', 'Universidad', 'Centro médico']
  },
  'A': {
    nombre: 'Artístico',
    dimension: 'Artistic',
    descripcion: 'Creativos e innovadores que valoran la autoexpresión y el trabajo original.',
    caracteristicas: ['Creativo', 'Original', 'Expresivo', 'Estético'],
    entornos: ['Estudio', 'Teatro', 'Galería', 'Agencia creativa']
  },
  'S': {
    nombre: 'Social',
    dimension: 'Social',
    descripcion: 'Personas orientadas a ayudar, enseñar y cuidar a otros.',
    caracteristicas: ['Empático', 'Servicial', 'Comunicativo', 'Colaborativo'],
    entornos: ['Escuela', 'Hospital', 'ONG', 'Comunidad']
  },
  'E': {
    nombre: 'Emprendedor',
    dimension: 'Enterprising',
    descripcion: 'Líderes persuasivos interesados en los negocios, ventas y administración.',
    caracteristicas: ['Persuasivo', 'Líder', 'Ambicioso', 'Enérgico'],
    entornos: ['Empresa', 'Ventas', 'Política', 'Marketing']
  },
  'C': {
    nombre: 'Convencional',
    dimension: 'Conventional',
    descripcion: 'Organizados y metódicos que disfrutan trabajar con datos y sistemas estructurados.',
    caracteristicas: ['Organizado', 'Detallista', 'Sistemático', 'Preciso'],
    entornos: ['Oficina', 'Banco', 'Administración', 'Contabilidad']
  }
};

/**
 * Extrae dimensiones RIASEC del código Holland
 */
function parseHollandCode(codigo) {
  if (!codigo || codigo.length !== 3) {
    return { principal: null, secundaria: null, terciaria: null };
  }

  return {
    principal: codigo[0],
    secundaria: codigo[1],
    terciaria: codigo[2]
  };
}

/**
 * Agrupa carreras por dimensión RIASEC
 */
function groupByRIASEC(carreras, trends, projections) {
  const byDimension = {
    'R': { carreras: [], total_matricula: 0, avg_oportunidad: 0 },
    'I': { carreras: [], total_matricula: 0, avg_oportunidad: 0 },
    'A': { carreras: [], total_matricula: 0, avg_oportunidad: 0 },
    'S': { carreras: [], total_matricula: 0, avg_oportunidad: 0 },
    'E': { carreras: [], total_matricula: 0, avg_oportunidad: 0 },
    'C': { carreras: [], total_matricula: 0, avg_oportunidad: 0 }
  };

  carreras.forEach(carrera => {
    const dimensions = parseHollandCode(carrera.codigo_holland);
    const principal = dimensions.principal;

    if (!principal || !byDimension[principal]) return;

    const trend = trends.find(t => t.nombre === carrera.nombre);
    const projection = projections[carrera.nombre];

    const carreraData = {
      nombre: carrera.nombre,
      codigo_completo: carrera.codigo_holland,
      area: carrera.area,
      matricula: carrera.mineduc_data?.matricula_actual || null,
      oportunidad_index: trend?.analisis?.oportunidad_index || 50,
      tendencia: trend?.analisis?.tendencia || 'desconocida',
      crecimiento_proyectado: projection?.resumen?.crecimiento_matricula_total || '0%',
      saturacion: trend?.analisis?.saturacion || 'desconocida',
      empleabilidad: trend?.analisis?.empleabilidad || 'media',
      salario_2030: projection?.proyecciones_salario?.[2030]?.salario_proyectado || null
    };

    byDimension[principal].carreras.push(carreraData);
    byDimension[principal].total_matricula += carreraData.matricula || 0;
  });

  // Calcular promedios
  Object.keys(byDimension).forEach(dim => {
    const carreras = byDimension[dim].carreras;
    if (carreras.length > 0) {
      byDimension[dim].avg_oportunidad = Math.round(
        carreras.reduce((sum, c) => sum + c.oportunidad_index, 0) / carreras.length
      );
      byDimension[dim].count = carreras.length;

      // Ordenar por índice de oportunidad
      byDimension[dim].carreras.sort((a, b) => b.oportunidad_index - a.oportunidad_index);
    }
  });

  return byDimension;
}

/**
 * Genera análisis por código Holland completo (3 letras)
 */
function analyzeByFullCode(carreras, trends, projections) {
  const byCombination = {};

  carreras.forEach(carrera => {
    const code = carrera.codigo_holland;
    if (!code) return;

    if (!byCombination[code]) {
      byCombination[code] = {
        codigo: code,
        dimensiones: parseHollandCode(code),
        carreras: [],
        count: 0
      };
    }

    const trend = trends.find(t => t.nombre === carrera.nombre);
    const projection = projections[carrera.nombre];

    byCombination[code].carreras.push({
      nombre: carrera.nombre,
      matricula: carrera.mineduc_data?.matricula_actual || null,
      oportunidad_index: trend?.analisis?.oportunidad_index || 50,
      crecimiento_proyectado: projection?.resumen?.crecimiento_matricula_total || '0%'
    });

    byCombination[code].count++;
  });

  return Object.values(byCombination).sort((a, b) => b.count - a.count);
}

/**
 * Genera recomendaciones por perfil RIASEC
 */
function generateRIASECRecommendations(byDimension) {
  const recommendations = {};

  Object.keys(RIASEC_PROFILES).forEach(dim => {
    const profile = RIASEC_PROFILES[dim];
    const data = byDimension[dim];

    if (!data || data.carreras.length === 0) {
      recommendations[dim] = {
        perfil: profile,
        recomendacion: 'No hay carreras disponibles para este perfil en el dataset.',
        top_carreras: [],
        saturadas: [],
        emergentes: []
      };
      return;
    }

    // Top carreras por oportunidad
    const topCarreras = data.carreras
      .filter(c => c.oportunidad_index >= 70)
      .slice(0, 5)
      .map(c => ({
        nombre: c.nombre,
        oportunidad_index: c.oportunidad_index,
        crecimiento_proyectado: c.crecimiento_proyectado
      }));

    // Carreras saturadas
    const saturadas = data.carreras
      .filter(c => c.saturacion === 'muy_alta' || c.saturacion === 'alta')
      .map(c => ({
        nombre: c.nombre,
        saturacion: c.saturacion,
        matricula: c.matricula
      }));

    // Carreras emergentes (alto crecimiento)
    const emergentes = data.carreras
      .filter(c => {
        const growth = parseFloat(c.crecimiento_proyectado);
        return growth > 40;
      })
      .slice(0, 5)
      .map(c => ({
        nombre: c.nombre,
        crecimiento_proyectado: c.crecimiento_proyectado
      }));

    // Generar mensaje de recomendación
    let mensaje = '';
    if (topCarreras.length > 0) {
      mensaje = `Para tu perfil ${profile.nombre}, se identificaron ${topCarreras.length} carreras con alta proyección. `;
    }

    if (saturadas.length > 0) {
      mensaje += `Considera que ${saturadas.length} carreras muestran alta saturación. `;
    }

    if (emergentes.length > 0) {
      mensaje += `${emergentes.length} carreras presentan alto crecimiento proyectado.`;
    }

    if (!mensaje) {
      mensaje = 'Todas las carreras de este perfil muestran perspectivas moderadas.';
    }

    recommendations[dim] = {
      perfil: profile,
      estadisticas: {
        total_carreras: data.count,
        total_matricula: data.total_matricula,
        oportunidad_promedio: data.avg_oportunidad
      },
      recomendacion: mensaje.trim(),
      top_carreras: topCarreras,
      saturadas,
      emergentes
    };
  });

  return recommendations;
}

/**
 * Genera matriz de compatibilidad RIASEC
 */
function generateCompatibilityMatrix(byDimension) {
  const matrix = {};

  Object.keys(RIASEC_PROFILES).forEach(dim1 => {
    matrix[dim1] = {};
    Object.keys(RIASEC_PROFILES).forEach(dim2 => {
      if (dim1 === dim2) {
        matrix[dim1][dim2] = 100;
      } else {
        // Compatibilidad basada en el modelo hexagonal de Holland
        const order = ['R', 'I', 'A', 'S', 'E', 'C'];
        const idx1 = order.indexOf(dim1);
        const idx2 = order.indexOf(dim2);
        const distance = Math.min(Math.abs(idx1 - idx2), 6 - Math.abs(idx1 - idx2));

        // 0 distancia = 100%, 1 = 75%, 2 = 50%, 3 = 25%
        const compatibility = 100 - (distance * 25);
        matrix[dim1][dim2] = compatibility;
      }
    });
  });

  return matrix;
}

/**
 * Main
 */
async function main() {
  console.log('🎯 Analizando carreras por vocación RIASEC\n');

  // Verificar archivos
  const files = [
    { path: CARRERAS_FILE, name: 'carreras-enriquecidas.json' },
    { path: TRENDS_FILE, name: 'trends-analysis.json' },
    { path: PROJECTIONS_FILE, name: 'future-projections.json' }
  ];

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.error(`❌ No se encontró: ${file.name}`);
      console.log('   Ejecuta los scripts anteriores primero');
      process.exit(1);
    }
  }

  // Cargar datos
  console.log('📂 Cargando datos...');
  const carrerasData = JSON.parse(fs.readFileSync(CARRERAS_FILE, 'utf-8'));
  const trendsData = JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf-8'));
  const projectionsData = JSON.parse(fs.readFileSync(PROJECTIONS_FILE, 'utf-8'));

  const carreras = carrerasData.carreras || carrerasData;
  const trends = trendsData.carreras || [];
  const projections = projectionsData.proyecciones || {};

  console.log(`✅ ${carreras.length} carreras cargadas\n`);

  // Análisis por dimensión RIASEC
  console.log('🔍 Agrupando por dimensión RIASEC...\n');
  const byDimension = groupByRIASEC(carreras, trends, projections);

  Object.keys(RIASEC_PROFILES).forEach(dim => {
    const profile = RIASEC_PROFILES[dim];
    const data = byDimension[dim];

    console.log(`${dim} - ${profile.nombre}: ${data.count || 0} carreras`);
    console.log(`   Oportunidad promedio: ${data.avg_oportunidad}/100`);
    console.log(`   Matrícula total: ${data.total_matricula.toLocaleString()}\n`);
  });

  // Análisis por código completo
  console.log('📊 Analizando combinaciones de código Holland...\n');
  const byCombination = analyzeByFullCode(carreras, trends, projections);

  console.log('🏆 Top 5 combinaciones más comunes:');
  byCombination.slice(0, 5).forEach((combo, i) => {
    console.log(`   ${i + 1}. ${combo.codigo} - ${combo.count} carreras`);
  });

  // Generar recomendaciones
  console.log('\n💡 Generando recomendaciones por perfil...\n');
  const recommendations = generateRIASECRecommendations(byDimension);

  // Matriz de compatibilidad
  const compatibilityMatrix = generateCompatibilityMatrix(byDimension);

  // Guardar resultado
  const output = {
    version: '1.0',
    generado: new Date().toISOString(),
    descripcion: 'Análisis de carreras por código Holland/RIASEC',

    perfiles_riasec: RIASEC_PROFILES,

    analisis_por_dimension: byDimension,

    analisis_por_codigo_completo: byCombination,

    recomendaciones: recommendations,

    matriz_compatibilidad: compatibilityMatrix,

    estadisticas_generales: {
      total_carreras: carreras.length,
      dimension_mas_carreras: Object.entries(byDimension)
        .sort((a, b) => b[1].count - a[1].count)[0][0],
      dimension_mayor_oportunidad: Object.entries(byDimension)
        .sort((a, b) => b[1].avg_oportunidad - a[1].avg_oportunidad)[0][0],
      combinaciones_unicas: byCombination.length
    }
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Resumen
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎯 RESUMEN ANÁLISIS RIASEC                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Total carreras analizadas: ${carreras.length}`);
  console.log(`🔤 Combinaciones únicas: ${byCombination.length}`);
  console.log(`📈 Dimensión con más carreras: ${output.estadisticas_generales.dimension_mas_carreras} (${RIASEC_PROFILES[output.estadisticas_generales.dimension_mas_carreras].nombre})`);
  console.log(`🏆 Dimensión mayor oportunidad: ${output.estadisticas_generales.dimension_mayor_oportunidad} (${RIASEC_PROFILES[output.estadisticas_generales.dimension_mayor_oportunidad].nombre})`);

  console.log('\n📊 Distribución por dimensión:');
  Object.entries(byDimension)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([dim, data]) => {
      const profile = RIASEC_PROFILES[dim];
      console.log(`   ${dim} (${profile.nombre}): ${data.count} carreras - Oportunidad: ${data.avg_oportunidad}/100`);
    });

  console.log('\n💾 Archivo guardado:', OUTPUT_FILE);
  console.log('\n✨ ¡Análisis completo!');
  console.log('\n📝 Próximo paso: Crear componentes de visualización');
  console.log('   Implementar gráficos en la UI de React\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  console.error(error.stack);
  process.exit(1);
});
