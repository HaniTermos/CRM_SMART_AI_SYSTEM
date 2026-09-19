-- ============================================
-- SmartStore AI Migration 011: Revenue Growth Engine Phase 3 (Impact Tracker & Audit Immutability)
-- ============================================

-- Table: growth_experiments
CREATE TABLE IF NOT EXISTS public.growth_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES public.pulse_recommendations(id) ON DELETE CASCADE,
  action_log_id uuid REFERENCES public.growth_action_logs(id) ON DELETE SET NULL,
  action_type varchar(50) NOT NULL,
  target_metric varchar(100) NOT NULL,
  target_entity_type varchar(50),
  target_entity_id text,
  baseline_value numeric(12,2) NOT NULL DEFAULT 0,
  baseline_period_start timestamptz NOT NULL,
  baseline_period_end timestamptz NOT NULL,
  experiment_start timestamptz NOT NULL DEFAULT now(),
  experiment_end timestamptz NOT NULL,
  expected_impact varchar(255) NOT NULL,
  actual_value numeric(12,2) DEFAULT NULL,
  actual_impact numeric(12,2) DEFAULT NULL,
  status varchar(50) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'inconclusive', 'awaiting_campaign_send')),
  result varchar(50) DEFAULT NULL CHECK (result IS NULL OR result IN ('success', 'neutral', 'failure')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  CONSTRAINT unique_experiment_recommendation UNIQUE (recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_experiments_store ON public.growth_experiments(store_id, status);
CREATE INDEX IF NOT EXISTS idx_experiments_rec ON public.growth_experiments(recommendation_id);

-- Enforce DB-Level Immutability on growth_action_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'growth_action_logs entries are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS growth_action_logs_immutable ON public.growth_action_logs;
CREATE TRIGGER growth_action_logs_immutable
  BEFORE UPDATE OR DELETE ON public.growth_action_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();
