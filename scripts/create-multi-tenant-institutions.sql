-- ============================================
-- MODELO MULTI-COLEGIO (MULTI-TENANT) - VOCARI
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Descripcion: Implementa el modelo B2B con instituciones (colegios)
--              como entidad principal para pilotos institucionales
-- Fecha: 2025

-- ============================================
-- TABLA: institutions (Colegios)
-- ============================================

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos basicos
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Codigo unico del colegio (ej: CSJ001)
  rbd INTEGER UNIQUE, -- RBD del Mineduc (opcional)

  -- Tipo de institucion
  type TEXT NOT NULL DEFAULT 'particular' CHECK (
    type IN ('particular', 'particular_subvencionado', 'municipal', 'servicio_local')
  ),

  -- Ubicacion
  address TEXT,
  comuna TEXT,
  region TEXT,

  -- Contacto
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Configuracion visual
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1', -- Indigo por defecto

  -- Estado del piloto
  status TEXT NOT NULL DEFAULT 'pilot' CHECK (
    status IN ('pending', 'pilot', 'active', 'inactive', 'suspended')
  ),

  -- Fechas del piloto
  pilot_start_date DATE,
  pilot_end_date DATE,

  -- Limites
  max_students INTEGER DEFAULT 100,
  max_orientadores INTEGER DEFAULT 5,

  -- Cursos habilitados para el piloto
  enabled_courses TEXT[] DEFAULT ARRAY['3 Medio', '4 Medio'],

  -- Configuracion
  settings JSONB DEFAULT '{
    "require_parent_approval": false,
    "auto_approve_students": true,
    "allow_external_sessions": false,
    "session_duration_minutes": 30
  }'::JSONB,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para institutions
CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_comuna ON institutions(comuna);
CREATE INDEX IF NOT EXISTS idx_institutions_region ON institutions(region);

-- RLS para institutions
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_institutions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institutions_updated ON institutions;
CREATE TRIGGER trigger_institutions_updated
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_institutions_timestamp();

COMMENT ON TABLE institutions IS 'Colegios/instituciones que contratan Vocari (modelo B2B)';

-- ============================================
-- ACTUALIZAR TABLA user_profiles
-- Agregar campos de institucion y datos educativos
-- ============================================

DO $$
BEGIN
  -- Campo institution_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;

    CREATE INDEX idx_user_profiles_institution ON user_profiles(institution_id);
    RAISE NOTICE 'Columna institution_id agregada a user_profiles';
  END IF;

  -- Campo curso (3 Medio, 4 Medio, etc)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'curso'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN curso TEXT;

    CREATE INDEX idx_user_profiles_curso ON user_profiles(curso);
    RAISE NOTICE 'Columna curso agregada a user_profiles';
  END IF;

  -- Campo student_code (codigo interno del colegio)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'student_code'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN student_code TEXT;
    RAISE NOTICE 'Columna student_code agregada a user_profiles';
  END IF;

  -- Campo year (ano escolar)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'school_year'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN school_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());
    RAISE NOTICE 'Columna school_year agregada a user_profiles';
  END IF;

  -- Campo invited_by (quien creo/invito al usuario)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN invited_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Columna invited_by agregada a user_profiles';
  END IF;

  -- Campo activation_code (codigo para activar cuenta)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'activation_code'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN activation_code TEXT UNIQUE;

    CREATE INDEX idx_user_profiles_activation_code ON user_profiles(activation_code);
    RAISE NOTICE 'Columna activation_code agregada a user_profiles';
  END IF;

  -- Campo is_activated (si ya activo su cuenta)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'is_activated'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN is_activated BOOLEAN DEFAULT FALSE;

    -- Marcar usuarios existentes como activados
    UPDATE user_profiles SET is_activated = TRUE WHERE user_id IS NOT NULL;
    RAISE NOTICE 'Columna is_activated agregada a user_profiles';
  END IF;

END $$;

-- ============================================
-- ACTUALIZAR ROLES: Agregar admin_colegio
-- ============================================

-- Actualizar el check constraint del rol para incluir admin_colegio
DO $$
BEGIN
  -- Primero verificar si existe el constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'user_profiles'
    AND column_name = 'role'
  ) THEN
    -- Intentar eliminar el constraint existente
    BEGIN
      ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Constraint de role no existe o no se puede eliminar, continuando...';
    END;
  END IF;

  -- El check de role se maneja por aplicacion, no por constraint
  -- para permitir flexibilidad en roles futuros
  RAISE NOTICE 'Roles actualizados: estudiante, apoderado, orientador, admin_colegio, super_admin';
