-- ============================================
-- SmartStore AI Migration 013: Phase 4B — External Market Intelligence
-- ============================================

CREATE TABLE IF NOT EXISTS public.external_market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL CHECK (
    signal_type IN (
      'competitor_pricing',
      'competitor_availability',
      'weather',
      'local_event',
      'public_holiday',
      'seasonal_trend',
      'market_observation'
    )
  ),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_name VARCHAR(255) NOT NULL,
  source_url VARCHAR(500),
  observed_at TIMESTAMPTZ NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  confidence INTEGER NOT NULL DEFAULT 60 CHECK (confidence >= 0 AND confidence <= 100),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'expired', 'rejected')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_store_signal_provenance UNIQUE (store_id, source_name, signal_type, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_ext_signals_store ON public.external_market_signals(store_id);
CREATE INDEX IF NOT EXISTS idx_ext_signals_type ON public.external_market_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_ext_signals_observed ON public.external_market_signals(observed_at);
CREATE INDEX IF NOT EXISTS idx_ext_signals_valid_until ON public.external_market_signals(valid_until);
CREATE INDEX IF NOT EXISTS idx_ext_signals_status ON public.external_market_signals(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS external_market_signals_set_updated_at ON public.external_market_signals;
CREATE TRIGGER external_market_signals_set_updated_at
  BEFORE UPDATE ON public.external_market_signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
