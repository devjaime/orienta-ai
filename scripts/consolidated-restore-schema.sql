-- ============================================
-- SCRIPT CONSOLIDADO DE RESTAURACION - VOCARI
-- ============================================
-- Fecha: 2025
-- Descripcion: Script idempotente para restaurar TODO el esquema
--              despues de restaurar la BD de Supabase.
--              Ejecutar en: Supabase Dashboard > SQL Editor
--
-- ORDEN DE EJECUCION:
--   Parte 1: Tablas base (user_profiles, carreras, scheduled_sessions)
--   Parte 2: Multi-tenant (institutions, columnas en user_profiles)
--   Parte 3: Funciones helper (is_admin, is_orientador, is_super_admin, etc.)
--   Parte 4: Control de estados y aprobaciones
--   Parte 5: Perfiles antes del registro
--   Parte 6: Sistema de orientador
--   Parte 7: Vinculos apoderado-estudiante
--   Parte 8: Desactivacion y acceso temporal
--   Parte 9: Politicas RLS consolidadas (sin recursion)
-- ============================================

-- ============================================
-- PARTE 1: TABLAS BASE
-- ============================================

-- 1.1 Funcion helper para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.2 Tabla user_profiles (solo si no existe)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  avatar_url TEXT,
  edad INTEGER CHECK (edad >= 13 AND edad <= 120),
  genero TEXT CHECK (genero IN ('Mujer', 'Hombre', 'Otro', 'Prefiero no decir')),
  motivaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(user_email);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at para user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 1.3 Agregar campo role si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'estudiante';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Eliminar constraint de role restrictivo si existe (para soportar todos los roles)
DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 1.4 Tabla carreras_enriquecidas
CREATE TABLE IF NOT EXISTS carreras_enriquecidas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  codigo_holland VARCHAR(3) NOT NULL,
  dimension_principal CHAR(1),
  area TEXT,
  duracion_anos_oficial INTEGER,
  nivel_matematicas TEXT,
  empleabilidad TEXT,
  salario_promedio_estimado INTEGER,
  descripcion TEXT,
  perfil_ideal TEXT,
  universidades_destacadas TEXT[],
  campos_laborales TEXT[],
  matricula_actual INTEGER,
  matricula_ano INTEGER,
  crecimiento_anual NUMERIC(5,2),
  titulados_ultimo_ano INTEGER,
  instituciones_ofrecen_count INTEGER,
  tasa_titulacion NUMERIC(3,2),
  duracion_real_promedio NUMERIC(3,1),
  fuente_datos_mineduc TEXT,
  fecha_actualizacion_mineduc TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carreras_codigo_holland ON carreras_enriquecidas(codigo_holland);
CREATE INDEX IF NOT EXISTS idx_carreras_area ON carreras_enriquecidas(area);
CREATE INDEX IF NOT EXISTS idx_carreras_dimension ON carreras_enriquecidas(dimension_principal);

-- 1.5 Tabla mineduc_sync_log
CREATE TABLE IF NOT EXISTS mineduc_sync_log (
  id SERIAL PRIMARY KEY,
  sync_date TIMESTAMP DEFAULT NOW(),
  dataset_name TEXT,
  records_processed INTEGER,
  records_updated INTEGER,
  status TEXT,
  error_message TEXT
);

-- 1.6 Tabla scheduled_sessions
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  orientador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link TEXT,
  user_notes TEXT,
  orientador_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_user_id ON scheduled_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_orientador_id ON scheduled_sessions(orientador_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_status ON scheduled_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date ON scheduled_sessions(scheduled_date);

ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Trigger para scheduled_sessions
CREATE OR REPLACE FUNCTION update_scheduled_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scheduled_sessions_timestamp ON scheduled_sessions;
CREATE TRIGGER trigger_update_scheduled_sessions_timestamp
  BEFORE UPDATE ON scheduled_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_sessions_timestamp();


-- ============================================
-- PARTE 2: MULTI-TENANT (INSTITUTIONS)
-- ============================================

-- 2.1 Tabla institutions (solo si no existe)
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  rbd INTEGER UNIQUE,
  type TEXT NOT NULL DEFAULT 'particular' CHECK (
    type IN ('particular', 'particular_subvencionado', 'municipal', 'servicio_local')
  ),
  address TEXT,
  comuna TEXT,
  region TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  status TEXT NOT NULL DEFAULT 'pilot' CHECK (
    status IN ('pending', 'pilot', 'active', 'inactive', 'suspended')
  ),
  pilot_start_date DATE,
  pilot_end_date DATE,
  max_students INTEGER DEFAULT 100,
  max_orientadores INTEGER DEFAULT 5,
  enabled_courses TEXT[] DEFAULT ARRAY['3 Medio', '4 Medio'],
  settings JSONB DEFAULT '{
    "require_parent_approval": false,
    "auto_approve_students": true,
    "allow_external_sessions": false,
    "session_duration_minutes": 30
  }'::JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_comuna ON institutions(comuna);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at para institutions
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

