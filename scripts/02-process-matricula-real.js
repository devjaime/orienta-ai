/**
 * Script para procesar datos REALES de Matrícula MINEDUC 2025
 *
 * El formato real tiene una fila por estudiante, no datos agregados.
 * Este script cuenta estudiantes por carrera y genera estadísticas.
 *
 * Entrada: data/mineduc-raw/matricula/matricula_2025.csv
 * Salida: data/processed/matricula-agregado.json
 *
 * Ejecutar: node scripts/02-process-matricula-real.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, '../data/mineduc-raw/matricula/matricula_2025.csv');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/matricula-agregado.json');

/**
 * Normaliza nombre de carrera para matching
 */
function normalizeCareerName(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/ingenier[ií]a civil en/gi, 'ingenieria en')
    .replace(/ingenier[ií]a civil/gi, 'ingenieria')
    .replace(/ingenier[ií]a en/gi, 'ingenieria en')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Procesa el CSV línea por línea (eficiente para archivos grandes)
 */
async function processCSV() {
  console.log('🚀 Procesando CSV de Matrícula MINEDUC 2025\n');
  console.log('📄 Archivo:', CSV_FILE);
  console.log('📊 Tamaño:', (fs.statSync(CSV_FILE).size / 1024 / 1024).toFixed(2), 'MB\n');

  const carreras = {};
  let totalRows = 0;
  let headerParsed = false;
  let headers = [];

  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('⏳ Procesando líneas (esto puede tomar 1-2 minutos)...\n');

  for await (const line of rl) {
    totalRows++;

    // Mostrar progreso cada 50,000 líneas
    if (totalRows % 50000 === 0) {
      process.stdout.write(`\r   Procesadas: ${totalRows.toLocaleString()} líneas...`);
    }

    if (!headerParsed) {
      headers = line.split(';');
      headerParsed = true;
      continue;
    }

    const values = line.split(';');
    if (values.length < headers.length) continue;

    // Crear objeto de la fila
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i];
    });

    // Extraer datos relevantes
    const carreraNombre = row['nomb_carrera'];
    const institucion = row['nomb_inst'];
    const region = row['region_sede'];
    const tipoInst = row['tipo_inst_1'];
    const modalidad = row['modalidad'];
    const area = row['area_conocimiento'];

    if (!carreraNombre) continue;

    const normalized = normalizeCareerName(carreraNombre);

    if (!carreras[normalized]) {
      carreras[normalized] = {
        nombre_original: carreraNombre,
        nombre_normalizado: normalized,
        matricula_total: 0,
        instituciones: new Set(),
        regiones: new Set(),
        tipos_institucion: new Set(),
        modalidades: new Set(),
        areas: new Set(),
        detalle_instituciones: {}
      };
    }

    // Incrementar matrícula
    carreras[normalized].matricula_total++;
    carreras[normalized].instituciones.add(institucion);
    carreras[normalized].regiones.add(region);
    carreras[normalized].tipos_institucion.add(tipoInst);
    carreras[normalized].modalidades.add(modalidad);
    if (area) carreras[normalized].areas.add(area);

    // Contar por institución
    if (!carreras[normalized].detalle_instituciones[institucion]) {
      carreras[normalized].detalle_instituciones[institucion] = {
        nombre: institucion,
        matricula: 0,
        region: region,
        tipo: tipoInst
      };
    }
    carreras[normalized].detalle_instituciones[institucion].matricula++;
  }

  console.log(`\r✅ Procesadas: ${totalRows.toLocaleString()} líneas\n`);

  return carreras;
}

/**
 * Formatea datos para salida JSON
 */
function formatOutput(carreras) {
  const resultado = {};

  for (const [key, data] of Object.entries(carreras)) {
    // Convertir Sets a Arrays y ordenar instituciones
    const topInstituciones = Object.values(data.detalle_instituciones)
      .sort((a, b) => b.matricula - a.matricula)
      .slice(0, 10)
      .map(d => ({
        institucion: d.nombre,
        matricula: d.matricula,
        region: d.region,
        tipo: d.tipo
      }));

    resultado[key] = {
      nombre: data.nombre_original,
      nombre_normalizado: data.nombre_normalizado,
      matricula_total: data.matricula_total,
      instituciones_count: data.instituciones.size,
      instituciones: Array.from(data.instituciones).slice(0, 20), // Limitar a top 20
      regiones: Array.from(data.regiones).sort(),
      tipos_institucion: Array.from(data.tipos_institucion),
      modalidades: Array.from(data.modalidades),
      areas_conocimiento: Array.from(data.areas),
      top_instituciones: topInstituciones
    };
  }

  return resultado;
}

/**
 * Main
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  📊 PROCESADOR DE MATRÍCULA MINEDUC 2025              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Verificar archivo
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ Archivo no encontrado: ${CSV_FILE}`);
    console.log('\nVerifica que el archivo esté en la ubicación correcta.');
    process.exit(1);
  }

  // Procesar
  const startTime = Date.now();
  const carreras = await processCSV();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`⏱️  Tiempo de procesamiento: ${elapsed}s`);
  console.log(`📈 Carreras únicas encontradas: ${Object.keys(carreras).length}\n`);

  // Formatear
  console.log('📦 Formateando datos...');
  const resultado = formatOutput(carreras);

  // Crear directorio de salida si no existe
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Guardar
  console.log('💾 Guardando resultado...');
  const output = {
    version: '1.0',
    generado: new Date().toISOString(),
    fuente: 'MINEDUC Matrícula 2025',
    total_carreras: Object.keys(resultado).length,
    total_estudiantes: Object.values(resultado).reduce((sum, c) => sum + c.matricula_total, 0),
    carreras: resultado
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Estadísticas
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  📊 ESTADÍSTICAS                                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Archivo guardado: ${OUTPUT_FILE}`);
  console.log(`📈 Total carreras únicas: ${output.total_carreras.toLocaleString()}`);
  console.log(`👥 Total estudiantes: ${output.total_estudiantes.toLocaleString()}\n`);

  // Top 10 carreras
  console.log('🏆 Top 10 carreras por matrícula:\n');
  const top10 = Object.entries(resultado)
    .sort(([, a], [, b]) => b.matricula_total - a.matricula_total)
    .slice(0, 10);

  top10.forEach(([key, data], i) => {
    console.log(`   ${i + 1}. ${data.nombre}`);
    console.log(`      📊 ${data.matricula_total.toLocaleString()} estudiantes`);
    console.log(`      🏛️  ${data.instituciones_count} instituciones\n`);
  });

  console.log('✨ ¡Procesamiento completado!\n');
  console.log('📝 Próximo paso: Fusionar con carreras RIASEC');
  console.log('   npm run merge-carreras\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