END $$;

-- ============================================
-- FUNCIONES HELPER PARA MULTI-TENANCY
-- ============================================

-- Funcion: Obtener institution_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS UUID AS $$
DECLARE
  v_institution_id UUID;
BEGIN
  SELECT institution_id INTO v_institution_id
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  RETURN v_institution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_institution_id() TO authenticated;
COMMENT ON FUNCTION public.get_user_institution_id IS 'Obtiene el institution_id del usuario actual';

-- Funcion: Verificar si es super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
COMMENT ON FUNCTION public.is_super_admin IS 'Verifica si el usuario actual es super_admin';

-- Funcion: Verificar si es admin de colegio
CREATE OR REPLACE FUNCTION public.is_institution_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin_colegio', 'super_admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_institution_admin() TO authenticated;
COMMENT ON FUNCTION public.is_institution_admin IS 'Verifica si el usuario actual es admin de colegio o super_admin';

-- Funcion: Verificar si pertenece a la misma institucion
CREATE OR REPLACE FUNCTION public.same_institution(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_my_institution UUID;
  v_target_institution UUID;
BEGIN
  -- Obtener mi institucion
  SELECT institution_id INTO v_my_institution
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  -- Obtener institucion del target
  SELECT institution_id INTO v_target_institution
  FROM public.user_profiles
  WHERE user_id = target_user_id;

  -- Comparar (NULL = NULL es FALSE en SQL, lo cual es correcto aqui)
  RETURN v_my_institution IS NOT NULL
    AND v_target_institution IS NOT NULL
    AND v_my_institution = v_target_institution;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.same_institution(UUID) TO authenticated;
COMMENT ON FUNCTION public.same_institution IS 'Verifica si el usuario actual pertenece a la misma institucion que otro usuario';

-- ============================================
-- POLITICAS RLS PARA INSTITUTIONS
-- ============================================

-- Super admins ven todas las instituciones
CREATE POLICY "super_admin_select_institutions"
  ON institutions FOR SELECT
  USING (public.is_super_admin());

-- Admin de colegio ve solo su institucion
CREATE POLICY "institution_admin_select_own"
  ON institutions FOR SELECT
  USING (
    id = public.get_user_institution_id()
    AND public.is_institution_admin()
  );

-- Solo super_admin puede crear instituciones
CREATE POLICY "super_admin_insert_institutions"
  ON institutions FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Super admin puede actualizar cualquier institucion
-- Admin de colegio solo puede actualizar la suya (datos limitados)
CREATE POLICY "admin_update_institutions"
  ON institutions FOR UPDATE
  USING (
    public.is_super_admin()
    OR (id = public.get_user_institution_id() AND public.is_institution_admin())
  );

-- Solo super_admin puede eliminar instituciones
CREATE POLICY "super_admin_delete_institutions"
  ON institutions FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- ACTUALIZAR POLITICAS RLS DE user_profiles
-- ============================================

-- Eliminar politicas antiguas
DROP POLICY IF EXISTS "rls_select_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_update_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_delete_profiles" ON user_profiles;

-- Nueva politica SELECT: Multi-tenant aware
CREATE POLICY "rls_select_profiles_v2"
  ON user_profiles FOR SELECT
  USING (
    -- Ver su propio perfil
    auth.uid() = user_id
    OR
    -- Super admin ve todos
    public.is_super_admin()
    OR
    -- Admin de colegio ve usuarios de su institucion
    (public.is_institution_admin() AND public.same_institution(user_id))
    OR
    -- Orientador ve estudiantes de su institucion
    (public.is_orientador() AND public.same_institution(user_id))
  );

-- Nueva politica INSERT
CREATE POLICY "rls_insert_profiles_v2"
  ON user_profiles FOR INSERT
  WITH CHECK (
    -- Crear su propio perfil
    auth.uid() = user_id
    OR
    -- Super admin puede crear cualquier perfil
    public.is_super_admin()
    OR
    -- Admin de colegio puede crear perfiles en su institucion
    (public.is_institution_admin() AND institution_id = public.get_user_institution_id())
  );

-- Nueva politica UPDATE
CREATE POLICY "rls_update_profiles_v2"
  ON user_profiles FOR UPDATE
  USING (
    -- Actualizar su propio perfil
    auth.uid() = user_id
    OR
    -- Super admin puede actualizar cualquier perfil
    public.is_super_admin()
    OR
    -- Admin de colegio puede actualizar perfiles de su institucion
    (public.is_institution_admin() AND public.same_institution(user_id))
  );

-- Nueva politica DELETE
CREATE POLICY "rls_delete_profiles_v2"
  ON user_profiles FOR DELETE
  USING (
    public.is_super_admin()
    OR
    (public.is_institution_admin() AND public.same_institution(user_id))
  );

-- ============================================
-- ACTUALIZAR is_admin() para soportar nuevos roles
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'admin_colegio', 'super_admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS 'Verifica si el usuario actual es cualquier tipo de admin (admin, admin_colegio, super_admin)';

-- ============================================
-- FUNCION: Crear institucion (solo super_admin)
-- ============================================

CREATE OR REPLACE FUNCTION create_institution(
  p_name TEXT,
  p_code TEXT,
  p_type TEXT DEFAULT 'particular',
  p_comuna TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_max_students INTEGER DEFAULT 100,
  p_pilot_start_date DATE DEFAULT CURRENT_DATE,
  p_pilot_end_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_institution_id UUID;
BEGIN
  -- Verificar permisos
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Solo super_admin puede crear instituciones';
  END IF;

  -- Verificar que el codigo no exista
  IF EXISTS (SELECT 1 FROM institutions WHERE code = p_code) THEN
    RAISE EXCEPTION 'Ya existe una institucion con el codigo: %', p_code;
  END IF;

  -- Crear institucion
  INSERT INTO institutions (
    name, code, type, comuna, region,
    contact_name, contact_email, contact_phone,
    max_students, pilot_start_date, pilot_end_date,
    notes, created_by, status
  ) VALUES (
    p_name, p_code, p_type, p_comuna, p_region,
    p_contact_name, p_contact_email, p_contact_phone,
    p_max_students, p_pilot_start_date,
    COALESCE(p_pilot_end_date, p_pilot_start_date + INTERVAL '90 days'),
    p_notes, auth.uid(), 'pilot'
  )
  RETURNING id INTO v_institution_id;

  RAISE NOTICE 'Institucion creada: % (ID: %)', p_name, v_institution_id;
  RETURN v_institution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_institution TO authenticated;
COMMENT ON FUNCTION create_institution IS 'Crea una nueva institucion (solo super_admin)';

-- ============================================
-- FUNCION: Generar codigo de activacion unico
-- ============================================

CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar codigo de 8 caracteres alfanumericos
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));

    -- Verificar que no exista
    SELECT EXISTS (
      SELECT 1 FROM user_profiles WHERE activation_code = v_code
    ) INTO v_exists;

    -- Si no existe, salir del loop
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_activation_code IS 'Genera un codigo de activacion unico de 8 caracteres';

