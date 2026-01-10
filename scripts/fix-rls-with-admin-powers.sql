-- ============================================
-- POLÍTICAS RLS CORRECTAS CON PODERES DE ADMIN
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Solución: Evitar recursión usando funciones SECURITY DEFINER

-- ============================================
-- PASO 1: Eliminar TODAS las políticas antiguas
-- ============================================

DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
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

-- ============================================
-- PASO 2: Crear función helper para verificar si es admin
-- ============================================
-- Esta función se ejecuta con privilegios de superusuario (SECURITY DEFINER)
-- y NO causa recursión porque no consulta a través de las políticas RLS

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si el usuario actual es admin activo
  -- Se ejecuta con SECURITY DEFINER, evitando las políticas RLS
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin IS 'Verifica si el usuario actual es admin activo (SECURITY DEFINER evita recursión RLS)';

-- ============================================
-- PASO 3: Crear función helper para verificar si es orientador
-- ============================================

CREATE OR REPLACE FUNCTION public.is_orientador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('orientador', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_orientador() TO authenticated;

COMMENT ON FUNCTION public.is_orientador IS 'Verifica si el usuario actual es orientador o admin activo';

-- ============================================
-- PASO 4: Crear NUEVAS políticas RLS sin recursión
-- ============================================

-- POLICY 1: SELECT - Ver perfiles
-- Los usuarios ven su propio perfil
-- Los admins y orientadores ven todos los perfiles (usando la función helper)
CREATE POLICY "rls_select_profiles"
  ON user_profiles FOR SELECT
  USING (
    -- Ver su propio perfil
    auth.uid() = user_id
    OR
    -- O ser admin/orientador (sin recursión)
    public.is_admin()
    OR
    public.is_orientador()
  );

-- POLICY 2: INSERT - Crear perfiles
-- Los usuarios pueden crear su propio perfil
-- Los admins pueden crear perfiles de otros
CREATE POLICY "rls_insert_profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    -- Crear su propio perfil
    auth.uid() = user_id
    OR
    -- O ser admin
    public.is_admin()
  );

-- POLICY 3: UPDATE - Actualizar perfiles
-- Los usuarios pueden actualizar su propio perfil
-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "rls_update_profiles"
  ON user_profiles FOR UPDATE
  USING (
    -- Actualizar su propio perfil
    auth.uid() = user_id
    OR
    -- O ser admin
    public.is_admin()
  );

-- POLICY 4: DELETE - Eliminar perfiles
-- Solo los admins pueden eliminar perfiles
CREATE POLICY "rls_delete_profiles"
  ON user_profiles FOR DELETE
  USING (public.is_admin());

-- ============================================
-- PASO 5: Asegurar que RLS esté habilitado
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 6: Agregar constraint para máximo 5 estudiantes por apoderado
-- ============================================

-- Función para verificar límite de estudiantes por apoderado
CREATE OR REPLACE FUNCTION check_parent_student_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_student_count INTEGER;
BEGIN
  -- Contar cuántos estudiantes tiene este apoderado
  SELECT COUNT(*)
  INTO v_student_count
  FROM parent_student_links
  WHERE parent_id = NEW.parent_id
  AND status = 'accepted';

  -- Verificar si excede el límite de 5
  IF v_student_count >= 5 THEN
    RAISE EXCEPTION 'Un apoderado no puede tener más de 5 estudiantes vinculados';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para verificar límite antes de insertar/actualizar
DROP TRIGGER IF EXISTS trigger_check_parent_student_limit ON parent_student_links;
CREATE TRIGGER trigger_check_parent_student_limit
  BEFORE INSERT OR UPDATE ON parent_student_links
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION check_parent_student_limit();

COMMENT ON FUNCTION check_parent_student_limit IS 'Verifica que un apoderado no tenga más de 5 estudiantes vinculados';

-- ============================================
-- PASO 7: Función para que admin cree perfiles
-- ============================================

CREATE OR REPLACE FUNCTION admin_create_user_profile(
  p_email TEXT,
  p_nombre TEXT,
  p_role TEXT,
  p_edad INTEGER DEFAULT 18,
  p_genero TEXT DEFAULT 'Prefiero no decir',
  p_telefono TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID := auth.uid();
BEGIN
  -- Verificar que quien ejecuta es admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden crear perfiles de usuario';
  END IF;

  -- Verificar que el rol es válido
  IF p_role NOT IN ('estudiante', 'apoderado', 'orientador', 'admin') THEN
    RAISE EXCEPTION 'Rol inválido: %. Debe ser: estudiante, apoderado, orientador, admin', p_role;
  END IF;

  -- Buscar si el usuario ya existe en auth.users por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Si no existe en auth.users, crear la invitación
  IF v_user_id IS NULL THEN
    -- Nota: Supabase no permite crear usuarios desde SQL directamente
    -- El admin debe invitar al usuario por email desde el dashboard
    RAISE EXCEPTION 'El usuario con email % no existe. Primero debe registrarse con Google.', p_email;
  END IF;

  -- Verificar si ya existe el perfil
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'El usuario % ya tiene un perfil creado', p_email;
  END IF;

  -- Crear el perfil
  INSERT INTO user_profiles (
    user_id,
    user_email,
    nombre,
    role,
    status,
    edad,
    genero,
    telefono,
    motivaciones,
    approved_by,
    approved_at
  )
  VALUES (
    v_user_id,
    p_email,
    p_nombre,
    p_role,
    'active', -- Admin crea usuarios directamente activos
    p_edad,
    p_genero,
    p_telefono,
    'Creado por administrador',
    v_admin_id,
    NOW()
  );

  RAISE NOTICE '✅ Perfil creado exitosamente para: % (rol: %)', p_email, p_role;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_create_user_profile TO authenticated;

COMMENT ON FUNCTION admin_create_user_profile IS 'Permite al admin crear perfiles de usuario (orientador, apoderado, estudiante)';

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   ✅ POLÍTICAS RLS CORREGIDAS (SIN RECURSIÓN)     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Funciones creadas:';
  RAISE NOTICE '   • is_admin() - Verifica si es admin (SECURITY DEFINER)';
  RAISE NOTICE '   • is_orientador() - Verifica si es orientador/admin';
  RAISE NOTICE '   • admin_create_user_profile() - Admin crea perfiles';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Políticas RLS:';
  RAISE NOTICE '   1. rls_select_profiles - Ver perfiles';
  RAISE NOTICE '   2. rls_insert_profiles - Crear perfiles';
  RAISE NOTICE '   3. rls_update_profiles - Actualizar perfiles';
  RAISE NOTICE '   4. rls_delete_profiles - Eliminar perfiles (solo admin)';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Límite de apoderados:';
  RAISE NOTICE '   • Máximo 5 estudiantes por apoderado';
  RAISE NOTICE '   • Trigger automático verifica el límite';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Cómo usar:';
  RAISE NOTICE '   -- El admin crea un perfil para un usuario ya registrado:';
  RAISE NOTICE '   SELECT admin_create_user_profile(';
  RAISE NOTICE '     p_email := ''usuario@gmail.com'',';
  RAISE NOTICE '     p_nombre := ''Juan Pérez'',';
  RAISE NOTICE '     p_role := ''orientador'',';
  RAISE NOTICE '     p_edad := 35,';
  RAISE NOTICE '     p_telefono := ''+56912345678''';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 IMPORTANTE: Recarga la aplicación con Ctrl+Shift+R';
END $$;
