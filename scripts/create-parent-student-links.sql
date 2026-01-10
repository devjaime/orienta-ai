-- ============================================
-- SISTEMA DE VÍNCULOS APODERADO-ESTUDIANTE
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Permite a los apoderados vincular estudiantes (hijos)
--              y acceder a sus resultados de tests y sesiones

-- ============================================
-- TABLA: parent_student_links
-- Vínculos entre apoderados y estudiantes
-- ============================================

CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relación
  relationship_type TEXT NOT NULL DEFAULT 'padre/madre' CHECK (
    relationship_type IN ('padre/madre', 'tutor legal', 'familiar', 'otro')
  ),

  -- Estado del vínculo
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'blocked')
  ),

  -- Información adicional
  student_nickname TEXT, -- Ej: "Mi hijo mayor", "Ana"
  notes TEXT, -- Notas del apoderado sobre el estudiante

  -- Permisos (qué puede ver el apoderado)
  can_view_tests BOOLEAN DEFAULT TRUE,
  can_view_sessions BOOLEAN DEFAULT TRUE,
  can_view_notes BOOLEAN DEFAULT FALSE, -- Notas privadas del orientador

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  UNIQUE(parent_id, student_id), -- Un apoderado solo puede vincular una vez a un estudiante
  CHECK (parent_id != student_id) -- Un usuario no puede ser apoderado de sí mismo
);

-- Índices para parent_student_links
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_status ON parent_student_links(status);

-- RLS para parent_student_links
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policy: Apoderados ven sus propios vínculos
CREATE POLICY "Apoderados ven sus vínculos"
  ON parent_student_links FOR SELECT
  USING (
    auth.uid() = parent_id OR
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Policy: Apoderados pueden crear vínculos
CREATE POLICY "Apoderados crean vínculos"
  ON parent_student_links FOR INSERT
  WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'apoderado'
    )
  );

