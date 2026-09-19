-- ============================================
-- SmartStore AI Migration 012: Revenue Growth Engine Phase 4A (Internal Monthly Strategy)
-- ============================================

-- Table 1: monthly_growth_strategies
CREATE TABLE IF NOT EXISTS public.monthly_growth_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  strategy_period VARCHAR(7) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  data_sufficiency_tier VARCHAR(50) NOT NULL DEFAULT 'sufficient',
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  past_outcomes_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_store_strategy_period UNIQUE (store_id, strategy_period)
);

CREATE INDEX IF NOT EXISTS idx_monthly_strategies_store_period ON public.monthly_growth_strategies(store_id, strategy_period);

-- Table 2: monthly_strategy_recommendations
CREATE TABLE IF NOT EXISTS public.monthly_strategy_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.monthly_growth_strategies(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('revenue_optimization', 'operational_efficiency', 'customer_retention')),
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reason TEXT NOT NULL,
  evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_impact_range VARCHAR(255) NOT NULL,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  source_basis JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_execution_path VARCHAR(255) NOT NULL,
  experiment_suggestion JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'viewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_strategy_category UNIQUE (strategy_id, category)
);

CREATE INDEX IF NOT EXISTS idx_monthly_recs_strategy ON public.monthly_strategy_recommendations(strategy_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS monthly_growth_strategies_set_updated_at ON public.monthly_growth_strategies;
CREATE TRIGGER monthly_growth_strategies_set_updated_at BEFORE UPDATE ON public.monthly_growth_strategies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS monthly_strategy_recommendations_set_updated_at ON public.monthly_strategy_recommendations;
CREATE TRIGGER monthly_strategy_recommendations_set_updated_at BEFORE UPDATE ON public.monthly_strategy_recommendations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
