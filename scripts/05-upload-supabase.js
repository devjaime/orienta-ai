/**
 * Script para subir carreras enriquecidas a Supabase
 *
 * Entrada: data/processed/carreras-enriquecidas.json
 * Salida: Tabla carreras_enriquecidas en Supabase
 *
 * Requisitos:
 *   - Variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *   - Tabla carreras_enriquecidas creada en Supabase (ver SQL en INTEGRACION_MINEDUC.md)
 *
 * Ejecutar: node scripts/05-upload-supabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
config();

const INPUT_FILE = path.join(__dirname, '../data/processed/carreras-enriquecidas.json');

/**
 * Valida variables de entorno
 */
function validateEnv() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Faltan variables de entorno:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n💡 Crea un archivo .env con:');
    console.log('   VITE_SUPABASE_URL=tu_url');
    console.log('   VITE_SUPABASE_ANON_KEY=tu_key\n');
    process.exit(1);
  }
}

/**
 * Transforma carrera al formato de la tabla Supabase
 */
function transformToSupabaseFormat(carrera) {
  return {
    nombre: carrera.nombre,
    codigo_holland: carrera.codigo_holland,
    dimension_principal: carrera.dimension_principal,
    area: carrera.area,

    // Datos básicos
    duracion_anos_oficial: carrera.duracion_anos,
    nivel_matematicas: carrera.nivel_matematicas,
    empleabilidad: carrera.empleabilidad,
    salario_promedio_estimado: carrera.salario_promedio_chile_clp,
    descripcion: carrera.descripcion,
    perfil_ideal: carrera.perfil_ideal,

    // Arrays
    universidades_destacadas: carrera.universidades_destacadas,
    campos_laborales: carrera.campos_laborales,

    // Datos MINEDUC (si existen)
    matricula_actual: carrera.mineduc_data?.matricula_actual || null,
    matricula_ano: new Date().getFullYear() - 1, // Año de los datos
    crecimiento_anual: null, // Calcular si se tienen múltiples años
    titulados_ultimo_ano: carrera.mineduc_data?.titulados_ultimo_ano || null,
    instituciones_ofrecen_count: carrera.mineduc_data?.instituciones_count || null,
    tasa_titulacion: carrera.mineduc_data?.tasa_titulacion || null,
    duracion_real_promedio: carrera.mineduc_data?.duracion_real_anos || null,

    // Metadatos
    fuente_datos_mineduc: carrera.mineduc_data?.fuente || null,
    fecha_actualizacion_mineduc: carrera.mineduc_data?.fecha_actualizacion || null,
    updated_at: new Date().toISOString()
  };
}

/**
 * Sube datos a Supabase
 */
async function uploadToSupabase(carreras) {
  console.log('📦 Importando Supabase client...');

  // Importación dinámica de ESM
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  console.log('✅ Cliente Supabase inicializado\n');

  const resultados = {
    total: carreras.length,
    insertados: 0,
    actualizados: 0,
    errores: 0,
    errores_detalle: []
  };

  console.log(`📤 Subiendo ${carreras.length} carreras a Supabase...\n`);

  for (const carrera of carreras) {
    try {
      const data = transformToSupabaseFormat(carrera);

      // Usar upsert para insertar o actualizar
      const { error } = await supabase
        .from('carreras_enriquecidas')
        .upsert(data, {
          onConflict: 'nombre', // Nombre es UNIQUE en la tabla
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      // Asumir que es inserción (en la práctica, upsert no distingue)
      resultados.insertados++;
      console.log(`   ✅ ${carrera.nombre}`);

    } catch (error) {
      resultados.errores++;
      resultados.errores_detalle.push({
        carrera: carrera.nombre,
        error: error.message
      });
      console.error(`   ❌ ${carrera.nombre}: ${error.message}`);
    }
  }

  // Registrar en log de sincronización
  try {
    await supabase
      .from('mineduc_sync_log')
      .insert({
        sync_date: new Date().toISOString(),
        dataset_name: 'Carreras Enriquecidas',
        records_processed: resultados.total,
        records_updated: resultados.insertados,
        status: resultados.errores > 0 ? 'parcial' : 'exitoso',
        error_message: resultados.errores > 0
          ? `${resultados.errores} errores encontrados`
          : null
      });
  } catch (error) {
    console.warn('\n⚠️  No se pudo registrar en mineduc_sync_log:', error.message);
  }

  return resultados;
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Iniciando carga a Supabase\n');

  // Validar entorno
  validateEnv();

  // Verificar archivo
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ No se encontró: ${INPUT_FILE}`);
    console.log('   Ejecuta primero: node scripts/04-merge-carreras.js');
    process.exit(1);
  }

  // Cargar datos
  console.log('📂 Cargando carreras enriquecidas...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const carreras = data.carreras || data;

  console.log(`   ✅ ${carreras.length} carreras cargadas\n`);

  // Confirmar
  console.log('⚠️  Esta operación subirá/actualizará datos en Supabase');
  console.log(`   Tabla: carreras_enriquecidas`);
  console.log(`   Registros: ${carreras.length}\n`);

  // En producción, agregar confirmación interactiva
  // Para este script, proceder automáticamente

  // Subir
  const resultados = await uploadToSupabase(carreras);

  // Resumen
  console.log('\n\n📊 RESUMEN DE CARGA');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📝 Total procesados: ${resultados.total}`);
  console.log(`✅ Exitosos: ${resultados.insertados}`);
  console.log(`❌ Errores: ${resultados.errores}`);

  if (resultados.errores > 0) {
    console.log('\n⚠️  Detalles de errores:');
    resultados.errores_detalle.forEach(({ carrera, error }) => {
      console.log(`   - ${carrera}: ${error}`);
    });
  }

  console.log('\n✅ ¡Carga completada!');

  if (resultados.errores === 0) {
    console.log('\n🎉 Todas las carreras fueron cargadas exitosamente');
    console.log('\n📝 Próximo paso: Actualizar el código de la app para usar estos datos');
    console.log('   Ver sección "Uso en la Aplicación" en INTEGRACION_MINEDUC.md\n');
  } else {
    console.log('\n⚠️  Algunas carreras no se pudieron cargar');
    console.log('   Revisa los errores arriba y verifica la estructura de la tabla\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
