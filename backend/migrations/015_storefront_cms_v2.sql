-- ============================================
-- SmartStore AI Migration 015: Storefront CMS & Modular Section Builder V2
-- ============================================

-- 1. Drop restricted slug check on cms_pages to allow 'home', 'menu', and custom slugs
ALTER TABLE public.cms_pages DROP CONSTRAINT IF EXISTS cms_pages_slug_check;

-- 2. Extend cms_pages table
ALTER TABLE public.cms_pages 
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS is_system_page BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_navigation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS navigation_label VARCHAR(100),
  ADD COLUMN IF NOT EXISTS social_image_url TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS draft_version_id UUID,
  ADD COLUMN IF NOT EXISTS published_version_id UUID;

-- 3. Create cms_page_sections table
CREATE TABLE IF NOT EXISTS public.cms_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  visibility VARCHAR(20) DEFAULT 'all' CHECK (visibility IN ('all', 'desktop', 'tablet', 'mobile')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout JSONB NOT NULL DEFAULT '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium", "align": "center"}'::jsonb,
  appearance JSONB NOT NULL DEFAULT '{"preset": "solid", "background_color": "#ffffff", "text_color": "#0F172A", "accent_color": "#190E85", "border_radius": "0.75rem"}'::jsonb,
  background JSONB NOT NULL DEFAULT '{"type": "solid", "image_url": "", "overlay_opacity": 0}'::jsonb,
  responsive JSONB NOT NULL DEFAULT '{"stack_on_mobile": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_page_sections_page ON public.cms_page_sections(page_id, position);
CREATE INDEX IF NOT EXISTS idx_cms_page_sections_store ON public.cms_page_sections(store_id);

-- 4. Create cms_page_versions table
CREATE TABLE IF NOT EXISTS public.cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  sections_snapshot JSONB NOT NULL,
  page_metadata_snapshot JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page ON public.cms_page_versions(page_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_store ON public.cms_page_versions(store_id);

-- 5. Create cms_navigation_items table
CREATE TABLE IF NOT EXISTS public.cms_navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  location VARCHAR(20) NOT NULL CHECK (location IN ('header', 'footer', 'mobile')),
  label VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  page_id UUID REFERENCES public.cms_pages(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_external BOOLEAN DEFAULT false,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_nav_store_loc ON public.cms_navigation_items(store_id, location, position);

-- 6. Create cms_contact_messages table
CREATE TABLE IF NOT EXISTS public.cms_contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  topic VARCHAR(100),
  message TEXT NOT NULL,
  preferred_response_method VARCHAR(50) DEFAULT 'email',
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_contact_store ON public.cms_contact_messages(store_id, status);

-- 7. Create cms_preview_tokens table
CREATE TABLE IF NOT EXISTS public.cms_preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_preview_token ON public.cms_preview_tokens(token, expires_at);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS cms_page_sections_set_updated_at ON public.cms_page_sections;
CREATE TRIGGER cms_page_sections_set_updated_at BEFORE UPDATE ON public.cms_page_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cms_navigation_items_set_updated_at ON public.cms_navigation_items;
CREATE TRIGGER cms_navigation_items_set_updated_at BEFORE UPDATE ON public.cms_navigation_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Update system pages metadata
UPDATE public.cms_pages 
SET is_system_page = true,
    type = slug,
    show_in_navigation = true,
    navigation_label = title
WHERE slug IN ('about', 'contact', 'faq', 'privacy', 'terms', 'delivery-policy', 'reservation-policy');

-- 9. Data Migration: Create system 'home' page for all stores
INSERT INTO public.cms_pages (store_id, slug, title, type, is_system_page, show_in_navigation, navigation_label, status, published_at)
SELECT id, 'home', 'Home', 'home', true, true, 'Home', 'published', NOW()
FROM public.stores
ON CONFLICT (store_id, slug) DO NOTHING;

-- Create default sections for home page for stores lacking sections
INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content, appearance, background)
SELECT 
  p.store_id, p.id, 'hero', 0,
  jsonb_build_object(
    'eyebrow', 'Crafted Daily With Care',
    'title', COALESCE(cs.homepage_published->>'hero_title', cs.homepage_draft->>'hero_title', 'Welcome to Our Storefront'),
    'subtitle', COALESCE(cs.homepage_published->>'hero_subtitle', cs.homepage_draft->>'hero_subtitle', 'Fresh artisanal culinary offerings and specialty coffee.'),
    'image_url', COALESCE(cs.homepage_published->>'hero_image', cs.homepage_draft->>'hero_image', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop'),
    'cta_primary_text', 'Explore Menu',
    'cta_primary_link', '/shop/' || s.slug,
    'cta_secondary_text', 'Special Offers',
    'cta_secondary_link', '/shop/' || s.slug || '/deals'
  ),
  jsonb_build_object('preset', 'solid', 'background_color', '#190E85', 'text_color', '#FFFFFF', 'accent_color', '#00E0FF'),
  jsonb_build_object('type', 'image', 'image_url', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop', 'overlay_opacity', 40)
FROM public.cms_pages p
JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.cms_settings cs ON cs.store_id = s.id
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'hero');

INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'featured_menu', 1, jsonb_build_object('title', 'Featured Items', 'subtitle', 'Our most loved creations', 'limit', 6, 'show_category_filter', true)
FROM public.cms_pages p
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'featured_menu');

INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'about', 2, jsonb_build_object('title', 'Crafted With Passion', 'description', 'We source the finest organic ingredients to prepare incredible food and drinks for our community.', 'image_url', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop')
FROM public.cms_pages p
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'about');

INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'gallery', 3, jsonb_build_object('title', 'Store Highlights', 'images', jsonb_build_array('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop'))
FROM public.cms_pages p
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'gallery');

INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'testimonials', 4, jsonb_build_object('title', 'What Our Customers Say', 'items', jsonb_build_array(jsonb_build_object('name', 'Jessica R.', 'comment', 'Outstanding food, great ambiance, and fast delivery!', 'rating', 5)))
FROM public.cms_pages p
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'testimonials');

INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'faq', 5, jsonb_build_object('title', 'Frequently Asked Questions', 'items', jsonb_build_array(jsonb_build_object('question', 'What are your store hours?', 'answer', 'We are open 7 days a week from 8:00 AM to 10:00 PM.')))
FROM public.cms_pages p
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'faq');

INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'contact_form', 6, jsonb_build_object('title', 'Get in Touch', 'phone', '+1 (555) 234-5678', 'email', 'hello@smartstore.ai', 'address', '123 Gourmet Ave, Culinary District')
FROM public.cms_pages p
WHERE p.slug = 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id AND type = 'contact_form');

-- Create rich_text sections for static policy pages lacking sections
INSERT INTO public.cms_page_sections (store_id, page_id, type, position, content)
SELECT p.store_id, p.id, 'rich_text', 0, jsonb_build_object('title', p.title, 'body', COALESCE(p.content_published, p.content_draft, ''))
FROM public.cms_pages p
WHERE p.slug != 'home' AND NOT EXISTS (SELECT 1 FROM public.cms_page_sections WHERE page_id = p.id);

-- Populate default header navigation items
INSERT INTO public.cms_navigation_items (store_id, location, label, url, position)
SELECT s.id, 'header', n.label, '/shop/' || s.slug || n.path, n.pos
FROM public.stores s
CROSS JOIN (
  VALUES 
    ('Home', '', 0),
    ('Menu', '', 1),
    ('Deals', '/deals', 2),
    ('About', '/pages/about', 3),
    ('Contact', '/pages/contact', 4),
    ('FAQ', '/pages/faq', 5)
) AS n(label, path, pos)
WHERE NOT EXISTS (SELECT 1 FROM public.cms_navigation_items WHERE store_id = s.id AND location = 'header');

-- Populate default footer navigation items
INSERT INTO public.cms_navigation_items (store_id, location, label, url, position)
SELECT s.id, 'footer', n.label, '/shop/' || s.slug || n.path, n.pos
FROM public.stores s
CROSS JOIN (
  VALUES 
    ('Privacy Policy', '/pages/privacy', 0),
    ('Terms of Service', '/pages/terms', 1),
    ('Delivery Policy', '/pages/delivery-policy', 2),
    ('Reservation Policy', '/pages/reservation-policy', 3)
) AS n(label, path, pos)
WHERE NOT EXISTS (SELECT 1 FROM public.cms_navigation_items WHERE store_id = s.id AND location = 'footer');
