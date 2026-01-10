-- ============================================
-- CONTROL DE ESTADOS Y APROBACIONES DE USUARIOS
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Agrega control de estados, aprobaciones y gestión de roles
--              para asegurar que solo usuarios autorizados accedan al sistema

-- ============================================
-- ACTUALIZAR TABLA user_profiles
-- ============================================

-- Agregar columnas de control de estado
DO $$
BEGIN
  -- Estado del usuario
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (
      status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')
    );

    -- Actualizar usuarios existentes a 'active' si ya tienen un rol asignado
    UPDATE user_profiles SET status = 'active' WHERE role IS NOT NULL;
  END IF;

  -- Campo de aprobación
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Campo para notas del administrador
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN admin_notes TEXT;
  END IF;

  -- Campo para indicar si el usuario solicitó ser orientador/apoderado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'requested_role'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN requested_role TEXT CHECK (
      requested_role IS NULL OR requested_role IN ('estudiante', 'apoderado', 'orientador', 'admin')
    );
  END IF;

  RAISE NOTICE 'Columnas de control de estado agregadas a user_profiles';
END $$;

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_requested_role ON user_profiles(requested_role);

-- ============================================
-- FUNCIÓN: Aprobar usuario y asignar rol
-- ============================================

CREATE OR REPLACE FUNCTION approve_user_with_role(
  p_user_id UUID,
  p_role TEXT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el admin tenga permisos
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_admin_id
    AND role = 'admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Verificar que el rol sea válido
  IF p_role NOT IN ('estudiante', 'apoderado', 'orientador', 'admin') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_role;
  END IF;

  -- Aprobar usuario y asignar rol
  UPDATE user_profiles
  SET
    role = p_role,
    status = 'active',
    approved_by = p_admin_id,
    approved_at = NOW(),
    admin_notes = p_notes,
    requested_role = NULL -- Limpiar solicitud
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION approve_user_with_role IS 'Aprueba un usuario y le asigna un rol (solo admins)';

-- ============================================
-- FUNCIÓN: Rechazar usuario
-- ============================================

CREATE OR REPLACE FUNCTION reject_user_request(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el admin tenga permisos
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_admin_id
    AND role = 'admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Rechazar usuario
  UPDATE user_profiles
  SET
    status = 'rejected',
    approved_by = p_admin_id,
    approved_at = NOW(),
    rejection_reason = p_reason,
    requested_role = NULL
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION reject_user_request IS 'Rechaza la solicitud de un usuario (solo admins)';

-- ============================================
-- FUNCIÓN: Cambiar estado de usuario
-- ============================================

CREATE OR REPLACE FUNCTION change_user_status(
  p_user_id UUID,
  p_admin_id UUID,
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el admin tenga permisos
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_admin_id
    AND role = 'admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Verificar que el estado sea válido
  IF p_new_status NOT IN ('pending', 'active', 'inactive', 'suspended', 'rejected') THEN
    RAISE EXCEPTION 'Estado inválido: %', p_new_status;
  END IF;

  -- Prevenir que el admin se suspenda a sí mismo
  IF p_user_id = p_admin_id AND p_new_status IN ('inactive', 'suspended') THEN
    RAISE EXCEPTION 'No puedes desactivarte a ti mismo';
  END IF;

  -- Cambiar estado
  UPDATE user_profiles
  SET
    status = p_new_status,
    admin_notes = COALESCE(p_reason, admin_notes)
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION change_user_status IS 'Cambia el estado de un usuario (solo admins)';

-- ============================================
-- FUNCIÓN: Cambiar rol de usuario
-- ============================================

CREATE OR REPLACE FUNCTION change_user_role(
  p_user_id UUID,
  p_admin_id UUID,
  p_new_role TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el admin tenga permisos
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_admin_id
    AND role = 'admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Verificar que el rol sea válido
  IF p_new_role NOT IN ('estudiante', 'apoderado', 'orientador', 'admin') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_new_role;
  END IF;

  -- Prevenir que el último admin cambie su propio rol
  IF p_user_id = p_admin_id THEN
    IF (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin' AND status = 'active') <= 1 THEN
      RAISE EXCEPTION 'No puedes cambiar tu rol siendo el único administrador activo';
    END IF;
  END IF;

  -- Cambiar rol
  UPDATE user_profiles
  SET
    role = p_new_role,
    admin_notes = COALESCE(p_reason, admin_notes)
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION change_user_role IS 'Cambia el rol de un usuario (solo admins)';

-- ============================================
-- FUNCIÓN: Obtener usuarios pendientes de aprobación
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  nombre TEXT,
  requested_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  edad INTEGER,
  genero TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    up.user_email,
    up.nombre,
    up.requested_role,
    up.created_at,
    up.edad,
    up.genero
  FROM user_profiles up
  WHERE up.status = 'pending'
  AND up.requested_role IS NOT NULL
  ORDER BY up.created_at ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_users IS 'Obtiene lista de usuarios pendientes de aprobación';

-- ============================================
-- VISTA: Gestión de usuarios (para admins)
-- ============================================

CREATE OR REPLACE VIEW admin_users_management AS
SELECT
  up.user_id,
  up.user_email as email,
  up.nombre,
  up.role,
  up.status,
  up.requested_role,
  up.created_at,
  up.approved_at,
  up.approved_by,
  ap.nombre as approved_by_name,
  up.edad,
  up.genero,
  up.telefono,
  up.admin_notes,
  up.rejection_reason,

  -- Estadísticas del usuario
  (SELECT COUNT(*) FROM test_results WHERE user_id = up.user_id) as total_tests,
  (SELECT COUNT(*) FROM scheduled_sessions WHERE user_id = up.user_id) as total_sessions,
  (SELECT MAX(created_at) FROM audit_log WHERE user_id = up.user_id) as last_activity

FROM user_profiles up
LEFT JOIN user_profiles ap ON up.approved_by = ap.user_id
ORDER BY up.created_at DESC;

COMMENT ON VIEW admin_users_management IS 'Vista completa para gestión de usuarios por admins';

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS
-- ============================================

-- Policy: Solo usuarios activos pueden acceder
DROP POLICY IF EXISTS "Usuarios ven su perfil" ON user_profiles;
CREATE POLICY "Usuarios activos ven su perfil"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'orientador')
      AND status = 'active'
    )
  );

-- Policy: Solo usuarios activos pueden actualizar su perfil
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON user_profiles;
CREATE POLICY "Usuarios activos actualizan su perfil"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('active', 'pending')
  )
  WITH CHECK (
    auth.uid() = user_id
    -- Los usuarios no pueden cambiar su propio rol o estado
    AND role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())
    AND status = (SELECT status FROM user_profiles WHERE user_id = auth.uid())
  );

