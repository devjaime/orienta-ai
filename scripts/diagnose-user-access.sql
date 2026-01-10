-- ============================================
-- DIAGNÓSTICO: Verificar acceso de usuario
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Diagnostica por qué un usuario no puede acceder

-- ============================================
-- PASO 1: Ver todos los usuarios y sus perfiles
-- ============================================

SELECT
  'USUARIOS REGISTRADOS' as seccion,
  au.id as user_id,
  au.email,
  au.created_at as auth_created,
  up.nombre,
  up.role,
  up.status,
  up.created_at as profile_created,
  CASE
    WHEN up.user_id IS NULL THEN '❌ SIN PERFIL - Ejecuta create-first-admin.sql'
    WHEN up.role IS NULL THEN '⚠️ SIN ROL - Usuario pendiente'
    WHEN up.status != 'active' THEN '🔒 INACTIVO - Status: ' || up.status
    WHEN up.role = 'admin' AND up.status = 'active' THEN '✅ ADMIN ACTIVO'
    WHEN up.role = 'orientador' AND up.status = 'active' THEN '✅ ORIENTADOR ACTIVO'
    WHEN up.role = 'apoderado' AND up.status = 'active' THEN '✅ APODERADO ACTIVO'
    WHEN up.role = 'estudiante' AND up.status = 'active' THEN '✅ ESTUDIANTE ACTIVO'
    ELSE '⚠️ ESTADO DESCONOCIDO'
  END as diagnostico
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at ASC;

-- ============================================
-- PASO 2: Verificar políticas RLS
-- ============================================

SELECT
  'POLÍTICAS RLS ACTUALES' as seccion,
  policyname as politica,
  cmd as comando,
  CASE
    WHEN policyname LIKE '%select%' OR policyname LIKE '%own_profile%' THEN 'Lectura de perfil'
    WHEN policyname LIKE '%insert%' THEN 'Creación de perfil'
    WHEN policyname LIKE '%update%' THEN 'Actualización de perfil'
    WHEN policyname LIKE '%delete%' THEN 'Eliminación de perfil'
    ELSE 'Otro'
  END as proposito
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- PASO 3: Verificar si RLS está habilitado
-- ============================================

SELECT
  'CONFIGURACIÓN RLS' as seccion,
  tablename as tabla,
  rowsecurity as rls_habilitado,
  CASE
    WHEN rowsecurity THEN '✅ RLS está habilitado (correcto)'
    ELSE '❌ RLS NO está habilitado (problema de seguridad)'
  END as diagnostico
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_profiles';

-- ============================================
-- PASO 4: Soluciones recomendadas
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         DIAGNÓSTICO DE ACCESO - SOLUCIONES        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';

  -- Verificar si hay usuarios sin perfil
  IF EXISTS (
    SELECT 1 FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.user_id
    WHERE up.user_id IS NULL
  ) THEN
    RAISE NOTICE '❌ PROBLEMA 1: Hay usuarios sin perfil en user_profiles';
    RAISE NOTICE '   SOLUCIÓN: Ejecuta scripts/create-first-admin.sql';
    RAISE NOTICE '';
  END IF;

  -- Verificar políticas RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname LIKE '%select%'
  ) THEN
    RAISE NOTICE '❌ PROBLEMA 2: No hay políticas SELECT en user_profiles';
    RAISE NOTICE '   SOLUCIÓN: Ejecuta scripts/fix-rls-policies.sql';
    RAISE NOTICE '';
  END IF;

  -- Verificar usuarios inactivos
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE status != 'active'
    AND role IS NOT NULL
  ) THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: Hay usuarios con rol pero status != active';
    RAISE NOTICE '   SOLUCIÓN: Actualiza el status a active:';
    RAISE NOTICE '   UPDATE user_profiles SET status = ''active'' WHERE user_email = ''tu-email@gmail.com'';';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '✅ Después de aplicar las soluciones:';
  RAISE NOTICE '   1. Cierra sesión en la aplicación';
  RAISE NOTICE '   2. Borra el caché del navegador (Ctrl+Shift+Delete)';
  RAISE NOTICE '   3. Vuelve a iniciar sesión';
  RAISE NOTICE '';
END $$;
