-- ============================================
-- SOLUCIÓN DE EMERGENCIA: Recursión Infinita en RLS
-- ============================================
-- Ejecutar INMEDIATAMENTE en: Supabase Dashboard > SQL Editor

-- PASO 1: Eliminar TODAS las políticas que causan recursión
DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios ven solo su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios ven su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios activos ven su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios crean solo su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios crean su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios actualizan solo su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios activos actualizan su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Admins ven todos los usuarios" ON user_profiles;
DROP POLICY IF EXISTS "Admins actualizan usuarios" ON user_profiles;

-- PASO 2: Crear políticas SIMPLES sin recursión

-- POLICY 1: SELECT - Los usuarios ven SOLO su propio perfil
CREATE POLICY "select_own_profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- POLICY 2: INSERT - Los usuarios pueden crear su propio perfil
CREATE POLICY "insert_own_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY 3: UPDATE - Los usuarios pueden actualizar su propio perfil
CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- POLICY 4: DELETE - Nadie puede eliminar perfiles (seguridad)
-- Si necesitas eliminar, lo harás directamente desde el SQL Editor

-- PASO 3: Asegurarse de que RLS esté habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RECURSIÓN INFINITA CORREGIDA';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Políticas nuevas (SIN recursión):';
  RAISE NOTICE '   1. select_own_profile - Usuarios ven SOLO su perfil';
  RAISE NOTICE '   2. insert_own_profile - Usuarios pueden crear su perfil';
  RAISE NOTICE '   3. update_own_profile - Usuarios pueden actualizar su perfil';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '   - Ahora los usuarios solo ven su propio perfil';
  RAISE NOTICE '   - Los admins/orientadores NO ven otros perfiles automáticamente';
  RAISE NOTICE '   - Esto es más seguro y evita la recursión';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Recarga la aplicación (Ctrl+Shift+R)';
END $$;
