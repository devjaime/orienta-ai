/**
 * Script de verificacion del esquema multi-tenant en Supabase
 *
 * Verifica que las tablas, columnas, funciones RPC y vistas
 * necesarias para el modelo multi-colegio esten creadas.
 *
 * Ejecutar: node scripts/verify-supabase-schema.js
 *
 * Requisitos:
 *   - Variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

// --- Configuracion ---

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno: VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY');
  console.log('   Asegurate de tener un archivo .env con estas variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Elementos a verificar ---

const EXPECTED_TABLES = ['institutions'];

const EXPECTED_USER_PROFILE_COLUMNS = [
  'institution_id',
  'curso',
  'student_code',
  'school_year',
  'invited_by',
  'activation_code',
  'is_activated',
];

const EXPECTED_FUNCTIONS = [
  'create_institution',
  'invite_student',
  'activate_account_with_code',
  'batch_invite_students',
  'is_super_admin',
  'generate_activation_code',
  'get_user_institution_id',
  'is_institution_admin',
  'same_institution',
];

const EXPECTED_VIEWS = ['institution_stats'];

// --- Funciones de verificacion ---

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(0);

  if (error && error.code === '42P01') return false; // relation does not exist
  if (error && error.message?.includes('does not exist')) return false;
  // Si no hay error, o el error es de permisos (RLS), la tabla existe
  return true;
}

async function checkUserProfileColumns() {
  // Intentar leer information_schema via RPC o directamente
  // Como no tenemos acceso directo a information_schema via API,
  // intentamos una query que seleccione las columnas esperadas
  const results = {};

  for (const col of EXPECTED_USER_PROFILE_COLUMNS) {
    const { error } = await supabase
      .from('user_profiles')
      .select(col)
      .limit(0);

    if (error && (error.message?.includes('does not exist') || error.code === '42703')) {
      results[col] = false;
    } else {
      results[col] = true;
    }
  }

  return results;
}

async function checkFunction(funcName) {
  // Intentar invocar la funcion RPC con argumentos minimos
  // Si la funcion no existe, Supabase retorna un error especifico
  const { error } = await supabase.rpc(funcName, {});

  if (error) {
    // La funcion no existe
    if (error.code === '42883' || error.message?.includes('Could not find the function')) {
      return false;
    }
    // Error de argumentos o permisos = la funcion SI existe
    return true;
  }

  return true;
}

async function checkView(viewName) {
  const { data, error } = await supabase
    .from(viewName)
    .select('*')
    .limit(0);

  if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
    return false;
  }
  return true;
}

// --- Ejecucion principal ---

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Verificacion de Esquema Multi-Tenant - Vocari          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  let totalChecks = 0;
  let passed = 0;
  let failed = 0;

  // 1. Verificar tablas
  console.log('--- Tablas ---');
  for (const table of EXPECTED_TABLES) {
    totalChecks++;
    const exists = await checkTable(table);
    if (exists) {
      console.log(`  ✅ ${table}`);
      passed++;
    } else {
      console.log(`  ❌ ${table} — NO EXISTE`);
      failed++;
    }
  }
  console.log('');

  // 2. Verificar columnas en user_profiles
  console.log('--- Columnas en user_profiles ---');
  const columnResults = await checkUserProfileColumns();
  for (const [col, exists] of Object.entries(columnResults)) {
    totalChecks++;
    if (exists) {
      console.log(`  ✅ ${col}`);
      passed++;
    } else {
      console.log(`  ❌ ${col} — NO EXISTE`);
      failed++;
    }
  }
  console.log('');

  // 3. Verificar funciones RPC
  console.log('--- Funciones RPC ---');
  for (const func of EXPECTED_FUNCTIONS) {
    totalChecks++;
    const exists = await checkFunction(func);
    if (exists) {
      console.log(`  ✅ ${func}()`);
      passed++;
    } else {
      console.log(`  ❌ ${func}() — NO EXISTE`);
      failed++;
    }
  }
  console.log('');

  // 4. Verificar vistas
  console.log('--- Vistas ---');
  for (const view of EXPECTED_VIEWS) {
    totalChecks++;
    const exists = await checkView(view);
    if (exists) {
      console.log(`  ✅ ${view}`);
      passed++;
    } else {
      console.log(`  ❌ ${view} — NO EXISTE`);
      failed++;
    }
  }
  console.log('');

  // Resumen
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  Total: ${totalChecks} | Presentes: ${passed} | Faltantes: ${failed}`);
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  if (failed === 0) {
    console.log('✅ Esquema multi-tenant COMPLETO. Todas las verificaciones pasaron.');
  } else if (passed === 0) {
    console.log('⚠️  Esquema multi-tenant NO instalado. Ejecuta el SQL:');
    console.log('');
    console.log('   1. Abre Supabase Dashboard > SQL Editor');
    console.log('   2. Copia y pega el contenido de:');
    console.log('      scripts/create-multi-tenant-institutions.sql');
    console.log('   3. Ejecuta el SQL');
    console.log('   4. Vuelve a correr: node scripts/verify-supabase-schema.js');
  } else {
    console.log(`⚠️  Esquema parcial: ${passed} de ${totalChecks} elementos presentes.`);
    console.log('   Puede que el SQL se haya ejecutado parcialmente.');
    console.log('   Revisa los errores arriba y re-ejecuta el SQL si es necesario.');
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
