-- ============================================
-- SCRIPT DE ACTUALIZACIÓN: Roles y Sesiones Agendadas
-- Ejecutar DESPUÉS de crear user_profiles y test_results
-- ============================================

-- PASO 1: Agregar campo 'role' a user_profiles
-- ============================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'orientador', 'admin'));

-- Crear índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Comentario
COMMENT ON COLUMN user_profiles.role IS 'Rol del usuario: user (normal), orientador (profesional), admin (administrador)';

-- PASO 2: Crear tabla de sesiones agendadas
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  orientador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Datos de la sesión
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

  -- Información de contacto
  meeting_link TEXT, -- Google Meet, Zoom, etc.
  user_notes TEXT, -- Notas del usuario sobre qué quiere discutir
  orientador_notes TEXT, -- Notas del orientador después de la sesión

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Índices para scheduled_sessions
CREATE INDEX idx_scheduled_sessions_user_id ON scheduled_sessions(user_id);
CREATE INDEX idx_scheduled_sessions_orientador_id ON scheduled_sessions(orientador_id);
CREATE INDEX idx_scheduled_sessions_status ON scheduled_sessions(status);
CREATE INDEX idx_scheduled_sessions_date ON scheduled_sessions(scheduled_date);

-- Row Level Security para scheduled_sessions
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios ven solo sus propias sesiones
CREATE POLICY "Usuarios ven sus sesiones"
  ON scheduled_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los orientadores ven sesiones asignadas a ellos
CREATE POLICY "Orientadores ven sesiones asignadas"
  ON scheduled_sessions FOR SELECT
  USING (
    auth.uid() = orientador_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Policy: Los usuarios pueden crear sus propias sesiones
CREATE POLICY "Usuarios crean sesiones"
  ON scheduled_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Solo orientadores y admins pueden actualizar sesiones
CREATE POLICY "Orientadores actualizan sesiones"
  ON scheduled_sessions FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.uid() = orientador_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_scheduled_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-actualizar completed_at cuando status cambia a 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;

  -- Auto-actualizar cancelled_at cuando status cambia a 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_sessions_timestamp
  BEFORE UPDATE ON scheduled_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_sessions_timestamp();

-- Comentarios para documentación
COMMENT ON TABLE scheduled_sessions IS 'Sesiones de orientación agendadas entre usuarios y orientadores';
COMMENT ON COLUMN scheduled_sessions.status IS 'Estado: pending (por confirmar), confirmed (confirmada), completed (realizada), cancelled (cancelada)';
COMMENT ON COLUMN scheduled_sessions.user_notes IS 'Notas del usuario sobre temas a discutir en la sesión';
COMMENT ON COLUMN scheduled_sessions.orientador_notes IS 'Notas del orientador post-sesión';

-- PASO 3: Crear vista para estadísticas (solo para orientadores/admins)
-- ============================================

CREATE OR REPLACE VIEW orientador_stats AS
SELECT
  up.user_id,
  up.nombre,
  up.role,
  COUNT(DISTINCT tr.id) as total_tests,
  COUNT(DISTINCT ss.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN ss.status = 'completed' THEN ss.id END) as completed_sessions,
  COUNT(DISTINCT CASE WHEN ss.status = 'pending' THEN ss.id END) as pending_sessions
FROM user_profiles up
LEFT JOIN test_results tr ON up.user_id = tr.user_id
LEFT JOIN scheduled_sessions ss ON up.user_id = ss.orientador_id
WHERE up.role IN ('orientador', 'admin')
GROUP BY up.user_id, up.nombre, up.role;

-- PASO 4: Función para asignar rol de admin al primer usuario (opcional)
-- ============================================

-- Ejecuta esto manualmente para hacer admin a un usuario específico:
-- UPDATE user_profiles SET role = 'admin' WHERE user_email = 'tu-email@gmail.com';

-- O ejecuta esto para hacer admin al primer usuario registrado:
-- UPDATE user_profiles SET role = 'admin' WHERE id = (SELECT id FROM user_profiles ORDER BY created_at LIMIT 1);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Para verificar que todo se creó correctamente:
-- SELECT * FROM user_profiles LIMIT 5;
-- SELECT * FROM scheduled_sessions LIMIT 5;
-- SELECT * FROM orientador_stats;