-- ============================================
-- FUNCION: Crear usuario invitado (sin auth)
-- ============================================

CREATE OR REPLACE FUNCTION invite_student(
  p_institution_id UUID,
  p_email TEXT,
  p_nombre TEXT,
  p_curso TEXT,
  p_student_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  profile_id UUID,
  activation_code TEXT
) AS $$
DECLARE
  v_profile_id UUID;
  v_activation_code TEXT;
  v_institution_exists BOOLEAN;
  v_student_count INTEGER;
  v_max_students INTEGER;
BEGIN
  -- Verificar permisos
  IF NOT public.is_institution_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden invitar estudiantes';
  END IF;

  -- Verificar que la institucion exista y el admin pertenezca a ella
  SELECT EXISTS (
    SELECT 1 FROM institutions
    WHERE id = p_institution_id
    AND (public.is_super_admin() OR id = public.get_user_institution_id())
  ) INTO v_institution_exists;

  IF NOT v_institution_exists THEN
    RAISE EXCEPTION 'No tienes permiso para invitar estudiantes a esta institucion';
  END IF;

  -- Verificar limite de estudiantes
  SELECT COUNT(*), i.max_students INTO v_student_count, v_max_students
  FROM user_profiles up
  CROSS JOIN institutions i
  WHERE up.institution_id = p_institution_id
  AND i.id = p_institution_id
  AND up.role = 'estudiante'
  GROUP BY i.max_students;

  IF v_student_count >= COALESCE(v_max_students, 100) THEN
    RAISE EXCEPTION 'Se alcanzo el limite de estudiantes para esta institucion (% de %)',
      v_student_count, v_max_students;
  END IF;

  -- Verificar que el email no exista en esta institucion
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_email = p_email
    AND institution_id = p_institution_id
  ) THEN
    RAISE EXCEPTION 'Ya existe un usuario con email % en esta institucion', p_email;
  END IF;

  -- Generar codigo de activacion
  v_activation_code := generate_activation_code();

  -- Crear perfil pendiente (sin user_id aun)
  INSERT INTO user_profiles (
    id,
    user_id, -- NULL hasta que se active
    user_email,
    nombre,
    role,
    status,
    institution_id,
    curso,
    student_code,
    school_year,
    activation_code,
    is_activated,
    invited_by,
    created_at
  ) VALUES (
    gen_random_uuid(),
    NULL,
    p_email,
    p_nombre,
    'estudiante',
    'pending',
    p_institution_id,
    p_curso,
    p_student_code,
    EXTRACT(YEAR FROM NOW()),
    v_activation_code,
    FALSE,
    auth.uid(),
    NOW()
  )
  RETURNING id INTO v_profile_id;

  RETURN QUERY SELECT v_profile_id, v_activation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION invite_student TO authenticated;
