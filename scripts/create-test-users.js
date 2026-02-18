/**
 * Script para crear usuarios de prueba y datos de test
 * Ejecute: npx supabase functions serve --env-file .env.local
 * o directamente con curl a la API de Supabase
 */

const SUPABASE_URL = 'https://cbtdgaptdpfhaufyijnd.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Reemplazar

async function createUser(email, role = 'estudiante') {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: crypto.randomUUID(),
      user_email: email,
      nombre: email.split('@')[0],
      role: role,
      status: 'active',
      edad: 17,
      genero: 'otro'
    })
  });
  
  return response.json();
}

// Lista de usuarios de prueba a crear
const TEST_USERS = [
  { email: 'estudiante@vocari.cl', role: 'estudiante', nombre: 'Estudiante Demo' },
  { email: 'orientador@vocari.cl', role: 'orientador', nombre: 'Orienta Demo' },
  { email: 'admin@vocari.cl', role: 'admin', nombre: 'Admin Demo' },
  { email: 'apoderado@vocari.cl', role: 'apoderado', nombre: 'Apoderado Demo' },
];

console.log('Para ejecutar este script necesita:');
console.log('1. Obtener service_role key de Supabase Dashboard');
console.log('2. Reemplazar SERVICE_ROLE_KEY en este archivo');
console.log('3. Ejecutar con node scripts/create-test-users.js');
