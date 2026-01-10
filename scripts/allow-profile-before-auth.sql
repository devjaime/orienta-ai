-- ============================================
-- PERMITIR CREAR PERFILES ANTES DEL REGISTRO
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Permite al admin crear perfiles antes de que el usuario
--              se registre con Google. Cuando el usuario se registre,
--              se vinculará automáticamente.

-- ============================================
-- PASO 1: Modificar función admin_create_user_profile
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
  v_profile_id UUID;
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

  -- Verificar si ya existe el perfil con este email
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_email = p_email) THEN
    RAISE EXCEPTION 'Ya existe un perfil con el email: %', p_email;
  END IF;

  -- Crear el perfil (con o sin user_id)
  -- Si el usuario aún no se ha registrado, user_id será NULL
  -- Cuando se registre, un trigger lo vinculará automáticamente
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
    v_user_id,  -- NULL si no está registrado, UUID si ya existe
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
  )
  RETURNING id INTO v_profile_id;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '✅ Perfil creado (pendiente de registro): % (rol: %)', p_email, p_role;
    RAISE NOTICE '   El usuario debe registrarse con Google usando el email: %', p_email;
  ELSE
    RAISE NOTICE '✅ Perfil creado y vinculado: % (rol: %)', p_email, p_role;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_create_user_profile IS 'Crea perfil de usuario (puede crearse antes del registro con Google)';

-- ============================================
-- PASO 2: Permitir user_id NULL temporalmente
-- ============================================

-- Modificar constraint para permitir NULL en user_id (temporalmente)
-- Nota: El unique constraint en user_id debe cambiar a permitir múltiples NULL
-- pero solo un valor por user_id no-NULL

DO $$
BEGIN
  -- Eliminar constraint UNIQUE en user_id si existe
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'user_profiles'
    AND constraint_name LIKE '%user_id%'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
  END IF;

  RAISE NOTICE '✅ Constraint UNIQUE en user_id eliminado';
END $$;

-- Crear índice parcial para mantener unicidad cuando user_id NO es NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique
ON user_profiles(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_user_profiles_user_id_unique IS 'Asegura que cada user_id tenga máximo un perfil (permite múltiples NULL)';

-- ============================================
-- PASO 3: Trigger para vincular al registrarse
-- ============================================

-- Función que se ejecuta cuando un usuario se registra con Google
CREATE OR REPLACE FUNCTION link_profile_on_auth_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_record RECORD;
BEGIN
  -- Buscar si existe un perfil con este email que aún no está vinculado
  SELECT *
  INTO v_profile_record
  FROM user_profiles
  WHERE user_email = NEW.email
  AND user_id IS NULL
  LIMIT 1;

  -- Si existe un perfil pendiente, vincularlo
  IF FOUND THEN
    UPDATE user_profiles
    SET user_id = NEW.id
    WHERE id = v_profile_record.id;

    RAISE NOTICE '✅ Perfil vinculado automáticamente: % → %', NEW.email, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger en auth.users (si es posible)
-- Nota: En Supabase, puede que no tengamos permisos directos en auth.users
-- En ese caso, esto se manejará desde el código de la app

-- ============================================
-- PASO 4: Función auxiliar para vincular manualmente
-- ============================================

CREATE OR REPLACE FUNCTION link_user_to_profile(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
BEGIN
  -- Buscar user_id por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe usuario con email: %', p_email;
  END IF;

  -- Buscar perfil pendiente
  SELECT id INTO v_profile_id
  FROM user_profiles
  WHERE user_email = p_email
  AND user_id IS NULL;

  IF v_profile_id IS NULL THEN
    RAISE NOTICE 'No hay perfil pendiente para: %', p_email;
    RETURN FALSE;
  END IF;

  -- Vincular
  UPDATE user_profiles
  SET user_id = v_user_id
  WHERE id = v_profile_id;

  RAISE NOTICE '✅ Perfil vinculado: % → %', p_email, v_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION link_user_to_profile TO authenticated;

COMMENT ON FUNCTION link_user_to_profile IS 'Vincula manualmente un perfil pendiente a un usuario registrado';

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ PERFILES ANTES DEL REGISTRO - CONFIGURADO     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Nuevo flujo:';
  RAISE NOTICE '   1. Admin crea perfil con email (usuario no existe aún)';
  RAISE NOTICE '   2. Usuario va a landing y hace Google Sign-in';
  RAISE NOTICE '   3. Sistema vincula automáticamente el perfil';
  RAISE NOTICE '   4. Usuario accede a su dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Función auxiliar:';
  RAISE NOTICE '   SELECT link_user_to_profile(''email@example.com'');';
  RAISE NOTICE '   (vincula manualmente si el trigger no funciona)';
  RAISE NOTICE '';
END $$;