COMMENT ON FUNCTION invite_student IS 'Invita un estudiante a una institucion generando un codigo de activacion';

-- ============================================
-- FUNCION: Activar cuenta con codigo
-- ============================================

CREATE OR REPLACE FUNCTION activate_account_with_code(
  p_activation_code TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile_id UUID;
  v_institution_id UUID;
BEGIN
  -- Buscar perfil con el codigo de activacion
  SELECT id, institution_id INTO v_profile_id, v_institution_id
  FROM user_profiles
  WHERE activation_code = UPPER(p_activation_code)
  AND is_activated = FALSE;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Codigo de activacion invalido o ya utilizado';
  END IF;

  -- Activar la cuenta vinculando con el user_id
  UPDATE user_profiles
  SET
    user_id = p_user_id,
    is_activated = TRUE,
    status = 'active',
    activation_code = NULL, -- Limpiar codigo usado
    updated_at = NOW()
  WHERE id = v_profile_id;

  RAISE NOTICE 'Cuenta activada exitosamente para usuario %', p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION activate_account_with_code TO authenticated;
COMMENT ON FUNCTION activate_account_with_code IS 'Activa una cuenta usando el codigo de activacion';

-- ============================================
-- FUNCION: Importar estudiantes desde CSV (batch)
-- ============================================

CREATE OR REPLACE FUNCTION batch_invite_students(
  p_institution_id UUID,
  p_students JSONB -- [{"email": "...", "nombre": "...", "curso": "...", "student_code": "..."}]
)
RETURNS TABLE (
  email TEXT,
  nombre TEXT,
  activation_code TEXT,
  status TEXT,
  error TEXT
) AS $$
DECLARE
  v_student JSONB;
  v_result RECORD;
  v_code TEXT;
BEGIN
  -- Verificar permisos
  IF NOT public.is_institution_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden importar estudiantes';
  END IF;

  -- Procesar cada estudiante
  FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    BEGIN
      -- Intentar crear el estudiante
      SELECT * INTO v_result FROM invite_student(
        p_institution_id,
        v_student->>'email',
        v_student->>'nombre',
        v_student->>'curso',
        v_student->>'student_code'
      );

      -- Retornar exito
      email := v_student->>'email';
      nombre := v_student->>'nombre';
      activation_code := v_result.activation_code;
      status := 'success';
      error := NULL;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      -- Retornar error
      email := v_student->>'email';
      nombre := v_student->>'nombre';
      activation_code := NULL;
      status := 'error';
      error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION batch_invite_students TO authenticated;
COMMENT ON FUNCTION batch_invite_students IS 'Importa multiples estudiantes desde un array JSON';

-- ============================================
-- VISTA: Estadisticas por institucion
-- ============================================

CREATE OR REPLACE VIEW institution_stats AS
SELECT
  i.id as institution_id,
  i.name as institution_name,
  i.code as institution_code,
  i.status as institution_status,
  i.pilot_start_date,
  i.pilot_end_date,
  i.max_students,

  -- Conteo de usuarios por rol
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'estudiante') as total_students,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'orientador') as total_orientadores,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'apoderado') as total_apoderados,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'admin_colegio') as total_admins,

  -- Estados de usuarios
  COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'pending') as pending_users,
  COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'active') as active_users,
  COUNT(DISTINCT up.id) FILTER (WHERE up.is_activated = FALSE) as not_activated,

  -- Estudiantes por curso
  COUNT(DISTINCT up.id) FILTER (WHERE up.curso = '3 Medio') as students_3_medio,
  COUNT(DISTINCT up.id) FILTER (WHERE up.curso = '4 Medio') as students_4_medio,

  -- Tests completados
  COUNT(DISTINCT tr.id) as total_tests_completed,

  -- Sesiones
  COUNT(DISTINCT ss.id) as total_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'completed') as completed_sessions,

  -- Fechas
  MIN(up.created_at) as first_user_date,
  MAX(up.created_at) as last_user_date

