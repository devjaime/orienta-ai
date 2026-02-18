-- Vocari Database Schema
-- Tablas necesarias para el sistema completo

-- Tabla de waitlist (para todos los proyectos)
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  project TEXT NOT NULL, -- 'vocari', 'humanloop', 'entrenamiento'
  type TEXT, -- 'student', 'operator', 'investor', 'partner'
  interests TEXT[], -- Array de intereses
  source TEXT, -- 'landing', 'referral', 'social'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  plan TEXT NOT NULL, -- 'esencial', 'premium'
  amount INTEGER NOT NULL, -- en centavos
  currency TEXT DEFAULT 'USD',
  paypal_order_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de reportes generados
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  riasec_profile JSONB NOT NULL,
  recommendations JSONB NOT NULL, -- Array de carreras recomendadas
  html_content TEXT,
  status TEXT DEFAULT 'generating', -- 'generating', 'ready', 'sent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de resultados de test
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  riasec_scores JSONB NOT NULL,
  answers JSONB,
  dominant_profile TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de operadores (para Humanloop)
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  skills TEXT[], -- ['plumbing', 'electrical', 'legal']
  certifications JSONB, -- { sec: true, etc }
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'active'
  rating DECIMAL(3,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);

-- Funciones helper
CREATE OR REPLACE FUNCTION get_user_waitlist_position(email TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER + 1
  FROM waitlist
  WHERE project = 'vocari' 
  AND created_at < (SELECT created_at FROM waitlist WHERE email = email LIMIT 1);
$$ LANGUAGE sql;
