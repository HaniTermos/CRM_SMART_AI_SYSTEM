-- ============================================
-- SmartStore AI Migration 010: Revenue Growth Engine Phase 2 (Safe Execution & Audit)
-- ============================================

-- Table 1: purchase_orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  supplier_name text NOT NULL DEFAULT 'Default Supplier',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(50) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_store ON public.purchase_orders(store_id);

-- Table 2: growth_action_logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.growth_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES public.pulse_recommendations(id) ON DELETE SET NULL,
  action_type varchar(50) NOT NULL,
  executed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_entity_type varchar(50),
  target_entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_action_logs_store ON public.growth_action_logs(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_action_logs_rec ON public.growth_action_logs(recommendation_id);

-- Execution Tracking on pulse_recommendations
ALTER TABLE public.pulse_recommendations DROP CONSTRAINT IF EXISTS pulse_recommendations_status_check;
ALTER TABLE public.pulse_recommendations ADD CONSTRAINT pulse_recommendations_status_check
  CHECK (status IN ('active', 'viewed', 'dismissed', 'executed'));

ALTER TABLE public.pulse_recommendations
  ADD COLUMN IF NOT EXISTS executed_at timestamptz,
  ADD COLUMN IF NOT EXISTS execution_result jsonb;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS purchase_orders_set_updated_at ON public.purchase_orders;
CREATE TRIGGER purchase_orders_set_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
