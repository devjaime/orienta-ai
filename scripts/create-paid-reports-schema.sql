-- ============================================
-- Schema: Informes Vocacionales Pagados (B2C)
-- Vocari - Sistema de informes con Flow.cl
-- ============================================

-- Tabla: Catálogo de planes
CREATE TABLE IF NOT EXISTS report_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- 'esencial' | 'premium'
  display_name TEXT NOT NULL,         -- 'Plan Esencial' | 'Plan Premium'
  price_clp INTEGER NOT NULL,         -- 10990 | 14990
  features JSONB NOT NULL,            -- array de features incluidas
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar planes iniciales
INSERT INTO report_plans (name, display_name, price_clp, features, is_active)
VALUES
  (
    'esencial',
    'Plan Esencial',
    10990,
    '["Informe PDF completo", "Análisis RIASEC detallado", "Carreras recomendadas con datos reales MINEDUC", "Revisado por orientadores calificados"]'::jsonb,
    true
  ),
  (
    'premium',
    'Plan Premium',
    14990,
    '["Informe PDF completo", "Análisis RIASEC detallado", "Carreras recomendadas con datos reales MINEDUC", "Revisado por orientadores calificados", "Explicación visual personalizada", "Resumen ejecutivo animado"]'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Tabla: Informes comprados
CREATE TABLE IF NOT EXISTS paid_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan_id UUID REFERENCES report_plans(id) NOT NULL,
  status TEXT DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment', 'paid', 'generating', 'review',
      'approved', 'delivered', 'rejected'
    )),
  flow_token TEXT,                  -- Token de Flow.cl
  flow_order TEXT,                  -- commerceOrder de Flow.cl
  flow_payment_data JSONB,          -- Datos completos de respuesta de Flow
  test_result_snapshot JSONB,       -- copia del resultado RIASEC al momento de compra
  report_content JSONB,             -- contenido generado por IA
  visual_explanation JSONB,         -- datos para explicación visual (solo premium)
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  pdf_url TEXT,                     -- URL del PDF generado (Supabase Storage)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_paid_reports_user_id ON paid_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_paid_reports_status ON paid_reports(status);
CREATE INDEX IF NOT EXISTS idx_paid_reports_created_at ON paid_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paid_reports_reviewer_id ON paid_reports(reviewer_id);

-- Vista para panel admin
CREATE OR REPLACE VIEW paid_reports_admin AS
SELECT
  pr.id,
  pr.user_id,
  pr.status,
  pr.created_at,
  pr.updated_at,
  pr.reviewed_at,
  pr.reviewer_notes,
  pr.pdf_url,
  rp.name AS plan_name,
  rp.display_name AS plan_display_name,
  rp.price_clp,
  up.nombre AS user_nombre,
  up.user_email,
  reviewer.nombre AS reviewer_nombre
FROM paid_reports pr
JOIN report_plans rp ON rp.id = pr.plan_id
LEFT JOIN user_profiles up ON up.user_id = pr.user_id
LEFT JOIN user_profiles reviewer ON reviewer.user_id = pr.reviewer_id
ORDER BY pr.created_at DESC;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_paid_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paid_reports_updated_at ON paid_reports;
CREATE TRIGGER trg_paid_reports_updated_at
  BEFORE UPDATE ON paid_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_paid_reports_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE report_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_reports ENABLE ROW LEVEL SECURITY;

-- report_plans: lectura pública (catálogo de planes)
CREATE POLICY "Planes visibles para todos"
  ON report_plans FOR SELECT
  USING (true);

-- paid_reports: usuario ve solo sus informes
CREATE POLICY "Usuarios ven sus propios informes"
  ON paid_reports FOR SELECT
  USING (auth.uid() = user_id);

-- paid_reports: usuario puede insertar sus propios informes
CREATE POLICY "Usuarios pueden crear informes"
  ON paid_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- paid_reports: admins/orientadores ven todos los informes
CREATE POLICY "Admins ven todos los informes"
  ON paid_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'orientador')
    )
  );

-- paid_reports: admins/orientadores pueden actualizar informes (revisión)
CREATE POLICY "Admins pueden actualizar informes"
  ON paid_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'orientador')
    )
  );

-- paid_reports: servicio (service_role) puede hacer todo
-- Nota: Las Netlify Functions usan service_role key que bypassa RLS
