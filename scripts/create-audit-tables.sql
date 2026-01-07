-- ============================================
-- SCHEMA PARA AUDITORÍA Y SEGUIMIENTO DE APODERADOS
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- Tabla de relación Apoderado-Estudiante
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('padre', 'madre', 'tutor', 'apoderado')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(parent_user_id, student_user_id)
);

-- Tabla de log de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT,
  entity_type TEXT, -- 'test', 'profile', 'career', 'session', etc.
  entity_id TEXT,
  metadata JSONB, -- Datos adicionales en formato JSON
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de sesiones de usuario (para tracking de actividad)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  duration_minutes INTEGER,
  pages_visited INTEGER DEFAULT 0,
  actions_performed INTEGER DEFAULT 0,
  device_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones para apoderados
CREATE TABLE IF NOT EXISTS parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);

CREATE INDEX IF NOT EXISTS idx_parent_relationships_parent ON parent_student_relationships(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_relationships_student ON parent_student_relationships(student_user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start DESC);

CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_read ON parent_notifications(read);

-- Función para registrar automáticamente acciones en el audit log
CREATE OR REPLACE FUNCTION log_test_completion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action_type,
    action_description,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NEW.user_id,
    'test_completed',
    'Usuario completó test vocacional RIASEC',
    'test',
    NEW.id::TEXT,
    jsonb_build_object(
      'codigo_holland', NEW.codigo_holland,
      'certeza', NEW.certeza,
      'duracion_minutos', NEW.duracion_minutos
    )
  );

  -- Notificar a apoderados si existen
  INSERT INTO parent_notifications (
    parent_user_id,
    student_user_id,
    notification_type,
    title,
    message,
    priority,
    related_entity_type,
    related_entity_id
  )
  SELECT
    psr.parent_user_id,
    NEW.user_id,
    'test_completed',
    'Test Vocacional Completado',
    'Tu hijo/a ha completado el test vocacional RIASEC. Código Holland: ' || NEW.codigo_holland,
    'normal',
    'test',
    NEW.id::TEXT
  FROM parent_student_relationships psr
  WHERE psr.student_user_id = NEW.user_id
    AND psr.status = 'accepted';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para log automático de tests
CREATE TRIGGER trigger_log_test_completion
  AFTER INSERT ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION log_test_completion();

-- Función para registrar inicio de sesión
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action_type,
    action_description,
    entity_type
  ) VALUES (
    NEW.id,
    'user_login',
    'Usuario inició sesión',
    'session'
  );

  -- Crear nueva sesión
  INSERT INTO user_sessions (
    user_id,
    device_info
  ) VALUES (
    NEW.id,
    jsonb_build_object(
      'last_sign_in_at', NEW.last_sign_in_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS (Row Level Security)

-- Audit log: usuarios solo ven sus propios logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit log"
  ON audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Apoderados pueden ver logs de sus hijos
CREATE POLICY "Parents can view student audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_relationships
      WHERE parent_user_id = auth.uid()
        AND student_user_id = audit_log.user_id
        AND status = 'accepted'
    )
  );

-- Parent relationships
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationships"
  ON parent_student_relationships FOR SELECT
  USING (auth.uid() = parent_user_id OR auth.uid() = student_user_id);

CREATE POLICY "Parents can create relationships"
  ON parent_student_relationships FOR INSERT
  WITH CHECK (auth.uid() = parent_user_id);

-- Notificaciones: solo apoderados ven sus notificaciones
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own notifications"
  ON parent_notifications FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can update own notifications"
  ON parent_notifications FOR UPDATE
  USING (auth.uid() = parent_user_id);

-- User sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view student sessions"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_relationships
      WHERE parent_user_id = auth.uid()
        AND student_user_id = user_sessions.user_id
        AND status = 'accepted'
    )
  );

-- Mensaje de confirmación
SELECT 'Sistema de auditoría creado exitosamente' AS resultado;

-- Instrucciones para uso
SELECT
  'Para vincular un apoderado con un estudiante:' AS paso_1,
  'INSERT INTO parent_student_relationships (parent_user_id, student_user_id, relationship_type) VALUES (''uuid-padre'', ''uuid-estudiante'', ''padre'');' AS ejemplo;
