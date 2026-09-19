-- ============================================
-- SmartStore AI Migration 018: Menu Manager Enhancements
-- Adds fields needed for a real connected menu manager.
-- ============================================

-- 1. Product menu fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS prep_time INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modifiers JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_products_store_category ON public.products(store_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_store_status_available ON public.products(store_id, status, is_available);

-- 2. Category ordering
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_categories_store_position ON public.categories(store_id, position);

-- 3. Triggers already exist from 001
