-- ============================================
-- SmartStore AI Migration 025: CMS Appointments & Menu Presentation
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  guest_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INT NOT NULL DEFAULT 2,
  table_preference VARCHAR(50) DEFAULT 'indoor',
  special_requests TEXT,
  dietary_notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending|confirmed|seated|completed|cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_appointments_store ON public.cms_appointments(store_id, reservation_date);

CREATE TABLE IF NOT EXISTS public.cms_menu_presentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  layout_design VARCHAR(50) NOT NULL DEFAULT 'tabs', -- tabs|grid|list|carousel|accordion|board
  image_aspect_ratio VARCHAR(20) DEFAULT '16:9',
  show_dietary_badges BOOLEAN DEFAULT TRUE,
  show_search_bar BOOLEAN DEFAULT TRUE,
  sold_out_behavior VARCHAR(30) DEFAULT 'dim',
  sticky_order_cta BOOLEAN DEFAULT TRUE,
  category_order JSONB DEFAULT '[]'::jsonb,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
