/**
 * Script para procesar datos de Matrícula MINEDUC
 *
 * Entrada: data/mineduc-raw/matricula/*.csv
 * Salida: data/processed/matricula-agregado.json
 *
 * Ejecutar: node scripts/02-process-matricula.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, '../data/mineduc-raw/matricula');
const OUTPUT_DIR = path.join(__dirname, '../data/processed');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'matricula-agregado.json');

/**
 * Normaliza nombre de carrera para matching
 */
function normalizeCareerName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/ingenier[ií]a civil en/gi, 'ingenieria en')
    .replace(/ingenier[ií]a civil/gi, 'ingenieria')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Procesa un archivo CSV de matrícula
 *
 * NOTA: Adaptar según estructura real del CSV
 * Esta es una estructura esperada basada en datasets típicos
 */
async function processMatriculaCSV(filePath) {
  console.log(`📄 Procesando: ${path.basename(filePath)}`);

  // TODO: Instalar dependencia csv-parser
  // npm install csv-parser

  const csv = await import('csv-parser');
  const { default: parser } = csv;

  const carreras = {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parser())
      .on('data', (row) => {
        // Adaptar estos nombres de columna según el CSV real
        // Columnas esperadas (pueden variar):
        // - NOMBRE_CARRERA
        // - INSTITUCION
        // - TIPO_INSTITUCION (Universidad, IP, CFT)
        // - REGION
        // - MATRICULA (número)
        // - ANIO
        // - MODALIDAD (Presencial, Online)

        const carreraNombre = row['NOMBRE_CARRERA'] || row['Carrera'] || row['NOMBRE_CARRERA_GENERICA'];
        const institucion = row['INSTITUCION'] || row['Institucion'] || row['NOMBRE_INSTITUCION'];
        const matricula = parseInt(row['MATRICULA'] || row['Matricula'] || row['TOTAL_MATRICULA'] || 0);
        const region = row['REGION'] || row['Region'] || row['REGION_SEDE'];
        const tipoInstitucion = row['TIPO_INSTITUCION'] || row['Tipo'] || row['TIPO_IES'];
        const modalidad = row['MODALIDAD'] || row['Modalidad'] || 'Presencial';

        if (!carreraNombre) return;

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
            detalle_instituciones: []
          };
        }

        carreras[normalized].matricula_total += matricula;
        carreras[normalized].instituciones.add(institucion);
        carreras[normalized].regiones.add(region);
        carreras[normalized].tipos_institucion.add(tipoInstitucion);
        carreras[normalized].modalidades.add(modalidad);

        carreras[normalized].detalle_instituciones.push({
          institucion,
          matricula,
          region,
          tipo: tipoInstitucion,
          modalidad
        });
      })
      .on('end', () => {
        resolve(carreras);
      })
      .on('error', reject);
  });
}

/**
 * Agrega datos de múltiples años
 */
function aggregateData(carrerasData) {
  const resultado = {};

  for (const [key, data] of Object.entries(carrerasData)) {
    resultado[key] = {
      nombre: data.nombre_original,
      nombre_normalizado: data.nombre_normalizado,
      matricula_total: data.matricula_total,
      instituciones_count: data.instituciones.size,
      instituciones: Array.from(data.instituciones),
      regiones: Array.from(data.regiones),
      tipos_institucion: Array.from(data.tipos_institucion),
      modalidades: Array.from(data.modalidades),
      top_instituciones: data.detalle_instituciones
        .sort((a, b) => b.matricula - a.matricula)
        .slice(0, 5)
        .map(d => ({ institucion: d.institucion, matricula: d.matricula }))
    };
  }

  return resultado;
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Iniciando procesamiento de datos de Matrícula MINEDUC\n');

  // Verificar que existe el directorio
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌ Error: No existe el directorio ${RAW_DIR}`);
    console.log('\n📥 Primero descarga los datos de:');
    console.log('   https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/');
    console.log(`   y descomprime en: ${RAW_DIR}`);
    process.exit(1);
  }

  // Listar archivos CSV
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.error(`❌ No se encontraron archivos CSV en ${RAW_DIR}`);
    console.log('\n📥 Asegúrate de descomprimir los archivos RAR descargados');
    process.exit(1);
  }

  console.log(`📊 Encontrados ${files.length} archivos CSV\n`);

  // Procesar cada archivo
  let allCarreras = {};

  for (const file of files) {
    try {
      const filePath = path.join(RAW_DIR, file);
      const data = await processMatriculaCSV(filePath);

      // Combinar datos
      for (const [key, carrera] of Object.entries(data)) {
        if (!allCarreras[key]) {
          allCarreras[key] = carrera;
        } else {
          // Merge data
          allCarreras[key].matricula_total += carrera.matricula_total;
          carrera.instituciones.forEach(i => allCarreras[key].instituciones.add(i));
          carrera.regiones.forEach(r => allCarreras[key].regiones.add(r));
          carrera.tipos_institucion.forEach(t => allCarreras[key].tipos_institucion.add(t));
          carrera.modalidades.forEach(m => allCarreras[key].modalidades.add(m));
          allCarreras[key].detalle_instituciones.push(...carrera.detalle_instituciones);
        }
      }

      console.log(`   ✅ ${file}: ${Object.keys(data).length} carreras únicas`);
    } catch (error) {
      console.error(`   ❌ Error procesando ${file}:`, error.message);
    }
  }

  console.log(`\n📈 Total de carreras únicas: ${Object.keys(allCarreras).length}`);

  // Agregar y formatear datos
  const resultado = aggregateData(allCarreras);

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Guardar resultado
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(resultado, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Datos procesados guardados en: ${OUTPUT_FILE}`);
  console.log(`\n📊 Estadísticas:`);
  console.log(`   - Carreras procesadas: ${Object.keys(resultado).length}`);

  const totalMatricula = Object.values(resultado).reduce((sum, c) => sum + c.matricula_total, 0);
  console.log(`   - Matrícula total: ${totalMatricula.toLocaleString()}`);

  // Mostrar top 10 carreras por matrícula
  console.log(`\n🏆 Top 10 carreras por matrícula:`);
  const top10 = Object.entries(resultado)
    .sort(([, a], [, b]) => b.matricula_total - a.matricula_total)
    .slice(0, 10);

  top10.forEach(([key, data], i) => {
    console.log(`   ${i + 1}. ${data.nombre}: ${data.matricula_total.toLocaleString()} estudiantes`);
  });

  console.log('\n✨ ¡Procesamiento completado!');
  console.log('\n📝 Próximo paso: Ejecutar script de fusión con carreras.json');
  console.log('   node scripts/04-merge-carreras.js\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
