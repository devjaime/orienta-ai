-- Tabla user_profiles: Datos adicionales del usuario
-- Ejecutar este SQL en Supabase después de crear la tabla test_results

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  user_email TEXT NOT NULL,

  -- Datos básicos
  nombre TEXT NOT NULL,
  avatar_url TEXT,

  -- Datos vocacionales
  edad INTEGER NOT NULL CHECK (edad >= 13 AND edad <= 120),
  genero TEXT NOT NULL CHECK (genero IN ('Mujer', 'Hombre', 'Otro', 'Prefiero no decir')),
  motivaciones TEXT NOT NULL CHECK (char_length(motivaciones) >= 10),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(user_email);
CREATE INDEX idx_user_profiles_edad ON user_profiles(edad);
CREATE INDEX idx_user_profiles_genero ON user_profiles(genero);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven su propio perfil
CREATE POLICY "Usuarios ven solo su perfil"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo crean su propio perfil
CREATE POLICY "Usuarios crean solo su perfil"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo actualizan su propio perfil
CREATE POLICY "Usuarios actualizan solo su perfil"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE user_profiles IS 'Perfiles adicionales de usuarios para análisis vocacional';
COMMENT ON COLUMN user_profiles.motivaciones IS 'Motivaciones de vida del usuario, usado para personalizar recomendaciones';
COMMENT ON COLUMN user_profiles.edad IS 'Edad del usuario (sin límite superior - orientación para todas las edades)';
COMMENT ON COLUMN user_profiles.genero IS 'Género con el que se identifica el usuario';
