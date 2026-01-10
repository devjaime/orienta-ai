-- ============================================
-- SISTEMA COMPLETO DE ORIENTADOR - ORIENTAIA
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripción: Crea tablas, funciones, triggers y políticas RLS
--              para el sistema de gestión de orientadores

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLA: orientador_availability
-- Horarios disponibles de orientadores por día de la semana
-- ============================================

CREATE TABLE IF NOT EXISTS orientador_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orientador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Horario semanal fijo
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes, ..., 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Configuración de slots
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes IN (15, 30, 45, 60)),

  -- Estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(orientador_id, day_of_week, start_time),
  CHECK (end_time > start_time)
);

-- Índices para orientador_availability
CREATE INDEX IF NOT EXISTS idx_orientador_availability_orientador ON orientador_availability(orientador_id);
CREATE INDEX IF NOT EXISTS idx_orientador_availability_day ON orientador_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_orientador_availability_active ON orientador_availability(is_active);

-- RLS para orientador_availability
ALTER TABLE orientador_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver disponibilidad de orientadores
CREATE POLICY "Todos ven disponibilidad"
  ON orientador_availability FOR SELECT
  USING (TRUE);

-- Policy: Solo orientadores/admins gestionan su propia disponibilidad
CREATE POLICY "Orientadores gestionan su disponibilidad"
  ON orientador_availability FOR ALL
  USING (
    auth.uid() = orientador_id AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_orientador_availability_timestamp
  BEFORE UPDATE ON orientador_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE orientador_availability IS 'Horarios disponibles de orientadores por día de la semana';

-- ============================================
-- TABLA: session_notes
-- Apuntes de sesiones con resumen generado por IA
-- ============================================

CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
  orientador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contenido de notas
  raw_notes TEXT NOT NULL,
  ai_summary TEXT,
  ai_generated_at TIMESTAMP WITH TIME ZONE,

  -- Estructura del resumen IA (JSONB para flexibilidad)
  ai_analysis JSONB, -- {
    -- puntos_clave: [],
    -- recomendaciones: [],
    -- proximos_pasos: [],
    -- areas_preocupacion: [],
    -- sentimiento_general: 'positivo|neutro|negativo',
    -- temas_discutidos: []
  -- }

  -- Seguimiento
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  tags TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: Una nota por sesión
  UNIQUE(session_id)
);