-- 2.2 Agregar columnas multi-tenant a user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;
    CREATE INDEX idx_user_profiles_institution ON user_profiles(institution_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'curso'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN curso TEXT;
    CREATE INDEX idx_user_profiles_curso ON user_profiles(curso);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'student_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN student_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'school_year'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN school_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN invited_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'activation_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN activation_code TEXT UNIQUE;
    CREATE INDEX idx_user_profiles_activation_code ON user_profiles(activation_code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_activated'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_activated BOOLEAN DEFAULT FALSE;
    UPDATE user_profiles SET is_activated = TRUE WHERE user_id IS NOT NULL;
  END IF;

  RAISE NOTICE 'Columnas multi-tenant agregadas a user_profiles';
END $$;


-- ============================================
-- PARTE 3: FUNCIONES HELPER (SECURITY DEFINER)
-- ============================================

-- 3.1 is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'admin_colegio', 'super_admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3.2 is_orientador()
CREATE OR REPLACE FUNCTION public.is_orientador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('orientador', 'admin', 'admin_colegio', 'super_admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_orientador() TO authenticated;

-- 3.3 is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 3.4 is_institution_admin()
CREATE OR REPLACE FUNCTION public.is_institution_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin_colegio', 'super_admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_institution_admin() TO authenticated;

-- 3.5 get_user_institution_id()
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

-- 3.6 same_institution()
CREATE OR REPLACE FUNCTION public.same_institution(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_my_institution UUID;
  v_target_institution UUID;
BEGIN
  SELECT institution_id INTO v_my_institution
  FROM public.user_profiles WHERE user_id = auth.uid();

  SELECT institution_id INTO v_target_institution
  FROM public.user_profiles WHERE user_id = target_user_id;

  RETURN v_my_institution IS NOT NULL
    AND v_target_institution IS NOT NULL
    AND v_my_institution = v_target_institution;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.same_institution(UUID) TO authenticated;


-- ============================================
-- PARTE 4: CONTROL DE ESTADOS Y APROBACIONES
-- ============================================

-- 4.1 Agregar columnas de estado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    UPDATE user_profiles SET status = 'active' WHERE role IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN rejection_reason TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN admin_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'requested_role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN requested_role TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN telefono TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_requested_role ON user_profiles(requested_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_expires_at ON user_profiles(expires_at);

-- 4.2 Funciones de aprobacion y gestion

CREATE OR REPLACE FUNCTION approve_user_with_role(
  p_user_id UUID, p_role TEXT, p_admin_id UUID, p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = p_admin_id
    AND role IN ('admin', 'admin_colegio', 'super_admin') AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  UPDATE user_profiles SET
    role = p_role, status = 'active', approved_by = p_admin_id,
    approved_at = NOW(), admin_notes = p_notes, requested_role = NULL
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_user_request(
  p_user_id UUID, p_admin_id UUID, p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = p_admin_id
    AND role IN ('admin', 'admin_colegio', 'super_admin') AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  UPDATE user_profiles SET
    status = 'rejected', approved_by = p_admin_id, approved_at = NOW(),
    rejection_reason = p_reason, requested_role = NULL
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION change_user_status(
  p_user_id UUID, p_admin_id UUID, p_new_status TEXT, p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;
  IF p_user_id = p_admin_id AND p_new_status IN ('inactive', 'suspended') THEN
    RAISE EXCEPTION 'No puedes desactivarte a ti mismo';
  END IF;

  UPDATE user_profiles SET
    status = p_new_status, admin_notes = COALESCE(p_reason, admin_notes)
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION change_user_role(
  p_user_id UUID, p_admin_id UUID, p_new_role TEXT, p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;
  IF p_user_id = p_admin_id THEN
    IF (SELECT COUNT(*) FROM user_profiles
        WHERE role IN ('admin', 'super_admin') AND status = 'active') <= 1 THEN
      RAISE EXCEPTION 'No puedes cambiar tu rol siendo el unico administrador activo';
    END IF;
  END IF;

  UPDATE user_profiles SET
    role = p_new_role, admin_notes = COALESCE(p_reason, admin_notes)
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  user_id UUID, email TEXT, nombre TEXT, requested_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE, edad INTEGER, genero TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id, up.user_email, up.nombre, up.requested_role,
         up.created_at, up.edad, up.genero
  FROM user_profiles up
  WHERE up.status = 'pending' AND up.requested_role IS NOT NULL
  ORDER BY up.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION register_user_with_requested_role(
  p_user_id UUID, p_email TEXT, p_nombre TEXT, p_requested_role TEXT,
  p_edad INTEGER DEFAULT NULL, p_genero TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_status TEXT;
  v_role TEXT;
BEGIN
  IF p_requested_role = 'estudiante' THEN
    v_status := 'active';
    v_role := 'estudiante';
  ELSE
    v_status := 'pending';
    v_role := NULL;
  END IF;

  INSERT INTO user_profiles (user_id, user_email, nombre, role, status, requested_role, edad, genero)
  VALUES (p_user_id, p_email, p_nombre, v_role, v_status,
          CASE WHEN v_role IS NULL THEN p_requested_role ELSE NULL END, p_edad, p_genero)
  ON CONFLICT (user_id) DO UPDATE SET
    user_email = EXCLUDED.user_email, nombre = EXCLUDED.nombre,
    requested_role = EXCLUDED.requested_role, edad = EXCLUDED.edad, genero = EXCLUDED.genero;

  RETURN p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: prevenir cambios de rol/status por el propio usuario
CREATE OR REPLACE FUNCTION prevent_self_role_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id = auth.uid() THEN
    IF NEW.role != OLD.role OR NEW.status != OLD.status THEN
      IF NOT public.is_admin() THEN
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
-- PARTE 5: PERFILES ANTES DEL REGISTRO + INSTITUTIONS
-- ============================================

-- 5.1 Permitir user_id NULL (para perfiles pre-creados)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_profiles'
    AND constraint_name LIKE '%user_id%'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique
ON user_profiles(user_id)
WHERE user_id IS NOT NULL;

-- 5.2 admin_create_user_profile (con soporte NULL user_id)
CREATE OR REPLACE FUNCTION admin_create_user_profile(
  p_email TEXT, p_nombre TEXT, p_role TEXT,
  p_edad INTEGER DEFAULT 18, p_genero TEXT DEFAULT 'Prefiero no decir',
  p_telefono TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID := auth.uid();
  v_profile_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden crear perfiles de usuario';
  END IF;
  IF p_role NOT IN ('estudiante', 'apoderado', 'orientador', 'admin', 'admin_colegio') THEN
    RAISE EXCEPTION 'Rol invalido: %', p_role;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_email = p_email) THEN
    RAISE EXCEPTION 'Ya existe un perfil con el email: %', p_email;
  END IF;

  INSERT INTO user_profiles (
    user_id, user_email, nombre, role, status, edad, genero,
    telefono, motivaciones, approved_by, approved_at
  ) VALUES (
    v_user_id, p_email, p_nombre, p_role, 'active', p_edad, p_genero,
    p_telefono, 'Creado por administrador', v_admin_id, NOW()
  ) RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_create_user_profile TO authenticated;

-- 5.3 Trigger para vincular al registrarse con Google
CREATE OR REPLACE FUNCTION link_profile_on_auth_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_record RECORD;
BEGIN
  SELECT * INTO v_profile_record
  FROM user_profiles
  WHERE user_email = NEW.email AND user_id IS NULL
  LIMIT 1;

  IF FOUND THEN
    UPDATE user_profiles SET user_id = NEW.id WHERE id = v_profile_record.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 link_user_to_profile (vinculacion manual)
CREATE OR REPLACE FUNCTION link_user_to_profile(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe usuario con email: %', p_email;
  END IF;

  SELECT id INTO v_profile_id FROM user_profiles
  WHERE user_email = p_email AND user_id IS NULL;
  IF v_profile_id IS NULL THEN RETURN FALSE; END IF;

  UPDATE user_profiles SET user_id = v_user_id WHERE id = v_profile_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION link_user_to_profile TO authenticated;

-- 5.5 Funciones de institutions
CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS (SELECT 1 FROM user_profiles WHERE activation_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_institution(
  p_name TEXT, p_code TEXT, p_type TEXT DEFAULT 'particular',
  p_comuna TEXT DEFAULT NULL, p_region TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL, p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL, p_max_students INTEGER DEFAULT 100,
  p_pilot_start_date DATE DEFAULT CURRENT_DATE, p_pilot_end_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_institution_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Solo super_admin puede crear instituciones';
  END IF;
  IF EXISTS (SELECT 1 FROM institutions WHERE code = p_code) THEN
    RAISE EXCEPTION 'Ya existe una institucion con el codigo: %', p_code;
  END IF;

  INSERT INTO institutions (
    name, code, type, comuna, region, contact_name, contact_email, contact_phone,
    max_students, pilot_start_date, pilot_end_date, notes, created_by, status
  ) VALUES (
    p_name, p_code, p_type, p_comuna, p_region, p_contact_name, p_contact_email,
    p_contact_phone, p_max_students, p_pilot_start_date,
    COALESCE(p_pilot_end_date, p_pilot_start_date + INTERVAL '90 days'),
    p_notes, auth.uid(), 'pilot'
  ) RETURNING id INTO v_institution_id;

  RETURN v_institution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_institution TO authenticated;

CREATE OR REPLACE FUNCTION invite_student(
  p_institution_id UUID, p_email TEXT, p_nombre TEXT,
  p_curso TEXT, p_student_code TEXT DEFAULT NULL
)
RETURNS TABLE (profile_id UUID, activation_code TEXT) AS $$
DECLARE
  v_profile_id UUID;
  v_activation_code TEXT;
  v_student_count INTEGER;
  v_max_students INTEGER;
BEGIN
  IF NOT public.is_institution_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden invitar estudiantes';
  END IF;

  SELECT COUNT(*) INTO v_student_count FROM user_profiles
  WHERE institution_id = p_institution_id AND role = 'estudiante';

  SELECT max_students INTO v_max_students FROM institutions WHERE id = p_institution_id;

  IF v_student_count >= COALESCE(v_max_students, 100) THEN
    RAISE EXCEPTION 'Se alcanzo el limite de estudiantes (% de %)', v_student_count, v_max_students;
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_email = p_email AND institution_id = p_institution_id
  ) THEN
    RAISE EXCEPTION 'Ya existe un usuario con email % en esta institucion', p_email;
  END IF;

  v_activation_code := generate_activation_code();

  INSERT INTO user_profiles (
    id, user_id, user_email, nombre, role, status, institution_id,
    curso, student_code, school_year, activation_code, is_activated, invited_by, created_at
  ) VALUES (
    gen_random_uuid(), NULL, p_email, p_nombre, 'estudiante', 'pending',
    p_institution_id, p_curso, p_student_code, EXTRACT(YEAR FROM NOW()),
    v_activation_code, FALSE, auth.uid(), NOW()
  ) RETURNING id INTO v_profile_id;

  RETURN QUERY SELECT v_profile_id, v_activation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION invite_student TO authenticated;

CREATE OR REPLACE FUNCTION activate_account_with_code(
  p_activation_code TEXT, p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM user_profiles
  WHERE activation_code = UPPER(p_activation_code) AND is_activated = FALSE;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Codigo de activacion invalido o ya utilizado';
  END IF;

  UPDATE user_profiles SET
    user_id = p_user_id, is_activated = TRUE, status = 'active',
    activation_code = NULL, updated_at = NOW()
  WHERE id = v_profile_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION activate_account_with_code TO authenticated;

CREATE OR REPLACE FUNCTION batch_invite_students(
  p_institution_id UUID, p_students JSONB
)
RETURNS TABLE (email TEXT, nombre TEXT, activation_code TEXT, status TEXT, error TEXT) AS $$
DECLARE
  v_student JSONB;
  v_result RECORD;
BEGIN
  IF NOT public.is_institution_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden importar estudiantes';
  END IF;

  FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    BEGIN
      SELECT * INTO v_result FROM invite_student(
        p_institution_id, v_student->>'email', v_student->>'nombre',
        v_student->>'curso', v_student->>'student_code'
      );
      email := v_student->>'email';
      nombre := v_student->>'nombre';
      activation_code := v_result.activation_code;
      status := 'success';
      error := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
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


-- ============================================
-- PARTE 6: SISTEMA DE ORIENTADOR
-- ============================================

-- 6.1 Tabla orientador_availability
CREATE TABLE IF NOT EXISTS orientador_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orientador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes IN (15, 30, 45, 60)),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(orientador_id, day_of_week, start_time),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_orientador_availability_orientador ON orientador_availability(orientador_id);
CREATE INDEX IF NOT EXISTS idx_orientador_availability_day ON orientador_availability(day_of_week);

ALTER TABLE orientador_availability ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_update_orientador_availability_timestamp ON orientador_availability;
CREATE TRIGGER trigger_update_orientador_availability_timestamp
  BEFORE UPDATE ON orientador_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6.2 Tabla session_notes
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
  orientador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_notes TEXT NOT NULL,
  ai_summary TEXT,
  ai_generated_at TIMESTAMP WITH TIME ZONE,
  ai_analysis JSONB,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_orientador ON session_notes(orientador_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_follow_up ON session_notes(follow_up_needed, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_session_notes_tags ON session_notes USING GIN(tags);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_update_session_notes_timestamp ON session_notes;
CREATE TRIGGER trigger_update_session_notes_timestamp
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6.3 Tabla student_orientador_assignments
CREATE TABLE IF NOT EXISTS student_orientador_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orientador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL DEFAULT 'auto' CHECK (assignment_type IN ('auto', 'manual')),
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  total_sessions INTEGER DEFAULT 0,
  pending_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_session_at TIMESTAMP WITH TIME ZONE,
  transferred_at TIMESTAMP WITH TIME ZONE,
  transferred_to UUID REFERENCES auth.users(id),
  transfer_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_assignments_student ON student_orientador_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_orientador ON student_orientador_assignments(orientador_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON student_orientador_assignments(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_active_student
  ON student_orientador_assignments(student_id) WHERE status = 'active';

ALTER TABLE student_orientador_assignments ENABLE ROW LEVEL SECURITY;

-- 6.4 Trigger para metricas de asignacion
CREATE OR REPLACE FUNCTION update_assignment_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.orientador_id IS NOT NULL THEN
      UPDATE student_orientador_assignments SET
        total_sessions = (SELECT COUNT(*) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id AND user_id = NEW.user_id),
        pending_sessions = (SELECT COUNT(*) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id AND user_id = NEW.user_id AND status = 'pending'),
        completed_sessions = (SELECT COUNT(*) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id AND user_id = NEW.user_id AND status = 'completed'),
        last_session_at = (SELECT MAX(scheduled_date) FROM scheduled_sessions
          WHERE orientador_id = NEW.orientador_id AND user_id = NEW.user_id)
      WHERE student_id = NEW.user_id AND orientador_id = NEW.orientador_id AND status = 'active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assignment_metrics ON scheduled_sessions;
CREATE TRIGGER trigger_update_assignment_metrics
  AFTER INSERT OR UPDATE ON scheduled_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_metrics();

-- 6.5 Vista materializada orientador_workload_stats
DROP MATERIALIZED VIEW IF EXISTS orientador_workload_stats CASCADE;

CREATE MATERIALIZED VIEW orientador_workload_stats AS
SELECT
  up.user_id as orientador_id,
  up.nombre as orientador_nombre,
  COUNT(DISTINCT soa.student_id) FILTER (WHERE soa.status = 'active') as total_students,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'pending') as pending_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'confirmed') as confirmed_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'completed') as completed_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status IN ('pending', 'confirmed', 'completed')) as total_sessions,
  COALESCE(SUM(ss.duration_minutes) FILTER (
    WHERE ss.status = 'completed' AND ss.completed_at >= NOW() - INTERVAL '30 days'
  ), 0) / 60.0 as hours_last_30_days,
  MAX(ss.scheduled_date) as last_session_date,
  (
    COUNT(DISTINCT soa.student_id) FILTER (WHERE soa.status = 'active') * 1.0 +
    COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'pending') * 2.0 +
    COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'confirmed') * 1.5
  ) as workload_score,
  NOW() as last_updated
FROM user_profiles up
LEFT JOIN student_orientador_assignments soa ON up.user_id = soa.orientador_id
LEFT JOIN scheduled_sessions ss ON up.user_id = ss.orientador_id
WHERE up.role IN ('orientador', 'admin', 'admin_colegio', 'super_admin')
GROUP BY up.user_id, up.nombre;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workload_stats_orientador ON orientador_workload_stats(orientador_id);

-- 6.6 Funciones de orientador
CREATE OR REPLACE FUNCTION refresh_orientador_workload_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY orientador_workload_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_orientador_with_least_workload(
  preferred_date TIMESTAMP WITH TIME ZONE, duration_mins INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  selected_orientador UUID;
  day_of_week_num INTEGER;
  session_time TIME;
BEGIN
  day_of_week_num := EXTRACT(DOW FROM preferred_date);
  session_time := preferred_date::TIME;

  SELECT ows.orientador_id INTO selected_orientador
  FROM orientador_workload_stats ows
  INNER JOIN orientador_availability oa ON ows.orientador_id = oa.orientador_id
  WHERE oa.day_of_week = day_of_week_num AND oa.is_active = TRUE
    AND session_time >= oa.start_time
    AND session_time + (duration_mins || ' minutes')::INTERVAL <= oa.end_time
    AND NOT EXISTS (
      SELECT 1 FROM scheduled_sessions ss
      WHERE ss.orientador_id = ows.orientador_id
      AND ss.status IN ('pending', 'confirmed')
      AND ss.scheduled_date < preferred_date + (duration_mins || ' minutes')::INTERVAL
      AND ss.scheduled_date + (ss.duration_minutes || ' minutes')::INTERVAL > preferred_date
    )
  ORDER BY ows.workload_score ASC LIMIT 1;

  RETURN selected_orientador;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_time_slots(
  start_date DATE, end_date DATE, orientador_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  orientador_id UUID, orientador_nombre TEXT,
  slot_datetime TIMESTAMP WITH TIME ZONE, duration_minutes INTEGER, workload_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date::TIMESTAMP, end_date::TIMESTAMP, '1 day'::INTERVAL) as day
  ),
  time_slots AS (
    SELECT ds.day, EXTRACT(DOW FROM ds.day)::INTEGER as dow,
           oa.orientador_id, oa.start_time, oa.end_time, oa.slot_duration_minutes,
           generate_series(
             (ds.day + oa.start_time)::TIMESTAMP WITH TIME ZONE,
             (ds.day + oa.end_time - (oa.slot_duration_minutes || ' minutes')::INTERVAL)::TIMESTAMP WITH TIME ZONE,
             (oa.slot_duration_minutes || ' minutes')::INTERVAL
           ) as slot_time
    FROM date_series ds CROSS JOIN orientador_availability oa
    WHERE oa.is_active = TRUE AND EXTRACT(DOW FROM ds.day) = oa.day_of_week
      AND (orientador_filter IS NULL OR oa.orientador_id = orientador_filter)
  )
  SELECT ts.orientador_id, up.nombre, ts.slot_time, ts.slot_duration_minutes,
         COALESCE(ows.workload_score, 0)
  FROM time_slots ts
  INNER JOIN user_profiles up ON ts.orientador_id = up.user_id
  LEFT JOIN orientador_workload_stats ows ON ts.orientador_id = ows.orientador_id
  WHERE ts.slot_time > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM scheduled_sessions ss
      WHERE ss.orientador_id = ts.orientador_id AND ss.status IN ('pending', 'confirmed')
      AND ss.scheduled_date < ts.slot_time + (ts.slot_duration_minutes || ' minutes')::INTERVAL
      AND ss.scheduled_date + (ss.duration_minutes || ' minutes')::INTERVAL > ts.slot_time
    )
  ORDER BY ts.slot_time, COALESCE(ows.workload_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REFRESH MATERIALIZED VIEW orientador_workload_stats;


-- ============================================
-- PARTE 7: VINCULOS APODERADO-ESTUDIANTE
-- ============================================

CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'padre/madre' CHECK (
    relationship_type IN ('padre/madre', 'tutor legal', 'familiar', 'otro')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'blocked')
  ),
  student_nickname TEXT,
  notes TEXT,
  can_view_tests BOOLEAN DEFAULT TRUE,
  can_view_sessions BOOLEAN DEFAULT TRUE,
  can_view_notes BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(parent_id, student_id),
  CHECK (parent_id != student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_status ON parent_student_links(status);

ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_update_parent_student_links_timestamp ON parent_student_links;
CREATE TRIGGER trigger_update_parent_student_links_timestamp
  BEFORE UPDATE ON parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Limite de 5 estudiantes por apoderado
CREATE OR REPLACE FUNCTION check_parent_student_limit()
RETURNS TRIGGER AS $$
DECLARE v_student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_student_count FROM parent_student_links
  WHERE parent_id = NEW.parent_id AND status = 'accepted';
  IF v_student_count >= 5 THEN
    RAISE EXCEPTION 'Un apoderado no puede tener mas de 5 estudiantes vinculados';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_parent_student_limit ON parent_student_links;
CREATE TRIGGER trigger_check_parent_student_limit
  BEFORE INSERT OR UPDATE ON parent_student_links
  FOR EACH ROW WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION check_parent_student_limit();

-- Funciones de apoderado
CREATE OR REPLACE FUNCTION request_parent_student_link(
  p_parent_id UUID, p_student_email TEXT,
  p_relationship TEXT DEFAULT 'padre/madre', p_nickname TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE v_student_id UUID; v_link_id UUID;
BEGIN
  SELECT user_id INTO v_student_id FROM user_profiles
  WHERE user_email = p_student_email AND role = 'estudiante';
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro un estudiante con ese email';
  END IF;
  IF EXISTS (SELECT 1 FROM parent_student_links
    WHERE parent_id = p_parent_id AND student_id = v_student_id) THEN
    RAISE EXCEPTION 'Ya existe un vinculo con este estudiante';
  END IF;

  INSERT INTO parent_student_links (parent_id, student_id, relationship_type, student_nickname, status)
  VALUES (p_parent_id, v_student_id, p_relationship, p_nickname, 'pending')
  RETURNING id INTO v_link_id;
  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_parent_student_ai_summaries(p_parent_id UUID, p_student_id UUID)
RETURNS TABLE (
  session_id UUID, session_date TIMESTAMP WITH TIME ZONE,
  ai_summary TEXT, ai_analysis JSONB, orientador_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ss.id, ss.scheduled_date, sn.ai_summary, sn.ai_analysis, up.nombre
  FROM scheduled_sessions ss
  INNER JOIN session_notes sn ON ss.id = sn.session_id
  INNER JOIN user_profiles up ON ss.orientador_id = up.user_id
  WHERE ss.user_id = p_student_id AND ss.status = 'completed'
    AND EXISTS (
      SELECT 1 FROM parent_student_links
      WHERE parent_id = p_parent_id AND student_id = p_student_id
      AND status = 'accepted' AND can_view_sessions = TRUE
    )
  ORDER BY ss.scheduled_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- PARTE 8: DESACTIVACION Y ACCESO TEMPORAL
-- ============================================

CREATE OR REPLACE FUNCTION admin_deactivate_user(
  p_user_id UUID, p_reason TEXT DEFAULT 'Desactivado por administrador'
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden desactivar usuarios';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes desactivarte a ti mismo';
  END IF;

  UPDATE user_profiles SET
    status = 'inactive',
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
      to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Desactivado: ' || p_reason,
    expires_at = NULL
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_deactivate_user TO authenticated;

CREATE OR REPLACE FUNCTION admin_grant_temporary_access(
  p_user_id UUID, p_days INTEGER, p_reason TEXT DEFAULT 'Acceso temporal'
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden dar acceso temporal';
  END IF;
  IF p_days NOT IN (10, 15, 30) THEN
    RAISE EXCEPTION 'Los dias deben ser 10, 15 o 30';
  END IF;
  v_expires_at := NOW() + (p_days || ' days')::INTERVAL;

  UPDATE user_profiles SET
    status = 'active', expires_at = v_expires_at,
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
      to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Acceso temporal ' || p_days || ' dias: ' || p_reason
  WHERE user_id = p_user_id;
  RETURN v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_grant_temporary_access TO authenticated;

CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id UUID, p_reason TEXT DEFAULT 'Eliminado por administrador'
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden eliminar usuarios';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminarte a ti mismo';
  END IF;
  DELETE FROM user_profiles WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_delete_user TO authenticated;

CREATE OR REPLACE FUNCTION admin_reactivate_user(
  p_user_id UUID, p_reason TEXT DEFAULT 'Reactivado por administrador'
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden reactivar usuarios';
  END IF;
  UPDATE user_profiles SET
    status = 'active', expires_at = NULL,
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
      to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Reactivado: ' || p_reason
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_reactivate_user TO authenticated;

CREATE OR REPLACE FUNCTION auto_deactivate_expired_users()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE user_profiles SET
    status = 'inactive',
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
      to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS') || ' - Acceso expirado automaticamente'
  WHERE expires_at IS NOT NULL AND expires_at < NOW() AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- PARTE 9: POLITICAS RLS CONSOLIDADAS (SIN RECURSION)
-- ============================================

-- 9.1 Limpiar TODAS las politicas antiguas de user_profiles
DROP POLICY IF EXISTS "Usuarios ven solo su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios ven su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios activos ven su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios crean solo su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios crean su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios actualizan solo su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios activos actualizan su perfil" ON user_profiles;
DROP POLICY IF EXISTS "Admins ven todos los usuarios" ON user_profiles;
DROP POLICY IF EXISTS "Admins actualizan usuarios" ON user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "rls_select_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_update_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_select_profiles_v2" ON user_profiles;
DROP POLICY IF EXISTS "rls_insert_profiles_v2" ON user_profiles;
DROP POLICY IF EXISTS "rls_update_profiles_v2" ON user_profiles;
DROP POLICY IF EXISTS "rls_delete_profiles_v2" ON user_profiles;

-- 9.2 Politicas definitivas user_profiles (usando funciones SECURITY DEFINER)
CREATE POLICY "rls_select_profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR public.is_orientador()
    OR (public.is_institution_admin() AND public.same_institution(user_id))
  );

CREATE POLICY "rls_insert_profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
    OR (public.is_institution_admin() AND institution_id = public.get_user_institution_id())
  );

CREATE POLICY "rls_update_profiles"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (public.is_institution_admin() AND public.same_institution(user_id))
  );

CREATE POLICY "rls_delete_profiles"
  ON user_profiles FOR DELETE
  USING (public.is_admin());

-- 9.3 Politicas de institutions
DROP POLICY IF EXISTS "super_admin_select_institutions" ON institutions;
DROP POLICY IF EXISTS "institution_admin_select_own" ON institutions;
DROP POLICY IF EXISTS "super_admin_insert_institutions" ON institutions;
DROP POLICY IF EXISTS "admin_update_institutions" ON institutions;
DROP POLICY IF EXISTS "super_admin_delete_institutions" ON institutions;

CREATE POLICY "super_admin_select_institutions"
  ON institutions FOR SELECT USING (public.is_super_admin());

CREATE POLICY "institution_admin_select_own"
  ON institutions FOR SELECT
  USING (id = public.get_user_institution_id() AND public.is_institution_admin());

CREATE POLICY "super_admin_insert_institutions"
  ON institutions FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "admin_update_institutions"
  ON institutions FOR UPDATE
  USING (public.is_super_admin() OR (id = public.get_user_institution_id() AND public.is_institution_admin()));

CREATE POLICY "super_admin_delete_institutions"
  ON institutions FOR DELETE USING (public.is_super_admin());

-- 9.4 Politicas de scheduled_sessions
DROP POLICY IF EXISTS "Usuarios ven sus sesiones" ON scheduled_sessions;
DROP POLICY IF EXISTS "Orientadores ven sesiones asignadas" ON scheduled_sessions;
DROP POLICY IF EXISTS "Usuarios crean sesiones" ON scheduled_sessions;
DROP POLICY IF EXISTS "Orientadores actualizan sesiones" ON scheduled_sessions;

CREATE POLICY "Usuarios ven sus sesiones"
  ON scheduled_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Orientadores ven sesiones asignadas"
  ON scheduled_sessions FOR SELECT
  USING (auth.uid() = orientador_id OR public.is_orientador());

CREATE POLICY "Usuarios crean sesiones"
  ON scheduled_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orientadores actualizan sesiones"
  ON scheduled_sessions FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = orientador_id OR public.is_orientador());

-- 9.5 Politicas de orientador_availability
DROP POLICY IF EXISTS "Todos ven disponibilidad" ON orientador_availability;
DROP POLICY IF EXISTS "Orientadores gestionan su disponibilidad" ON orientador_availability;

CREATE POLICY "Todos ven disponibilidad"
  ON orientador_availability FOR SELECT USING (TRUE);

CREATE POLICY "Orientadores gestionan su disponibilidad"
  ON orientador_availability FOR ALL
  USING (auth.uid() = orientador_id AND public.is_orientador());

-- 9.6 Politicas de session_notes
DROP POLICY IF EXISTS "Orientadores ven sus notas" ON session_notes;
DROP POLICY IF EXISTS "Orientadores crean notas" ON session_notes;
DROP POLICY IF EXISTS "Orientadores actualizan sus notas" ON session_notes;

CREATE POLICY "Orientadores ven sus notas"
  ON session_notes FOR SELECT
  USING (auth.uid() = orientador_id OR public.is_admin());

CREATE POLICY "Orientadores crean notas"
  ON session_notes FOR INSERT
  WITH CHECK (auth.uid() = orientador_id AND public.is_orientador());

CREATE POLICY "Orientadores actualizan sus notas"
  ON session_notes FOR UPDATE
  USING (auth.uid() = orientador_id OR public.is_admin());

-- 9.7 Politicas de student_orientador_assignments
DROP POLICY IF EXISTS "Estudiantes ven su asignacion" ON student_orientador_assignments;
DROP POLICY IF EXISTS "Orientadores ven sus asignaciones" ON student_orientador_assignments;
DROP POLICY IF EXISTS "Admins gestionan asignaciones" ON student_orientador_assignments;

CREATE POLICY "Estudiantes ven su asignacion"
  ON student_orientador_assignments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Orientadores ven sus asignaciones"
  ON student_orientador_assignments FOR SELECT
  USING (auth.uid() = orientador_id OR public.is_orientador());

CREATE POLICY "Admins gestionan asignaciones"
  ON student_orientador_assignments FOR ALL
  USING (public.is_admin());

-- 9.8 Politicas de parent_student_links
DROP POLICY IF EXISTS "Apoderados ven sus vinculos" ON parent_student_links;
DROP POLICY IF EXISTS "Apoderados crean vinculos" ON parent_student_links;
DROP POLICY IF EXISTS "Apoderados actualizan sus vinculos" ON parent_student_links;
DROP POLICY IF EXISTS "Estudiantes aceptan/rechazan vinculos" ON parent_student_links;

CREATE POLICY "Apoderados ven sus vinculos"
  ON parent_student_links FOR SELECT
  USING (auth.uid() = parent_id OR auth.uid() = student_id OR public.is_orientador());

CREATE POLICY "Apoderados crean vinculos"
  ON parent_student_links FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Apoderados actualizan sus vinculos"
  ON parent_student_links FOR UPDATE
  USING (auth.uid() = parent_id OR public.is_admin());

CREATE POLICY "Estudiantes aceptan/rechazan vinculos"
  ON parent_student_links FOR UPDATE
  USING (auth.uid() = student_id AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected'));


-- ============================================
-- PARTE 10: VISTAS
-- ============================================

-- 10.1 Vista orientador_stats
CREATE OR REPLACE VIEW orientador_stats AS
SELECT
  up.user_id, up.nombre, up.role,
  COUNT(DISTINCT tr.id) as total_tests,
  COUNT(DISTINCT ss.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN ss.status = 'completed' THEN ss.id END) as completed_sessions,
  COUNT(DISTINCT CASE WHEN ss.status = 'pending' THEN ss.id END) as pending_sessions
FROM user_profiles up
LEFT JOIN test_results tr ON up.user_id = tr.user_id
LEFT JOIN scheduled_sessions ss ON up.user_id = ss.orientador_id
WHERE up.role IN ('orientador', 'admin', 'admin_colegio', 'super_admin')
GROUP BY up.user_id, up.nombre, up.role;

-- 10.2 Vista institution_stats
CREATE OR REPLACE VIEW institution_stats AS
SELECT
  i.id as institution_id, i.name as institution_name, i.code as institution_code,
  i.status as institution_status, i.pilot_start_date, i.pilot_end_date, i.max_students,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'estudiante') as total_students,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'orientador') as total_orientadores,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'apoderado') as total_apoderados,
  COUNT(DISTINCT up.id) FILTER (WHERE up.role = 'admin_colegio') as total_admins,
  COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'pending') as pending_users,
  COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'active') as active_users,
  COUNT(DISTINCT up.id) FILTER (WHERE up.is_activated = FALSE) as not_activated,
  COUNT(DISTINCT up.id) FILTER (WHERE up.curso = '3 Medio') as students_3_medio,
  COUNT(DISTINCT up.id) FILTER (WHERE up.curso = '4 Medio') as students_4_medio,
  COUNT(DISTINCT tr.id) as total_tests_completed,
  COUNT(DISTINCT ss.id) as total_sessions,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'completed') as completed_sessions,
  MIN(up.created_at) as first_user_date,
  MAX(up.created_at) as last_user_date
FROM institutions i
LEFT JOIN user_profiles up ON i.id = up.institution_id
LEFT JOIN test_results tr ON up.user_id = tr.user_id
LEFT JOIN scheduled_sessions ss ON up.user_id = ss.user_id
GROUP BY i.id, i.name, i.code, i.status, i.pilot_start_date, i.pilot_end_date, i.max_students;

-- 10.3 Vista parent_dashboard_summary
CREATE OR REPLACE VIEW parent_dashboard_summary AS
SELECT
  psl.parent_id, psl.student_id, psl.student_nickname, psl.relationship_type,
  psl.status as link_status,
  sp.nombre as student_name, sp.edad as student_age, sp.user_email as student_email,
  (SELECT COUNT(*) FROM test_results WHERE user_id = psl.student_id) as total_tests,
  (SELECT row_to_json(t) FROM (
    SELECT codigo_holland, certeza, completed_at FROM test_results
    WHERE user_id = psl.student_id ORDER BY completed_at DESC LIMIT 1
  ) t) as last_test,
  (SELECT COUNT(*) FROM scheduled_sessions WHERE user_id = psl.student_id) as total_sessions,
  (SELECT COUNT(*) FROM scheduled_sessions
   WHERE user_id = psl.student_id AND status = 'completed') as completed_sessions,
  (SELECT row_to_json(s) FROM (
    SELECT scheduled_date, duration_minutes, status FROM scheduled_sessions
    WHERE user_id = psl.student_id AND status IN ('pending', 'confirmed')
    AND scheduled_date > NOW() ORDER BY scheduled_date ASC LIMIT 1
  ) s) as next_session,
  (SELECT row_to_json(o) FROM (
    SELECT up.nombre as orientador_name, soa.assigned_at
    FROM student_orientador_assignments soa
    JOIN user_profiles up ON soa.orientador_id = up.user_id
    WHERE soa.student_id = psl.student_id AND soa.status = 'active' LIMIT 1
  ) o) as assigned_orientador
FROM parent_student_links psl
LEFT JOIN user_profiles sp ON psl.student_id = sp.user_id
WHERE psl.status = 'accepted';

-- 10.4 Vista users_expiring_soon
CREATE OR REPLACE VIEW users_expiring_soon AS
SELECT
  user_id, user_email, nombre, role, status, expires_at,
  EXTRACT(DAY FROM (expires_at - NOW())) as days_remaining,
  CASE
    WHEN expires_at < NOW() THEN 'Expirado'
    WHEN expires_at < NOW() + INTERVAL '3 days' THEN 'Expira en menos de 3 dias'
    WHEN expires_at < NOW() + INTERVAL '7 days' THEN 'Expira en menos de 7 dias'
    ELSE 'Activo'
  END as expiration_status
FROM user_profiles
WHERE expires_at IS NOT NULL
ORDER BY expires_at ASC;


-- ============================================
-- PARTE 11: MIGRACION DE ADMIN EXISTENTE
-- ============================================

-- Convertir admin existente a super_admin (si hay alguno)
UPDATE user_profiles
SET role = 'super_admin'
WHERE role = 'admin'
AND user_id = (
  SELECT user_id FROM user_profiles
  WHERE role = 'admin' AND status = 'active'
  ORDER BY created_at ASC LIMIT 1
);


-- ============================================
-- VERIFICACION FINAL
-- ============================================

DO $$
DECLARE
  v_tables INTEGER;
  v_functions INTEGER;
  v_views INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'institutions', 'scheduled_sessions',
    'carreras_enriquecidas', 'mineduc_sync_log',
    'orientador_availability', 'session_notes',
    'student_orientador_assignments', 'parent_student_links'
  );

  SELECT COUNT(*) INTO v_functions
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_admin', 'is_orientador', 'is_super_admin', 'is_institution_admin',
    'get_user_institution_id', 'same_institution',
    'create_institution', 'invite_student', 'activate_account_with_code',
    'batch_invite_students', 'generate_activation_code',
    'admin_create_user_profile', 'link_user_to_profile',
    'approve_user_with_role', 'reject_user_request',
    'change_user_status', 'change_user_role', 'get_pending_users',
    'register_user_with_requested_role',
    'admin_deactivate_user', 'admin_grant_temporary_access',
    'admin_delete_user', 'admin_reactivate_user', 'auto_deactivate_expired_users',
    'get_available_orientador_with_least_workload', 'get_available_time_slots',
    'refresh_orientador_workload_stats', 'request_parent_student_link',
    'get_parent_student_ai_summaries'
  );

  SELECT COUNT(*) INTO v_views
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name IN (
    'orientador_stats', 'institution_stats',
    'parent_dashboard_summary', 'users_expiring_soon'
  );

  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '  RESTAURACION COMPLETADA - VOCARI';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '  Tablas:    % de 9', v_tables;
  RAISE NOTICE '  Funciones: % encontradas', v_functions;
  RAISE NOTICE '  Vistas:    % de 4', v_views;
  RAISE NOTICE '  + 1 vista materializada (orientador_workload_stats)';
  RAISE NOTICE '';
  RAISE NOTICE '  Ejecutar verificacion: node scripts/verify-supabase-schema.js';
  RAISE NOTICE '========================================================';
END $$;
