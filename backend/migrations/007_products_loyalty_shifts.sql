-- ============================================
-- SmartStore AI Migration 007: Products Enhancements, Shifts & Loyalty Tiers
-- ============================================

-- Products Enhancements
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modifiers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dietary_info jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prep_time_minutes integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS popularity_score integer DEFAULT 0;

-- Staff Shifts
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shifts_store ON public.shifts(store_id, start_time);

-- Loyalty Tiers
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  multiplier numeric(3,2) NOT NULL DEFAULT 1.00,
  benefits jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Customer Points
CREATE TABLE IF NOT EXISTS public.customer_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier_id uuid REFERENCES public.loyalty_tiers(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_customer_points_store ON public.customer_points(store_id);

-- Triggers
DROP TRIGGER IF EXISTS shifts_set_updated_at ON public.shifts;
CREATE TRIGGER shifts_set_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
