-- ============================================
-- SmartStore AI Migration 014: Phase 4C — Storefront CMS and Brand Management
-- ============================================

-- Table 1: cms_settings
CREATE TABLE IF NOT EXISTS public.cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(50) DEFAULT '#190E85',
  accent_color VARCHAR(50) DEFAULT '#00E0FF',
  font_family VARCHAR(100) DEFAULT 'Inter',
  button_style VARCHAR(50) DEFAULT 'rounded',
  border_radius VARCHAR(50) DEFAULT '0.75rem',
  theme_mode VARCHAR(50) DEFAULT 'light',
  layout_type VARCHAR(50) DEFAULT 'modern',
  homepage_draft JSONB NOT NULL DEFAULT '{
    "hero_title": "Welcome to Our Store",
    "hero_subtitle": "Fresh, high-quality offerings crafted daily.",
    "hero_image": "",
    "cta_primary_text": "Explore Menu",
    "cta_primary_link": "",
    "cta_secondary_text": "Special Deals",
    "cta_secondary_link": "",
    "about_title": "About Our Store",
    "about_description": "We are dedicated to offering exceptional products and memorable customer experiences.",
    "featured_products_enabled": true,
    "gallery_images": [],
    "testimonials": [
      { "name": "Alex M.", "comment": "Best coffee and breakfast in town! Always fresh.", "rating": 5 },
      { "name": "Sarah K.", "comment": "Fast delivery and amazing customer service every single time.", "rating": 5 }
    ],
    "contact_email": "",
    "contact_phone": "",
    "contact_address": ""
  }'::jsonb,
  homepage_published JSONB DEFAULT NULL,
  seo_title VARCHAR(255),
  seo_description TEXT,
  social_image_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_settings_store ON public.cms_settings(store_id);

-- Table 2: cms_media
CREATE TABLE IF NOT EXISTS public.cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  alt_text TEXT DEFAULT '',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_store ON public.cms_media(store_id);

-- Table 3: cms_announcements
CREATE TABLE IF NOT EXISTS public.cms_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  cta_text VARCHAR(100),
  cta_link VARCHAR(255),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_announcements_store ON public.cms_announcements(store_id, status);

-- Table 4: cms_pages
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL CHECK (slug IN ('about', 'contact', 'faq', 'privacy', 'terms', 'delivery-policy', 'reservation-policy')),
  title VARCHAR(255) NOT NULL,
  content_draft TEXT NOT NULL DEFAULT '',
  content_published TEXT DEFAULT '',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title VARCHAR(255),
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_store_page_slug UNIQUE(store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_store_slug ON public.cms_pages(store_id, slug);

-- Table 5: cms_activity_logs
CREATE TABLE IF NOT EXISTS public.cms_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_activity_store ON public.cms_activity_logs(store_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS cms_settings_set_updated_at ON public.cms_settings;
CREATE TRIGGER cms_settings_set_updated_at BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cms_media_set_updated_at ON public.cms_media;
CREATE TRIGGER cms_media_set_updated_at BEFORE UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cms_announcements_set_updated_at ON public.cms_announcements;
CREATE TRIGGER cms_announcements_set_updated_at BEFORE UPDATE ON public.cms_announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cms_pages_set_updated_at ON public.cms_pages;
CREATE TRIGGER cms_pages_set_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Initialize CMS defaults for existing stores
INSERT INTO public.cms_settings (store_id, logo_url, primary_color, accent_color, homepage_published, published_at)
SELECT 
  id as store_id,
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop' as logo_url,
  '#190E85' as primary_color,
  '#00E0FF' as accent_color,
  '{
    "hero_title": "Welcome to Our Storefront",
    "hero_subtitle": "Handcrafted culinary delights and fresh treats daily.",
    "hero_image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop",
    "cta_primary_text": "Explore Menu",
    "cta_primary_link": "",
    "cta_secondary_text": "Special Offers",
    "cta_secondary_link": "",
    "about_title": "Crafted With Passion",
    "about_description": "We source the finest ingredients to prepare incredible meals and beverages for our community.",
    "featured_products_enabled": true,
    "gallery_images": [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop"
    ],
    "testimonials": [
      { "name": "Jessica R.", "comment": "Outstanding food, great ambiance, and fast delivery!", "rating": 5 },
      { "name": "David B.", "comment": "The best coffee and pastries in town. Highly recommended!", "rating": 5 }
    ],
    "contact_email": "hello@smartstore.ai",
    "contact_phone": "+1 (555) 234-5678",
    "contact_address": "123 Gourmet Ave, Culinary District"
  }'::jsonb as homepage_published,
  NOW() as published_at
FROM public.stores
ON CONFLICT (store_id) DO NOTHING;

-- Initialize default 7 static pages for existing stores
INSERT INTO public.cms_pages (store_id, slug, title, content_draft, content_published, status, published_at)
SELECT 
  s.id as store_id,
  p.slug,
  p.title,
  p.content as content_draft,
  p.content as content_published,
  'published' as status,
  NOW() as published_at
FROM public.stores s
CROSS JOIN (
  VALUES 
    ('about', 'About Us', 'Welcome to our store! We are dedicated to delivering culinary excellence and quality service.'),
    ('contact', 'Contact Us', 'Reach out to our team at hello@smartstore.ai or call +1 (555) 234-5678.'),
    ('faq', 'Frequently Asked Questions', 'Q: What are your opening hours?\nA: We are open 7 days a week from 8:00 AM to 10:00 PM.'),
    ('privacy', 'Privacy Policy', 'We value your privacy and safeguard your personal information in compliance with privacy regulations.'),
    ('terms', 'Terms & Conditions', 'By accessing our storefront, you agree to our terms of service and order fulfillment policies.'),
    ('delivery-policy', 'Delivery Policy', 'We offer fast local delivery within 5 miles. Orders are fulfilled within 30-45 minutes.'),
    ('reservation-policy', 'Reservation Policy', 'Table reservations are held for 15 minutes past the scheduled time. Cancellations are free up to 2 hours prior.')
) AS p(slug, title, content)
ON CONFLICT (store_id, slug) DO NOTHING;