-- Policy: Admins pueden ver todos los usuarios
CREATE POLICY "Admins ven todos los usuarios"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Policy: Admins pueden actualizar cualquier usuario
CREATE POLICY "Admins actualizan usuarios"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- ============================================
-- TRIGGER: Prevenir que usuarios cambien su propio rol/estado
-- ============================================

CREATE OR REPLACE FUNCTION prevent_self_role_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario intenta cambiar su propio rol o estado, revertir
  IF NEW.user_id = auth.uid() THEN
    IF NEW.role != OLD.role OR NEW.status != OLD.status THEN
      -- Solo permitir si es admin (para casos especiales)
      IF NOT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
      ) THEN
        NEW.role := OLD.role;
        NEW.status := OLD.status;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_self_role_status_change ON user_profiles;
CREATE TRIGGER trigger_prevent_self_role_status_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_role_status_change();

-- ============================================
-- FUNCIÓN: Registrar nuevo usuario con rol solicitado
-- ============================================

CREATE OR REPLACE FUNCTION register_user_with_requested_role(
  p_user_id UUID,
  p_email TEXT,
  p_nombre TEXT,
  p_requested_role TEXT,
  p_edad INTEGER DEFAULT NULL,
  p_genero TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_status TEXT;
  v_role TEXT;
BEGIN
  -- Determinar si auto-aprobar o requiere aprobación
  IF p_requested_role = 'estudiante' THEN
    -- Estudiantes se auto-aprueban
    v_status := 'active';
    v_role := 'estudiante';
  ELSE
    -- Orientadores y apoderados requieren aprobación
    v_status := 'pending';
    v_role := NULL; -- Sin rol hasta ser aprobado
  END IF;

  -- Insertar o actualizar perfil
  INSERT INTO user_profiles (
    user_id,
    user_email,
    nombre,
    role,
    status,
    requested_role,
    edad,
    genero
  )
  VALUES (
    p_user_id,
    p_email,
    p_nombre,
    v_role,
    v_status,
    CASE WHEN v_role IS NULL THEN p_requested_role ELSE NULL END,
    p_edad,
    p_genero
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    user_email = EXCLUDED.user_email,
    nombre = EXCLUDED.nombre,
    requested_role = EXCLUDED.requested_role,
    edad = EXCLUDED.edad,
    genero = EXCLUDED.genero;

  RETURN p_user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION register_user_with_requested_role IS 'Registra un nuevo usuario con rol solicitado (estudiantes auto-aprobados, otros requieren aprobación admin)';

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de control de estados y aprobaciones creado';
  RAISE NOTICE '📊 Estados disponibles: pending, active, inactive, suspended, rejected';
  RAISE NOTICE '👥 Flujo: estudiantes auto-aprobados, orientadores/apoderados requieren aprobación';
  RAISE NOTICE '🔒 Políticas RLS actualizadas para verificar estado activo';
  RAISE NOTICE '';
  RAISE NOTICE 'Siguiente paso: Crear adminService.js para gestión de usuarios';
END $$;
