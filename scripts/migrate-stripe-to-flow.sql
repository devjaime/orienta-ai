-- ============================================
-- Migración: Stripe → Flow.cl
-- Ejecutar si ya corriste create-paid-reports-schema.sql
-- con las columnas de Stripe originales
-- ============================================

-- Renombrar/reemplazar columnas de Stripe por Flow
ALTER TABLE paid_reports DROP COLUMN IF EXISTS stripe_session_id;
ALTER TABLE paid_reports DROP COLUMN IF EXISTS stripe_payment_intent;

ALTER TABLE paid_reports ADD COLUMN IF NOT EXISTS flow_token TEXT;
ALTER TABLE paid_reports ADD COLUMN IF NOT EXISTS flow_order TEXT;
ALTER TABLE paid_reports ADD COLUMN IF NOT EXISTS flow_payment_data JSONB;

-- Eliminar stripe_price_id de report_plans (ya no se usa)
ALTER TABLE report_plans DROP COLUMN IF EXISTS stripe_price_id;

-- Índice para buscar por flow_token (usado por webhook)
CREATE INDEX IF NOT EXISTS idx_paid_reports_flow_token ON paid_reports(flow_token);
