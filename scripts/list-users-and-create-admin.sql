-- ============================================
-- LISTAR USUARIOS Y CREAR ADMIN
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- PASO 1: Ver todos los usuarios registrados
-- ============================================
SELECT
  au.id as user_id,
  au.email,
  au.created_at as registered_at,
  up.nombre,
  up.role,
  up.status,
  CASE
    WHEN up.user_id IS NULL THEN '❌ Sin perfil'
    WHEN up.role = 'admin' THEN '👑 Admin'
    WHEN up.role = 'orientador' THEN '👨‍🏫 Orientador'
    WHEN up.role = 'apoderado' THEN '👨‍👩‍👧 Apoderado'
    WHEN up.role = 'estudiante' THEN '👨‍🎓 Estudiante'
    ELSE '⚠️ Sin rol'
  END as perfil
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at ASC;

-- PASO 2: Crear perfil de admin para un usuario específico
-- ============================================
-- Descomenta y ejecuta UNA de las siguientes opciones:

-- OPCIÓN A: Hacer admin al PRIMER usuario registrado
/*
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Obtener el primer usuario
  SELECT id, email INTO v_user_id, v_email
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Crear o actualizar perfil
  INSERT INTO user_profiles (
    user_id,
    user_email,
    nombre,
    role,
    status,
    edad,
    genero,
    motivaciones,
    approved_at
  )
  VALUES (
    v_user_id,
    v_email,
    'Administrador',
    'admin',
    'active',
    30,
    'Prefiero no decir',
    'Administrador del sistema OrientaIA',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'admin',
    status = 'active',
    approved_at = NOW();

  RAISE NOTICE '✅ Usuario % es ahora ADMIN', v_email;
END $$;
*/

-- OPCIÓN B: Hacer admin a un usuario por EMAIL
-- (Reemplaza 'tu-email@gmail.com' con tu email real)
/*
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'tu-email@gmail.com'; -- CAMBIA ESTO
BEGIN
  -- Buscar el user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un usuario con el email: %', v_email;
  END IF;

  -- Crear o actualizar perfil
  INSERT INTO user_profiles (
    user_id,
    user_email,
    nombre,
    role,
    status,
    edad,
    genero,
    motivaciones,
    approved_at
  )
  VALUES (
    v_user_id,
    v_email,
    'Administrador',
    'admin',
    'active',
    30,
    'Prefiero no decir',
    'Administrador del sistema OrientaIA',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'admin',
    status = 'active',
    approved_at = NOW();

  RAISE NOTICE '✅ Usuario % es ahora ADMIN', v_email;
END $$;
*/

-- OPCIÓN C: Hacer admin a un usuario por USER_ID
-- (Copia el user_id de la consulta del PASO 1)
/*
DO $$
DECLARE
  v_user_id UUID := 'PEGA-AQUI-EL-USER-ID'; -- CAMBIA ESTO
  v_email TEXT;
BEGIN
  -- Obtener el email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No se encontró un usuario con el ID: %', v_user_id;
  END IF;

  -- Crear o actualizar perfil
  INSERT INTO user_profiles (
    user_id,
    user_email,
    nombre,
    role,
    status,
    edad,
    genero,
    motivaciones,
    approved_at
  )
  VALUES (
    v_user_id,
    v_email,
    'Administrador',
    'admin',
    'active',
    30,
    'Prefiero no decir',
    'Administrador del sistema OrientaIA',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'admin',
    status = 'active',
    approved_at = NOW();

  RAISE NOTICE '✅ Usuario % es ahora ADMIN', v_email;
END $$;
*/