-- Índices para session_notes
CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_orientador ON session_notes(orientador_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_follow_up ON session_notes(follow_up_needed, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_session_notes_tags ON session_notes USING GIN(tags);

-- RLS para session_notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Solo orientador que creó la nota puede verla
CREATE POLICY "Orientadores ven sus notas"
  ON session_notes FOR SELECT
  USING (
    auth.uid() = orientador_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Solo orientadores/admins pueden crear notas
CREATE POLICY "Orientadores crean notas"
  ON session_notes FOR INSERT
  WITH CHECK (
    auth.uid() = orientador_id AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Policy: Solo el orientador dueño puede actualizar
CREATE POLICY "Orientadores actualizan sus notas"
  ON session_notes FOR UPDATE
  USING (
    auth.uid() = orientador_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_session_notes_timestamp
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE session_notes IS 'Apuntes de sesiones con resumen generado por IA';

-- ============================================
-- TABLA: student_orientador_assignments
-- Asignación de estudiantes a orientadores con balanceo de carga
-- ============================================

CREATE TABLE IF NOT EXISTS student_orientador_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orientador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de asignación
  assignment_type TEXT NOT NULL DEFAULT 'auto' CHECK (assignment_type IN ('auto', 'manual')),
  assigned_by UUID REFERENCES auth.users(id),

  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),

  -- Métricas de carga
  total_sessions INTEGER DEFAULT 0,
  pending_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,

  -- Metadata
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_session_at TIMESTAMP WITH TIME ZONE,
  transferred_at TIMESTAMP WITH TIME ZONE,
  transferred_to UUID REFERENCES auth.users(id),
  transfer_reason TEXT
);

-- Índices para student_orientador_assignments
CREATE INDEX IF NOT EXISTS idx_assignments_student ON student_orientador_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_orientador ON student_orientador_assignments(orientador_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON student_orientador_assignments(status);

-- Índice parcial: Solo asignaciones activas (un alumno = un orientador activo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_active_student
  ON student_orientador_assignments(student_id)
  WHERE status = 'active';

-- RLS para student_orientador_assignments
ALTER TABLE student_orientador_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Estudiantes ven su asignación
CREATE POLICY "Estudiantes ven su asignación"
  ON student_orientador_assignments FOR SELECT
  USING (auth.uid() = student_id);

-- Policy: Orientadores ven sus asignaciones
CREATE POLICY "Orientadores ven sus asignaciones"
  ON student_orientador_assignments FOR SELECT
  USING (
    auth.uid() = orientador_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('orientador', 'admin')
    )
  );

-- Policy: Solo sistema (via service role) puede crear asignaciones automáticas
-- Los admins pueden crear asignaciones manuales
CREATE POLICY "Admins gestionan asignaciones"
  ON student_orientador_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

COMMENT ON TABLE student_orientador_assignments IS 'Asignación de estudiantes a orientadores con balanceo de carga';

-- ============================================
-- ACTUALIZACIÓN DE TABLA scheduled_sessions
-- Agregar campo orientador_id si no existe
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_sessions'
    AND column_name = 'orientador_id'
  ) THEN
    ALTER TABLE scheduled_sessions
    ADD COLUMN orientador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

    CREATE INDEX idx_scheduled_sessions_orientador_id
      ON scheduled_sessions(orientador_id);
  END IF;
END $$;

-- ============================================
-- TRIGGER: Actualizar métricas de asignación
-- ============================================

CREATE OR REPLACE FUNCTION update_assignment_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar métricas cuando cambia el estado de una sesión
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Si hay orientador asignado
    IF NEW.orientador_id IS NOT NULL THEN
      UPDATE student_orientador_assignments
      SET
        total_sessions = (
          SELECT COUNT(*) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id
          AND user_id = NEW.user_id
        ),
        pending_sessions = (
          SELECT COUNT(*) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id
          AND user_id = NEW.user_id
          AND status = 'pending'
        ),
        completed_sessions = (
          SELECT COUNT(*) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id
          AND user_id = NEW.user_id
          AND status = 'completed'
        ),
        last_session_at = (
          SELECT MAX(scheduled_date) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id
          AND user_id = NEW.user_id
        )
      WHERE student_id = NEW.user_id
      AND orientador_id = NEW.orientador_id
      AND status = 'active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a scheduled_sessions
DROP TRIGGER IF EXISTS trigger_update_assignment_metrics ON scheduled_sessions;
CREATE TRIGGER trigger_update_assignment_metrics
  AFTER INSERT OR UPDATE ON scheduled_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_metrics();

-- ============================================
-- VISTA MATERIALIZADA: orientador_workload_stats
-- Caché de estadísticas de carga de trabajo
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS orientador_workload_stats CASCADE;

CREATE MATERIALIZED VIEW orientador_workload_stats AS
SELECT
  up.user_id as orientador_id,
  up.nombre as orientador_nombre,

  -- Conteo de asignaciones
  COUNT(DISTINCT soa.student_id) FILTER (WHERE soa.status = 'active') as total_students,

  -- Conteo de sesiones
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'pending') as pending_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'confirmed') as confirmed_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'completed') as completed_sessions,

  -- Total de sesiones
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status IN ('pending', 'confirmed', 'completed')) as total_sessions,

  -- Horas totales (últimos 30 días)
  COALESCE(SUM(ss.duration_minutes) FILTER (
    WHERE ss.status = 'completed'
    AND ss.completed_at >= NOW() - INTERVAL '30 days'
  ), 0) / 60.0 as hours_last_30_days,

  -- Última sesión
  MAX(ss.scheduled_date) as last_session_date,

  -- Carga total (métrica ponderada para balanceo)
  (
    COUNT(DISTINCT soa.student_id) FILTER (WHERE soa.status = 'active') * 1.0 +
    COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'pending') * 2.0 +
    COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'confirmed') * 1.5
  ) as workload_score,

  -- Timestamp de actualización
  NOW() as last_updated

FROM user_profiles up
LEFT JOIN student_orientador_assignments soa ON up.user_id = soa.orientador_id
LEFT JOIN scheduled_sessions ss ON up.user_id = ss.orientador_id
WHERE up.role IN ('orientador', 'admin')
GROUP BY up.user_id, up.nombre;

-- Índices en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_workload_stats_orientador ON orientador_workload_stats(orientador_id);
CREATE INDEX IF NOT EXISTS idx_workload_stats_score ON orientador_workload_stats(workload_score);

COMMENT ON MATERIALIZED VIEW orientador_workload_stats IS 'Estadísticas de carga de trabajo de orientadores (actualizar cada 15 min)';

-- ============================================
-- FUNCIÓN: Refrescar estadísticas de carga
-- ============================================

CREATE OR REPLACE FUNCTION refresh_orientador_workload_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY orientador_workload_stats;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION refresh_orientador_workload_stats IS 'Refresca la vista materializada de estadísticas de carga';

-- ============================================
-- FUNCIÓN: Obtener orientador con menor carga disponible
-- ============================================

