-- ============================================
-- DESACTIVACIÓN Y ACCESO TEMPORAL DE USUARIOS
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Permite desactivar usuarios y dar acceso temporal (30, 15, 10 días)

-- ============================================
-- PASO 1: Agregar campo de expiración
-- ============================================

DO $$
BEGIN
  -- Campo expires_at para acceso temporal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  RAISE NOTICE '✅ Campo expires_at agregado a user_profiles';
END $$;

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_user_profiles_expires_at ON user_profiles(expires_at);

COMMENT ON COLUMN user_profiles.expires_at IS 'Fecha de expiración del acceso (NULL = sin expiración)';

-- ============================================
-- PASO 2: Función para desactivar usuario
-- ============================================

CREATE OR REPLACE FUNCTION admin_deactivate_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Desactivado por administrador'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  -- Verificar que quien ejecuta es admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden desactivar usuarios';
  END IF;

  -- Verificar que no se desactive a sí mismo
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'No puedes desactivarte a ti mismo';
  END IF;

  -- Desactivar usuario
  UPDATE user_profiles
  SET
    status = 'inactive',
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
                  to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Desactivado: ' || p_reason,
    expires_at = NULL  -- Limpiar expiración
  WHERE user_id = p_user_id;

  RAISE NOTICE '✅ Usuario desactivado: %', p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_deactivate_user TO authenticated;

COMMENT ON FUNCTION admin_deactivate_user IS 'Desactiva un usuario (cambia status a inactive)';

-- ============================================
-- PASO 3: Función para dar acceso temporal
-- ============================================

CREATE OR REPLACE FUNCTION admin_grant_temporary_access(
  p_user_id UUID,
  p_days INTEGER,
  p_reason TEXT DEFAULT 'Acceso temporal'
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar que quien ejecuta es admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden dar acceso temporal';
  END IF;

  -- Validar días
  IF p_days NOT IN (10, 15, 30) THEN
    RAISE EXCEPTION 'Los días deben ser 10, 15 o 30';
  END IF;

  -- Calcular fecha de expiración
  v_expires_at := NOW() + (p_days || ' days')::INTERVAL;

  -- Activar usuario y establecer fecha de expiración
  UPDATE user_profiles
  SET
    status = 'active',
    expires_at = v_expires_at,
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
                  to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Acceso temporal ' ||
                  p_days || ' días: ' || p_reason
  WHERE user_id = p_user_id;

  RAISE NOTICE '✅ Acceso temporal concedido hasta: %', v_expires_at;
  RETURN v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_grant_temporary_access TO authenticated;

COMMENT ON FUNCTION admin_grant_temporary_access IS 'Da acceso temporal (10, 15 o 30 días)';

-- ============================================
-- PASO 4: Función para eliminar usuario completamente
-- ============================================

CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Eliminado por administrador'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_user_email TEXT;
BEGIN
  -- Verificar que quien ejecuta es admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden eliminar usuarios';
  END IF;

  -- Verificar que no se elimine a sí mismo
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'No puedes eliminarte a ti mismo';
  END IF;

  -- Obtener email antes de eliminar
  SELECT user_email INTO v_user_email
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Eliminar perfil (CASCADE eliminará vínculos, sesiones, etc)
  DELETE FROM user_profiles
  WHERE user_id = p_user_id;

  RAISE NOTICE '❌ Usuario eliminado permanentemente: %', v_user_email;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_delete_user TO authenticated;

COMMENT ON FUNCTION admin_delete_user IS 'Elimina permanentemente un usuario (¡IRREVERSIBLE!)';

-- ============================================
-- PASO 5: Función para reactivar usuario
-- ============================================

CREATE OR REPLACE FUNCTION admin_reactivate_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Reactivado por administrador'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  -- Verificar que quien ejecuta es admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden reactivar usuarios';
  END IF;

  -- Reactivar usuario
  UPDATE user_profiles
  SET
    status = 'active',
    expires_at = NULL,  -- Sin expiración
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
                  to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Reactivado: ' || p_reason
  WHERE user_id = p_user_id;

  RAISE NOTICE '✅ Usuario reactivado: %', p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_reactivate_user TO authenticated;

COMMENT ON FUNCTION admin_reactivate_user IS 'Reactiva un usuario desactivado (status = active, sin expiración)';

-- ============================================
-- PASO 6: Función automática para desactivar usuarios expirados
-- ============================================

CREATE OR REPLACE FUNCTION auto_deactivate_expired_users()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Desactivar usuarios cuyo acceso ha expirado
  UPDATE user_profiles
  SET
    status = 'inactive',
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
                  to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Acceso expirado automáticamente'
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    RAISE NOTICE '⏰ % usuarios desactivados por expiración', v_count;
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_deactivate_expired_users IS 'Desactiva automáticamente usuarios cuyo acceso ha expirado';

-- ============================================
-- PASO 7: Ver usuarios que expiran pronto
-- ============================================

CREATE OR REPLACE VIEW users_expiring_soon AS
SELECT
  user_id,
  user_email,
  nombre,
  role,
  status,
  expires_at,
  EXTRACT(DAY FROM (expires_at - NOW())) as days_remaining,
  CASE
    WHEN expires_at < NOW() THEN '❌ Expirado'
    WHEN expires_at < NOW() + INTERVAL '3 days' THEN '⚠️ Expira en menos de 3 días'
    WHEN expires_at < NOW() + INTERVAL '7 days' THEN '⚠️ Expira en menos de 7 días'
    ELSE '✅ Activo'
  END as expiration_status
FROM user_profiles
WHERE expires_at IS NOT NULL
ORDER BY expires_at ASC;

COMMENT ON VIEW users_expiring_soon IS 'Muestra usuarios con acceso temporal y cuándo expiran';

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   ✅ DESACTIVACIÓN Y ACCESO TEMPORAL CONFIGURADO  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Funciones creadas:';
  RAISE NOTICE '   • admin_deactivate_user(user_id, reason)';
  RAISE NOTICE '   • admin_grant_temporary_access(user_id, days, reason)';
  RAISE NOTICE '   • admin_delete_user(user_id, reason) - PERMANENTE';
  RAISE NOTICE '   • admin_reactivate_user(user_id, reason)';
  RAISE NOTICE '   • auto_deactivate_expired_users()';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Ejemplos de uso:';
  RAISE NOTICE '   -- Dar acceso por 30 días';
  RAISE NOTICE '   SELECT admin_grant_temporary_access(';
  RAISE NOTICE '     ''user-uuid'', 30, ''Prueba de 30 días''';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Desactivar usuario';
  RAISE NOTICE '   SELECT admin_deactivate_user(';
  RAISE NOTICE '     ''user-uuid'', ''Incumplió normas''';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Reactivar usuario';
  RAISE NOTICE '   SELECT admin_reactivate_user(';
  RAISE NOTICE '     ''user-uuid'', ''Corrigió comportamiento''';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Ver usuarios que expiran pronto';
  RAISE NOTICE '   SELECT * FROM users_expiring_soon;';
  RAISE NOTICE '';
  RAISE NOTICE '⏰ Ejecuta esto periódicamente (ej: cada hora):';
  RAISE NOTICE '   SELECT auto_deactivate_expired_users();';
  RAISE NOTICE '';
END $$;
