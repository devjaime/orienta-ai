-- ============================================
-- ARREGLAR POLÍTICAS RLS - user_profiles
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Elimina políticas antiguas y crea las nuevas correctamente

-- ============================================
-- ELIMINAR TODAS LAS POLÍTICAS ANTIGUAS
-- ============================================

DO $$
BEGIN
  -- Eliminar políticas si existen
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

  RAISE NOTICE '🗑️  Políticas antiguas eliminadas';
END $$;

-- ============================================
-- CREAR NUEVAS POLÍTICAS RLS
-- ============================================

-- POLICY 1: Los usuarios pueden ver su propio perfil
-- También los orientadores y admins pueden ver todos los perfiles
CREATE POLICY "users_select_own_profile"
  ON user_profiles FOR SELECT
  USING (
    -- El usuario ve su propio perfil
    auth.uid() = user_id
    OR
    -- Los orientadores y admins pueden ver todos los perfiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('orientador', 'admin')
      AND up.status = 'active'
    )
  );

-- POLICY 2: Los usuarios pueden crear su propio perfil
CREATE POLICY "users_insert_own_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY 3: Los usuarios pueden actualizar su propio perfil
-- (pero no pueden cambiar su rol o status sin ser admin)
CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    -- Los admins pueden actualizar cualquier perfil
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.status = 'active'
    )
  );

-- POLICY 4: Los admins pueden hacer DELETE (opcional, por si acaso)
CREATE POLICY "admins_delete_profiles"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.status = 'active'
    )
  );

-- ============================================
-- VERIFICAR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Políticas creadas:';
  RAISE NOTICE '   1. users_select_own_profile - Usuarios ven su perfil, orientadores/admins ven todos';
  RAISE NOTICE '   2. users_insert_own_profile - Usuarios pueden crear su perfil';
  RAISE NOTICE '   3. users_update_own_profile - Usuarios actualizan su perfil, admins actualizan cualquiera';
  RAISE NOTICE '   4. admins_delete_profiles - Solo admins pueden eliminar perfiles';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Row Level Security está HABILITADO';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Cierra sesión y vuelve a iniciar sesión en la app';
END $$;

-- ============================================
-- VERIFICAR POLÍTICAS
-- ============================================

-- Ver todas las políticas de user_profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
