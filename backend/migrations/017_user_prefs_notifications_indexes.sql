-- ============================================
-- SmartStore AI Migration 017: V3 Foundations
-- User preferences, notifications, and performance indexes
-- ============================================

-- 1. User preferences table (dashboard theme, nav density, reduced motion, defaults)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  dashboard_theme VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (dashboard_theme IN ('light', 'dark', 'system')),
  nav_mode VARCHAR(20) NOT NULL DEFAULT 'dock' CHECK (nav_mode IN ('dock', 'sidebar')),
  density VARCHAR(20) NOT NULL DEFAULT 'comfortable' CHECK (density IN ('compact', 'comfortable')),
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  default_date_range VARCHAR(20) NOT NULL DEFAULT '30d' CHECK (default_date_range IN ('7d', '30d', '90d', '12m')),
  default_dashboard_page VARCHAR(100) NOT NULL DEFAULT '/dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_store_created ON public.notifications(store_id, created_at DESC);

-- 3. Reservation performance indexes
CREATE INDEX IF NOT EXISTS idx_reservations_store_date ON public.reservations(store_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_store_status ON public.reservations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_store_time ON public.reservations(store_id, time);
CREATE INDEX IF NOT EXISTS idx_reservations_store_date_status ON public.reservations(store_id, date, status);

-- 4. Order performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_store_created_status ON public.orders(store_id, created_at, status);

-- 5. Customer performance index
CREATE INDEX IF NOT EXISTS idx_customers_store_segment ON public.customers(store_id, segment);

-- 6. Triggers
DROP TRIGGER IF EXISTS user_preferences_set_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_set_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Seed default preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