FROM institutions i
LEFT JOIN user_profiles up ON i.id = up.institution_id
LEFT JOIN test_results tr ON up.user_id = tr.user_id
LEFT JOIN scheduled_sessions ss ON up.user_id = ss.user_id
GROUP BY i.id, i.name, i.code, i.status, i.pilot_start_date, i.pilot_end_date, i.max_students;

COMMENT ON VIEW institution_stats IS 'Estadisticas agregadas por institucion';

-- ============================================
-- MIGRACION: Convertir admin existente a super_admin
-- ============================================

-- Actualizar el primer admin existente a super_admin
UPDATE user_profiles
SET role = 'super_admin'
WHERE role = 'admin'
AND user_id = (
  SELECT user_id FROM user_profiles
  WHERE role = 'admin'
  AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1
);

-- ============================================
-- MENSAJE DE CONFIRMACION
-- ============================================

DO $$
DECLARE
  v_institution_count INTEGER;
  v_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_institution_count FROM institutions;

  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_name IN (
    'get_user_institution_id',
    'is_super_admin',
    'is_institution_admin',
    'same_institution',
    'create_institution',
    'generate_activation_code',
    'invite_student',
    'activate_account_with_code',
    'batch_invite_students'
  );

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   ✅ MODELO MULTI-COLEGIO IMPLEMENTADO EXITOSAMENTE       ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CAMBIOS REALIZADOS:';
  RAISE NOTICE '';
  RAISE NOTICE '  📊 Nueva tabla: institutions';
  RAISE NOTICE '     - Almacena colegios con datos de piloto';
  RAISE NOTICE '     - Soporta limites por institucion';
  RAISE NOTICE '';
  RAISE NOTICE '  👤 user_profiles actualizado:';
  RAISE NOTICE '     + institution_id (FK a institutions)';
  RAISE NOTICE '     + curso (3 Medio, 4 Medio)';
  RAISE NOTICE '     + student_code';
  RAISE NOTICE '     + school_year';
  RAISE NOTICE '     + activation_code';
  RAISE NOTICE '     + is_activated';
  RAISE NOTICE '     + invited_by';
  RAISE NOTICE '';
  RAISE NOTICE '  🔐 Nuevos roles:';
  RAISE NOTICE '     - super_admin: Acceso total, gestiona instituciones';
  RAISE NOTICE '     - admin_colegio: Gestiona su propia institucion';
  RAISE NOTICE '';
  RAISE NOTICE '  ⚙️  Funciones creadas: %', v_function_count;
  RAISE NOTICE '     - create_institution()';
  RAISE NOTICE '     - invite_student()';
  RAISE NOTICE '     - activate_account_with_code()';
  RAISE NOTICE '     - batch_invite_students()';
  RAISE NOTICE '';
  RAISE NOTICE '  🔒 Politicas RLS actualizadas:';
  RAISE NOTICE '     - Filtrado por institucion';
  RAISE NOTICE '     - Super admin ve todo';
  RAISE NOTICE '     - Admin colegio ve solo su institucion';
  RAISE NOTICE '';
  RAISE NOTICE '📝 SIGUIENTE PASO:';
  RAISE NOTICE '   Ejecutar en Supabase Dashboard > SQL Editor';
  RAISE NOTICE '   Luego actualizar los servicios del frontend';
  RAISE NOTICE '';
END $$;
