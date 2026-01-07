#!/usr/bin/env node

/**
 * Script Interactivo: Asistente de Configuración MINEDUC
 *
 * Este script guía al usuario paso a paso en la configuración
 * y descarga de datos MINEDUC.
 *
 * Ejecutar: node scripts/00-setup-wizard.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function ask(question) {
  return new Promise(resolve => {
    rl.question(colors.cyan + question + colors.reset, answer => {
      resolve(answer);
    });
  });
}

async function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function showHeader() {
  console.clear();
  log('\n╔════════════════════════════════════════════════════════╗', 'bright');
  log('║                                                        ║', 'bright');
  log('║     🎓 ASISTENTE DE CONFIGURACIÓN MINEDUC             ║', 'bright');
  log('║        Integración de Datos Abiertos MINEDUC          ║', 'bright');
  log('║                                                        ║', 'bright');
  log('╚════════════════════════════════════════════════════════╝', 'bright');
  log('');
}

async function step1_CheckPrerequisites() {
  log('\n📋 PASO 1: Verificando Requisitos Previos\n', 'blue');

  const checks = [];

  // Check Node.js
  log('Verificando Node.js...', 'yellow');
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    log(`✅ Node.js instalado: ${nodeVersion}`, 'green');
    checks.push(true);
  } catch {
    log('❌ Node.js no encontrado', 'red');
    checks.push(false);
  }

  // Check npm
  log('Verificando npm...', 'yellow');
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    log(`✅ npm instalado: v${npmVersion}`, 'green');
    checks.push(true);
  } catch {
    log('❌ npm no encontrado', 'red');
    checks.push(false);
  }

  // Check unrar/unar (macOS usa unar)
  log('Verificando descompresor RAR...', 'yellow');
  const hasUnrar = await checkCommand('unrar');
  const hasUnar = await checkCommand('unar');

  if (hasUnrar || hasUnar) {
    const tool = hasUnrar ? 'unrar' : 'unar';
    log(`✅ ${tool} instalado`, 'green');
    checks.push(true);
  } else {
    log('⚠️  Descompresor RAR no encontrado', 'yellow');
    log('   Necesario para descomprimir archivos MINEDUC', 'yellow');
    const install = await ask('¿Quieres instalarlo ahora con Homebrew? (s/n): ');
    if (install.toLowerCase() === 's') {
      try {
        log('Instalando unar...', 'yellow');
        execSync('brew install unar', { stdio: 'inherit' });
        log('✅ unar instalado exitosamente', 'green');
        checks.push(true);
      } catch {
        log('❌ Error instalando unar', 'red');
        log('   Instálalo manualmente: brew install unar', 'yellow');
        checks.push(false);
      }
    } else {
      checks.push(false);
    }
  }

  // Check directories
  log('\nVerificando estructura de carpetas...', 'yellow');
  const dirs = [
    'data/mineduc-raw/matricula',
    'data/mineduc-raw/titulados',
    'data/processed'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      log(`✅ ${dir}`, 'green');
    } else {
      log(`⚠️  ${dir} no existe, creando...`, 'yellow');
      fs.mkdirSync(fullPath, { recursive: true });
      log(`✅ ${dir} creado`, 'green');
    }
  }

  const allGood = checks.every(c => c);
  if (allGood) {
    log('\n✅ Todos los requisitos están listos\n', 'green');
  } else {
    log('\n⚠️  Algunos requisitos faltan. Por favor, instálalos antes de continuar.\n', 'yellow');
  }

  return allGood;
}

async function step2_DownloadInstructions() {
  log('\n📥 PASO 2: Descargar Datos MINEDUC\n', 'blue');

  log('Necesitas descargar manualmente los archivos del portal MINEDUC:\n');
  log('1. Abre tu navegador', 'cyan');
  log('2. Ve a: https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/', 'cyan');
  log('3. Descarga el archivo 2024 (más reciente)', 'cyan');
  log('4. Guarda en: ~/Downloads/\n', 'cyan');

  const downloaded = await ask('¿Ya descargaste el archivo Matricula-Ed-Superior-2024.rar? (s/n): ');

  if (downloaded.toLowerCase() !== 's') {
    log('\n⏸️  Pausa el asistente, descarga el archivo y vuelve a ejecutar.\n', 'yellow');
    log('Comando para volver a ejecutar:', 'cyan');
    log('  node scripts/00-setup-wizard.js\n', 'bright');
    return false;
  }

  return true;
}

async function step3_MoveAndExtract() {
  log('\n📂 PASO 3: Mover y Descomprimir Archivo\n', 'blue');

  const rarPath = path.join(process.env.HOME, 'Downloads', 'Matricula-Ed-Superior-2024.rar');

  // Check if file exists
  log('Verificando archivo descargado...', 'yellow');
  if (!fs.existsSync(rarPath)) {
    log('❌ No se encontró el archivo en ~/Downloads/', 'red');
    log('   Buscado: ' + rarPath, 'yellow');

    const customPath = await ask('Ingresa la ruta completa del archivo (o "n" para salir): ');
    if (customPath === 'n') return false;

    if (!fs.existsSync(customPath)) {
      log('❌ Archivo no encontrado: ' + customPath, 'red');
      return false;
    }

    // Copy from custom path
    const destPath = path.join(process.cwd(), 'data/mineduc-raw/matricula/Matricula-Ed-Superior-2024.rar');
    log('Copiando archivo...', 'yellow');
    fs.copyFileSync(customPath, destPath);
    log('✅ Archivo copiado', 'green');
  } else {
    // Move from Downloads
    const destPath = path.join(process.cwd(), 'data/mineduc-raw/matricula/Matricula-Ed-Superior-2024.rar');
    log('Moviendo archivo a data/mineduc-raw/matricula/...', 'yellow');
    fs.renameSync(rarPath, destPath);
    log('✅ Archivo movido', 'green');
  }

  // Extract
  log('\nDescomprimiendo archivo...', 'yellow');
  try {
    const cwd = path.join(process.cwd(), 'data/mineduc-raw/matricula');
    // Usar unar en macOS, unrar en otros sistemas
    const extractCmd = await checkCommand('unar')
      ? 'unar Matricula-Ed-Superior-2024.rar'
      : 'unrar x Matricula-Ed-Superior-2024.rar';
    execSync(extractCmd, { cwd, stdio: 'inherit' });
    log('✅ Archivo descomprimido', 'green');

    // List CSV files
    const files = fs.readdirSync(cwd).filter(f => f.endsWith('.csv'));
    if (files.length > 0) {
      log(`\n✅ Encontrados ${files.length} archivo(s) CSV:`, 'green');
      files.forEach(f => log(`   - ${f}`, 'cyan'));
    } else {
      log('\n⚠️  No se encontraron archivos CSV', 'yellow');
      return false;
    }

    return true;
  } catch (error) {
    log('❌ Error al descomprimir: ' + error.message, 'red');
    return false;
  }
}

async function step4_InspectCSV() {
  log('\n🔍 PASO 4: Inspeccionar Estructura del CSV\n', 'blue');

  const csvDir = path.join(process.cwd(), 'data/mineduc-raw/matricula');
  const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    log('❌ No hay archivos CSV para inspeccionar', 'red');
    return false;
  }

  const csvPath = path.join(csvDir, csvFiles[0]);
  log(`Inspeccionando: ${csvFiles[0]}`, 'yellow');

  try {
    const firstLine = execSync(`head -n 1 "${csvPath}"`).toString().trim();
    const columns = firstLine.split(',');

    log('\n📋 Columnas encontradas:', 'green');
    columns.forEach((col, i) => {
      log(`   ${i + 1}. ${col}`, 'cyan');
    });

    log('\n💡 Información importante:', 'yellow');
    log('   Estas son las columnas que usará el script de procesamiento.', 'yellow');
    log('   Si el script falla, verifica que los nombres coincidan.', 'yellow');

    const proceed = await ask('\n¿Continuar con el procesamiento? (s/n): ');
    return proceed.toLowerCase() === 's';
  } catch (error) {
    log('❌ Error leyendo CSV: ' + error.message, 'red');
    return false;
  }
}

async function step5_InstallDependencies() {
  log('\n📦 PASO 5: Instalar Dependencias\n', 'blue');

  log('Instalando paquetes npm...', 'yellow');
  try {
    execSync('npm install', { stdio: 'inherit' });
    log('\n✅ Dependencias instaladas', 'green');
    return true;
  } catch (error) {
    log('❌ Error instalando dependencias', 'red');
    return false;
  }
}

async function step6_ProcessData() {
  log('\n⚙️  PASO 6: Procesar Datos\n', 'blue');

  log('Ejecutando script de procesamiento...', 'yellow');
  log('Esto puede tomar 1-2 minutos...\n', 'yellow');

  try {
    execSync('npm run process-matricula', { stdio: 'inherit' });
    log('\n✅ Datos procesados exitosamente', 'green');

    // Check output file
    const outputPath = path.join(process.cwd(), 'data/processed/matricula-agregado.json');
    if (fs.existsSync(outputPath)) {
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      log(`\n📊 Carreras procesadas: ${Object.keys(data).length}`, 'cyan');
    }

    return true;
  } catch (error) {
    log('\n❌ Error procesando datos', 'red');
    log('Revisa el error arriba y verifica las columnas del CSV', 'yellow');
    return false;
  }
}

async function step7_NextSteps() {
  log('\n✅ CONFIGURACIÓN COMPLETADA\n', 'green');

  log('Próximos pasos:\n', 'bright');
  log('1. Fusionar con tus carreras RIASEC:', 'cyan');
  log('   npm run merge-carreras\n', 'yellow');

  log('2. Crear tabla en Supabase:', 'cyan');
  log('   Ver SQL en: GUIA_DESCARGA_DATOS_MINEDUC.md (Paso 9)\n', 'yellow');

  log('3. Subir datos a Supabase:', 'cyan');
  log('   npm run upload-supabase\n', 'yellow');

  log('4. Análisis y proyecciones:', 'cyan');
  log('   npm run analytics-full\n', 'yellow');

  log('📖 Documentación completa:', 'bright');
  log('   - GUIA_DESCARGA_DATOS_MINEDUC.md', 'cyan');
  log('   - INTEGRACION_MINEDUC.md', 'cyan');
  log('   - SISTEMA_VISUALIZACIONES.md\n', 'cyan');

  const runMerge = await ask('¿Quieres ejecutar el merge ahora? (s/n): ');
  if (runMerge.toLowerCase() === 's') {
    try {
      execSync('npm run merge-carreras', { stdio: 'inherit' });
    } catch (error) {
      log('❌ Error en merge', 'red');
    }
  }
}

async function main() {
  showHeader();

  log('Este asistente te guiará paso a paso en la configuración.\n');
  log('Presiona Enter para comenzar...');
  await ask('');

  // Step 1: Check prerequisites
  if (!await step1_CheckPrerequisites()) {
    log('\n⚠️  Por favor, resuelve los problemas arriba antes de continuar.\n', 'yellow');
    rl.close();
    return;
  }

  await ask('\nPresiona Enter para continuar...');

  // Step 2: Download instructions
  if (!await step2_DownloadInstructions()) {
    rl.close();
    return;
  }

  // Step 3: Move and extract
  if (!await step3_MoveAndExtract()) {
    log('\n⚠️  No se pudo descomprimir el archivo.\n', 'yellow');
    rl.close();
    return;
  }

  await ask('\nPresiona Enter para continuar...');

  // Step 4: Inspect CSV
  if (!await step4_InspectCSV()) {
    rl.close();
    return;
  }

  // Step 5: Install dependencies
  if (!await step5_InstallDependencies()) {
    rl.close();
    return;
  }

  await ask('\nPresiona Enter para continuar...');

  // Step 6: Process data
  if (!await step6_ProcessData()) {
    rl.close();
    return;
  }

  await ask('\nPresiona Enter para ver próximos pasos...');

  // Step 7: Next steps
  await step7_NextSteps();

  rl.close();
}

main().catch(error => {
  log('\n❌ Error fatal: ' + error.message, 'red');
  rl.close();
  process.exit(1);
});