-- Policy: Apoderados pueden actualizar sus vínculos
CREATE POLICY "Apoderados actualizan sus vínculos"
  ON parent_student_links FOR UPDATE
  USING (
    auth.uid() = parent_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Policy: Estudiantes pueden aceptar/rechazar vínculos
CREATE POLICY "Estudiantes aceptan/rechazan vínculos"
  ON parent_student_links FOR UPDATE
  USING (
    auth.uid() = student_id AND
    status = 'pending'
  )
  WITH CHECK (
    status IN ('accepted', 'rejected')
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_parent_student_links_timestamp
  BEFORE UPDATE ON parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE parent_student_links IS 'Vínculos entre apoderados y estudiantes (hijos)';

-- ============================================
-- VISTA: parent_dashboard_summary
-- Resumen del dashboard del apoderado
-- ============================================

CREATE OR REPLACE VIEW parent_dashboard_summary AS
SELECT
  psl.parent_id,
  psl.student_id,
  psl.student_nickname,
  psl.relationship_type,
  psl.status as link_status,

  -- Información del estudiante
  sp.nombre as student_name,
  sp.edad as student_age,
  sp.user_email as student_email,

  -- Tests del estudiante
  (
    SELECT COUNT(*)
    FROM test_results
    WHERE user_id = psl.student_id
  ) as total_tests,

  -- Último test
  (
    SELECT row_to_json(t)
    FROM (
      SELECT codigo_holland, certeza, completed_at
      FROM test_results
      WHERE user_id = psl.student_id
      ORDER BY completed_at DESC
      LIMIT 1
    ) t
  ) as last_test,

  -- Sesiones del estudiante
  (
    SELECT COUNT(*)
    FROM scheduled_sessions
    WHERE user_id = psl.student_id
  ) as total_sessions,

  -- Sesiones completadas
  (
    SELECT COUNT(*)
    FROM scheduled_sessions
    WHERE user_id = psl.student_id
    AND status = 'completed'
  ) as completed_sessions,

  -- Próxima sesión
  (
    SELECT row_to_json(s)
    FROM (
      SELECT scheduled_date, duration_minutes, status
      FROM scheduled_sessions
      WHERE user_id = psl.student_id
      AND status IN ('pending', 'confirmed')
      AND scheduled_date > NOW()
      ORDER BY scheduled_date ASC
      LIMIT 1
    ) s
  ) as next_session,

  -- Orientador asignado
  (
    SELECT row_to_json(o)
    FROM (
      SELECT up.nombre as orientador_name, soa.assigned_at
      FROM student_orientador_assignments soa
      JOIN user_profiles up ON soa.orientador_id = up.user_id
      WHERE soa.student_id = psl.student_id
      AND soa.status = 'active'
      LIMIT 1
    ) o
  ) as assigned_orientador

FROM parent_student_links psl
LEFT JOIN user_profiles sp ON psl.student_id = sp.user_id
WHERE psl.status = 'accepted';

COMMENT ON VIEW parent_dashboard_summary IS 'Resumen completo para el dashboard del apoderado';

-- ============================================
-- FUNCIÓN: Obtener resúmenes IA para apoderado
-- ============================================

CREATE OR REPLACE FUNCTION get_parent_student_ai_summaries(
  p_parent_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  session_id UUID,
  session_date TIMESTAMP WITH TIME ZONE,
  ai_summary TEXT,
  ai_analysis JSONB,
  orientador_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.id as session_id,
    ss.scheduled_date as session_date,
    sn.ai_summary,
    sn.ai_analysis,
    up.nombre as orientador_name
  FROM scheduled_sessions ss
  INNER JOIN session_notes sn ON ss.id = sn.session_id
  INNER JOIN user_profiles up ON ss.orientador_id = up.user_id
  WHERE
    ss.user_id = p_student_id
    AND ss.status = 'completed'
    AND EXISTS (
      SELECT 1 FROM parent_student_links
      WHERE parent_id = p_parent_id
      AND student_id = p_student_id
      AND status = 'accepted'
      AND can_view_sessions = TRUE
    )
  ORDER BY ss.scheduled_date DESC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION get_parent_student_ai_summaries IS 'Obtiene resúmenes IA de sesiones para que el apoderado pueda verlos';

-- ============================================
-- FUNCIÓN: Solicitar vínculo apoderado-estudiante
-- ============================================

CREATE OR REPLACE FUNCTION request_parent_student_link(
  p_parent_id UUID,
  p_student_email TEXT,
  p_relationship TEXT DEFAULT 'padre/madre',
  p_nickname TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_student_id UUID;
  v_link_id UUID;
BEGIN
  -- Buscar estudiante por email
  SELECT user_id INTO v_student_id
  FROM user_profiles
  WHERE user_email = p_student_email
  AND role = 'estudiante';

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un estudiante con ese email';
  END IF;

  -- Verificar que no exista un vínculo
  IF EXISTS (
    SELECT 1 FROM parent_student_links
    WHERE parent_id = p_parent_id
    AND student_id = v_student_id
  ) THEN
    RAISE EXCEPTION 'Ya existe un vínculo con este estudiante';
  END IF;

  -- Crear vínculo
  INSERT INTO parent_student_links (
    parent_id,
    student_id,
    relationship_type,
    student_nickname,
    status
  )
  VALUES (
    p_parent_id,
    v_student_id,
    p_relationship,
    p_nickname,
    'pending'
  )
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION request_parent_student_link IS 'Permite a un apoderado solicitar vínculo con un estudiante';

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de vínculos apoderado-estudiante creado exitosamente';
  RAISE NOTICE '📋 Tabla: parent_student_links';
  RAISE NOTICE '👁️  Vista: parent_dashboard_summary';
  RAISE NOTICE '⚙️  Funciones: get_parent_student_ai_summaries, request_parent_student_link';
  RAISE NOTICE '';
  RAISE NOTICE 'Siguiente paso: Crear servicio /src/lib/parentService.js';
END $$;
