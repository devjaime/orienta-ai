/**
 * Script para fusionar datos de carreras.json con datos MINEDUC procesados
 *
 * Entrada:
 *   - src/data/carreras.json (30 carreras con códigos RIASEC)
 *   - data/processed/matricula-agregado.json
 *   - data/processed/titulados-agregado.json (opcional)
 *
 * Salida: data/processed/carreras-enriquecidas.json
 *
 * Ejecutar: node scripts/04-merge-carreras.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARRERAS_FILE = path.join(__dirname, '../src/data/carreras.json');
const MATRICULA_FILE = path.join(__dirname, '../data/processed/matricula-agregado.json');
const TITULADOS_FILE = path.join(__dirname, '../data/processed/titulados-agregado.json');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/carreras-enriquecidas.json');

/**
 * Normaliza nombre de carrera
 */
function normalizeCareerName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ingenier[ií]a civil en/gi, 'ingenieria en')
    .replace(/ingenier[ií]a civil/gi, 'ingenieria')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula similitud entre dos strings (algoritmo simple)
 */
function stringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Distancia de Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Encuentra el mejor match MINEDUC para una carrera local
 */
function findBestMatch(carreraLocal, datosMINEDUC, threshold = 0.75) {
  const nombreLocal = normalizeCareerName(carreraLocal.nombre);

  let bestMatch = null;
  let bestScore = 0;

  for (const [key, dataMINEDUC] of Object.entries(datosMINEDUC)) {
    const nombreMINEDUC = dataMINEDUC.nombre_normalizado || key;
    const similarity = stringSimilarity(nombreLocal, nombreMINEDUC);

    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = {
        ...dataMINEDUC,
        match_score: similarity
      };
    }
  }

  return bestMatch;
}

/**
 * Fusiona datos
 */
function mergeCarreras(carrerasLocal, matriculaMINEDUC, tituladosMINEDUC = null) {
  const carrerasEnriquecidas = [];
  const matches = {
    encontrados: 0,
    no_encontrados: 0,
    nombres_no_encontrados: []
  };

  for (const carrera of carrerasLocal) {
    console.log(`\n🔍 Buscando match para: ${carrera.nombre}`);

    // Buscar en datos de matrícula
    const matchMatricula = findBestMatch(carrera, matriculaMINEDUC);

    // Buscar en datos de titulados (si existe)
    const matchTitulados = tituladosMINEDUC
      ? findBestMatch(carrera, tituladosMINEDUC)
      : null;

    const carreraEnriquecida = {
      ...carrera,
      mineduc_data: null
    };

    if (matchMatricula || matchTitulados) {
      matches.encontrados++;

      carreraEnriquecida.mineduc_data = {
        // Datos de matrícula
        matricula_actual: matchMatricula?.matricula_total || null,
        instituciones_count: matchMatricula?.instituciones_count || null,
        instituciones_ofrecen: matchMatricula?.instituciones || null,
        regiones_disponibles: matchMatricula?.regiones || null,
        modalidades: matchMatricula?.modalidades || null,
        top_instituciones: matchMatricula?.top_instituciones || null,

        // Datos de titulados
        titulados_ultimo_ano: matchTitulados?.titulados_total || null,
        tasa_titulacion: matchTitulados?.tasa_titulacion || null,
        duracion_real_anos: matchTitulados?.duracion_promedio || null,

        // Metadatos
        match_score_matricula: matchMatricula?.match_score || null,
        match_score_titulados: matchTitulados?.match_score || null,
        fuente: 'MINEDUC Datos Abiertos',
        fecha_actualizacion: new Date().toISOString()
      };

      console.log(`   ✅ Match encontrado (score: ${(matchMatricula?.match_score * 100).toFixed(1)}%)`);
      console.log(`      Matrícula: ${matchMatricula?.matricula_total?.toLocaleString() || 'N/A'}`);
      console.log(`      Instituciones: ${matchMatricula?.instituciones_count || 'N/A'}`);
    } else {
      matches.no_encontrados++;
      matches.nombres_no_encontrados.push(carrera.nombre);
      console.log(`   ⚠️  No se encontró match en datos MINEDUC`);
    }

    carrerasEnriquecidas.push(carreraEnriquecida);
  }

  return { carrerasEnriquecidas, matches };
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Iniciando fusión de datos\n');

  // Verificar archivos
  if (!fs.existsSync(CARRERAS_FILE)) {
    console.error(`❌ No se encontró: ${CARRERAS_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(MATRICULA_FILE)) {
    console.error(`❌ No se encontró: ${MATRICULA_FILE}`);
    console.log('   Ejecuta primero: node scripts/02-process-matricula.js');
    process.exit(1);
  }

  // Cargar datos
  console.log('📂 Cargando archivos...');
  const carrerasData = JSON.parse(fs.readFileSync(CARRERAS_FILE, 'utf-8'));
  const matriculaData = JSON.parse(fs.readFileSync(MATRICULA_FILE, 'utf-8'));

  const tituladosData = fs.existsSync(TITULADOS_FILE)
    ? JSON.parse(fs.readFileSync(TITULADOS_FILE, 'utf-8'))
    : null;

  const carreras = carrerasData.carreras || carrerasData;
  const matriculaDatos = matriculaData.carreras || matriculaData;
  const tituladosDatos = tituladosData ? (tituladosData.carreras || tituladosData) : null;

  console.log(`   ✅ Carreras locales: ${carreras.length}`);
  console.log(`   ✅ Carreras MINEDUC (matrícula): ${Object.keys(matriculaDatos).length}`);
  if (tituladosDatos) {
    console.log(`   ✅ Carreras MINEDUC (titulados): ${Object.keys(tituladosDatos).length}`);
  }

  // Fusionar
  console.log('\n🔗 Iniciando proceso de matching...');
  const { carrerasEnriquecidas, matches } = mergeCarreras(
    carreras,
    matriculaDatos,
    tituladosDatos
  );

  // Guardar resultado
  const output = {
    version: '2.0',
    updated: new Date().toISOString(),
    total: carrerasEnriquecidas.length,
    fuente: 'Carreras.json + MINEDUC Datos Abiertos',
    estadisticas: {
      matches_encontrados: matches.encontrados,
      matches_no_encontrados: matches.no_encontrados,
      porcentaje_exito: ((matches.encontrados / carreras.length) * 100).toFixed(1) + '%'
    },
    carreras: carrerasEnriquecidas
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Resumen
  console.log('\n\n📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Matches encontrados: ${matches.encontrados}/${carreras.length}`);
  console.log(`❌ No encontrados: ${matches.no_encontrados}/${carreras.length}`);
  console.log(`📈 Tasa de éxito: ${output.estadisticas.porcentaje_exito}`);

  if (matches.nombres_no_encontrados.length > 0) {
    console.log('\n⚠️  Carreras sin match en MINEDUC:');
    matches.nombres_no_encontrados.forEach(nombre => {
      console.log(`   - ${nombre}`);
    });
    console.log('\n💡 Estas carreras mantendrán solo los datos originales');
  }

  console.log(`\n💾 Archivo guardado: ${OUTPUT_FILE}`);
  console.log('\n📝 Próximo paso: Cargar a Supabase');
  console.log('   node scripts/05-upload-supabase.js\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