CREATE OR REPLACE FUNCTION get_available_orientador_with_least_workload(
  preferred_date TIMESTAMP WITH TIME ZONE,
  duration_mins INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  selected_orientador UUID;
  day_of_week_num INTEGER;
  session_time TIME;
BEGIN
  -- Calcular día de la semana (0=Domingo)
  day_of_week_num := EXTRACT(DOW FROM preferred_date);
  session_time := preferred_date::TIME;

  -- Buscar orientador con disponibilidad y menor carga
  SELECT ows.orientador_id INTO selected_orientador
  FROM orientador_workload_stats ows
  INNER JOIN orientador_availability oa
    ON ows.orientador_id = oa.orientador_id
  WHERE
    -- Tiene disponibilidad en ese día y hora
    oa.day_of_week = day_of_week_num
    AND oa.is_active = TRUE
    AND session_time >= oa.start_time
    AND session_time + (duration_mins || ' minutes')::INTERVAL <= oa.end_time

    -- No tiene sesión conflictiva en ese horario
    AND NOT EXISTS (
      SELECT 1 FROM scheduled_sessions ss
      WHERE ss.orientador_id = ows.orientador_id
      AND ss.status IN ('pending', 'confirmed')
      AND ss.scheduled_date < preferred_date + (duration_mins || ' minutes')::INTERVAL
      AND ss.scheduled_date + (ss.duration_minutes || ' minutes')::INTERVAL > preferred_date
    )
  ORDER BY ows.workload_score ASC
  LIMIT 1;

  RETURN selected_orientador;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION get_available_orientador_with_least_workload IS 'Encuentra orientador disponible con menor carga para una fecha/hora específica';

-- ============================================
-- FUNCIÓN: Generar slots disponibles
-- ============================================

CREATE OR REPLACE FUNCTION get_available_time_slots(
  start_date DATE,
  end_date DATE,
  orientador_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  orientador_id UUID,
  orientador_nombre TEXT,
  slot_datetime TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  workload_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date::TIMESTAMP, end_date::TIMESTAMP, '1 day'::INTERVAL) as day
  ),
  time_slots AS (
    SELECT
      ds.day,
      EXTRACT(DOW FROM ds.day)::INTEGER as dow,
      oa.orientador_id,
      oa.start_time,
      oa.end_time,
      oa.slot_duration_minutes,
      generate_series(
        (ds.day + oa.start_time)::TIMESTAMP WITH TIME ZONE,
        (ds.day + oa.end_time - (oa.slot_duration_minutes || ' minutes')::INTERVAL)::TIMESTAMP WITH TIME ZONE,
        (oa.slot_duration_minutes || ' minutes')::INTERVAL
      ) as slot_time
    FROM date_series ds
    CROSS JOIN orientador_availability oa
    WHERE oa.is_active = TRUE
    AND EXTRACT(DOW FROM ds.day) = oa.day_of_week
    AND (orientador_filter IS NULL OR oa.orientador_id = orientador_filter)
  )
  SELECT
    ts.orientador_id,
    up.nombre,
    ts.slot_time,
    ts.slot_duration_minutes,
    COALESCE(ows.workload_score, 0)
  FROM time_slots ts
  INNER JOIN user_profiles up ON ts.orientador_id = up.user_id
  LEFT JOIN orientador_workload_stats ows ON ts.orientador_id = ows.orientador_id
  WHERE
    -- Slot está en el futuro
    ts.slot_time > NOW()

    -- No hay sesión conflictiva
    AND NOT EXISTS (
      SELECT 1 FROM scheduled_sessions ss
      WHERE ss.orientador_id = ts.orientador_id
      AND ss.status IN ('pending', 'confirmed')
      AND ss.scheduled_date < ts.slot_time + (ts.slot_duration_minutes || ' minutes')::INTERVAL
      AND ss.scheduled_date + (ss.duration_minutes || ' minutes')::INTERVAL > ts.slot_time
    )
  ORDER BY ts.slot_time, COALESCE(ows.workload_score, 0);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION get_available_time_slots IS 'Genera todos los slots disponibles en un rango de fechas';

-- ============================================
-- POBLAR VISTA MATERIALIZADA INICIAL
-- ============================================

REFRESH MATERIALIZED VIEW orientador_workload_stats;

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Contar tablas creadas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('orientador_availability', 'session_notes', 'student_orientador_assignments');

  -- Contar funciones creadas
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_name IN (
    'get_available_orientador_with_least_workload',
    'get_available_time_slots',
    'refresh_orientador_workload_stats',
    'update_assignment_metrics',
    'update_updated_at_column'
  );

  RAISE NOTICE '✅ Sistema de Orientador creado exitosamente';
  RAISE NOTICE '📊 Tablas creadas: %', table_count;
  RAISE NOTICE '⚙️  Funciones creadas: %', function_count;
  RAISE NOTICE '📈 Vista materializada: orientador_workload_stats';
  RAISE NOTICE '';
  RAISE NOTICE 'Siguiente paso: Crear archivo /src/lib/orientadorService.js';
END $$;
