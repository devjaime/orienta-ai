-- ============================================
-- SCHEMA PARA SUPABASE: Carreras Enriquecidas
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Copia y pega todo este archivo en el editor SQL

-- Tabla principal de carreras enriquecidas con datos MINEDUC
CREATE TABLE IF NOT EXISTS carreras_enriquecidas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  codigo_holland VARCHAR(3) NOT NULL,
  dimension_principal CHAR(1),
  area TEXT,

  -- Datos básicos
  duracion_anos_oficial INTEGER,
  nivel_matematicas TEXT,
  empleabilidad TEXT,
  salario_promedio_estimado INTEGER,
  descripcion TEXT,
  perfil_ideal TEXT,

  -- Arrays
  universidades_destacadas TEXT[],
  campos_laborales TEXT[],

  -- Datos MINEDUC enriquecidos
  matricula_actual INTEGER,
  matricula_ano INTEGER,
  crecimiento_anual NUMERIC(5,2),
  titulados_ultimo_ano INTEGER,
  instituciones_ofrecen_count INTEGER,
  tasa_titulacion NUMERIC(3,2),
  duracion_real_promedio NUMERIC(3,1),

  -- Metadatos
  fuente_datos_mineduc TEXT,
  fecha_actualizacion_mineduc TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_carreras_codigo_holland
  ON carreras_enriquecidas(codigo_holland);

CREATE INDEX IF NOT EXISTS idx_carreras_area
  ON carreras_enriquecidas(area);

CREATE INDEX IF NOT EXISTS idx_carreras_dimension
  ON carreras_enriquecidas(dimension_principal);

-- Tabla de log de sincronización
CREATE TABLE IF NOT EXISTS mineduc_sync_log (
  id SERIAL PRIMARY KEY,
  sync_date TIMESTAMP DEFAULT NOW(),
  dataset_name TEXT,
  records_processed INTEGER,
  records_updated INTEGER,
  status TEXT,
  error_message TEXT
);

-- Mensaje de confirmación
SELECT 'Tablas creadas exitosamente' AS resultado;
