-- ============================================
-- SmartStore AI Migration 009: Revenue Growth Engine Phase 1
-- ============================================

-- Table 1: daily_micro_pulses
-- Stores 1 micro pulse per store per business date
CREATE TABLE IF NOT EXISTS public.daily_micro_pulses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  business_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_store_business_date UNIQUE (store_id, business_date)
);

CREATE INDEX IF NOT EXISTS idx_micro_pulses_store_date ON public.daily_micro_pulses(store_id, business_date);

-- Table 2: pulse_recommendations
-- Stores recommendations generated for each pulse
CREATE TABLE IF NOT EXISTS public.pulse_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id uuid NOT NULL REFERENCES public.daily_micro_pulses(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('revenue', 'operations', 'customer_growth')),
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reason TEXT NOT NULL,
  expected_impact VARCHAR(255) NOT NULL,
  target_role VARCHAR(50) NOT NULL DEFAULT 'owner' CHECK (target_role IN ('owner', 'admin', 'manager', 'kitchen', 'marketing')),
  source_basis JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'viewed', 'dismissed')),
  viewed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_pulse_category UNIQUE (pulse_id, category)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_pulse ON public.pulse_recommendations(pulse_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_store_status ON public.pulse_recommendations(store_id, status);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS daily_micro_pulses_set_updated_at ON public.daily_micro_pulses;
CREATE TRIGGER daily_micro_pulses_set_updated_at BEFORE UPDATE ON public.daily_micro_pulses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pulse_recommendations_set_updated_at ON public.pulse_recommendations;
CREATE TRIGGER pulse_recommendations_set_updated_at BEFORE UPDATE ON public.pulse_recommendations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
