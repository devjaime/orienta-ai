-- ============================================
-- CREAR PRIMER ADMINISTRADOR
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Crea el perfil de administrador para el primer usuario

-- IMPORTANTE: Reemplaza 'TU-EMAIL@GMAIL.COM' con tu email real de Google

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'TU-EMAIL@GMAIL.COM'; -- CAMBIA ESTO POR TU EMAIL
BEGIN
  -- Buscar el user_id en auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un usuario con el email: %', v_email;
  END IF;

  -- Verificar si ya existe el perfil
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_user_id) THEN
    -- Si existe, actualizar a admin
    UPDATE user_profiles
    SET
      role = 'admin',
      status = 'active',
      approved_at = NOW()
    WHERE user_id = v_user_id;

    RAISE NOTICE '✅ Perfil existente actualizado a ADMIN';
  ELSE
    -- Si no existe, crear nuevo perfil de admin
    INSERT INTO user_profiles (
      user_id,
      user_email,
      nombre,
      role,
      status,
      edad,
      genero,
      motivaciones,
      approved_at,
      created_at
    )
    VALUES (
      v_user_id,
      v_email,
      'Administrador', -- Puedes cambiar este nombre
      'admin',
      'active',
      30, -- Edad por defecto
      'Prefiero no decir',
      'Administrador del sistema OrientaIA',
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Nuevo perfil de ADMIN creado exitosamente';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Usuario: %', v_email;
  RAISE NOTICE 'Rol: admin';
  RAISE NOTICE 'Estado: active';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ¡Ahora puedes acceder al panel de administrador en /admin!';
END $$;
