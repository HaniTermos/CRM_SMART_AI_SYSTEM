-- ============================================
-- SmartStore AI Migration 026: Website Studio CMS V3 Architecture
-- ============================================

-- 1. CMS V3 Themes Catalog (Created FIRST to resolve circular references)
CREATE TABLE IF NOT EXISTS public.cms_v3_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL for system default themes
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'restaurant',
  description TEXT,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  typography JSONB NOT NULL DEFAULT '{}'::jsonb,
  global_styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_images JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Indexes for Theme Slug Uniqueness Scoping (System vs Tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_v3_system_theme_slug
  ON public.cms_v3_themes(slug) WHERE store_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_v3_store_theme_slug
  ON public.cms_v3_themes(store_id, slug) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_v3_themes_store ON public.cms_v3_themes(store_id);

-- 2. CMS V3 Sites Configuration (Referencing cms_v3_themes)
CREATE TABLE IF NOT EXISTS public.cms_v3_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  active_theme_id UUID REFERENCES public.cms_v3_themes(id) ON DELETE SET NULL,
  draft_theme_id UUID REFERENCES public.cms_v3_themes(id) ON DELETE SET NULL,
  cms_v3_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Safety default: FALSE for existing stores
  global_tokens JSONB DEFAULT '{}'::jsonb,
  seo_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_sites_store ON public.cms_v3_sites(store_id);

-- 3. CMS V3 Pages
CREATE TABLE IF NOT EXISTS public.cms_v3_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  page_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  published_version_id UUID,
  draft_version_id UUID,
  is_published BOOLEAN DEFAULT FALSE,
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_v3_store_page_slug UNIQUE(store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_v3_pages_store ON public.cms_v3_pages(store_id);

-- 4. CMS V3 Page Versions (Immutable Snapshots & PageNode Trees)
CREATE TABLE IF NOT EXISTS public.cms_v3_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.cms_v3_pages(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft|published|archived
  component_tree JSONB NOT NULL DEFAULT '{}'::jsonb, -- Validated PageDocument schema
  theme_override JSONB DEFAULT '{}'::jsonb,
  change_summary TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_v3_page_version UNIQUE(page_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_v3_page_versions_page ON public.cms_v3_page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_v3_page_versions_store ON public.cms_v3_page_versions(store_id);

-- 5. CMS V3 Reusable Global Symbols (Versioned)
CREATE TABLE IF NOT EXISTS public.cms_v3_global_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  symbol_type VARCHAR(50) NOT NULL DEFAULT 'section', -- header|footer|section|card
  version INT NOT NULL DEFAULT 1,
  node_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_global_symbols_store ON public.cms_v3_global_symbols(store_id);

-- 6. CMS V3 Animation Presets Catalog
CREATE TABLE IF NOT EXISTS public.cms_v3_animation_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL for system presets
  name VARCHAR(100) NOT NULL,
  scope VARCHAR(20) NOT NULL DEFAULT 'store' CHECK (scope IN ('system', 'store')),
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_anim_presets_scope ON public.cms_v3_animation_presets(scope);

-- 7. CMS V3 Media Usage Tracking (Safe Media Deletion Safeguard)
CREATE TABLE IF NOT EXISTS public.cms_v3_media_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.cms_media(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  page_id UUID REFERENCES public.cms_v3_pages(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.cms_v3_page_versions(id) ON DELETE CASCADE,
  node_id VARCHAR(100) NOT NULL,
  field_path VARCHAR(255) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_media_usage_store ON public.cms_v3_media_usage(store_id);
CREATE INDEX IF NOT EXISTS idx_v3_media_usage_media ON public.cms_v3_media_usage(media_id);

-- 8. CMS V3 Navigation Regions
CREATE TABLE IF NOT EXISTS public.cms_v3_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  region VARCHAR(50) NOT NULL DEFAULT 'header', -- header|footer|mobile_drawer
  template_variant VARCHAR(50) DEFAULT 'logo_left_nav_right',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  appearance JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_v3_store_region UNIQUE(store_id, region)
);

CREATE INDEX IF NOT EXISTS idx_v3_navigation_store ON public.cms_v3_navigation(store_id);

-- 9. CMS V3 Forms & Submissions
CREATE TABLE IF NOT EXISTS public.cms_v3_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  form_type VARCHAR(50) NOT NULL DEFAULT 'contact', -- contact|catering|newsletter|appointment|lead
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{
    "recipientMode": "store-owner",
    "crmAction": "create-lead",
    "spamProtection": "honeypot",
    "consentRequired": true,
    "successMessage": "Thank you! We will get back to you shortly."
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cms_v3_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.cms_v3_forms(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(30) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_form_submissions_store ON public.cms_v3_form_submissions(store_id);

-- 10. CMS V3 AI Activity Runs
CREATE TABLE IF NOT EXISTS public.cms_v3_ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_operations JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(30) DEFAULT 'pending_review', -- pending_review|applied|discarded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_ai_runs_store ON public.cms_v3_ai_runs(store_id);

-- 11. Seed System Themes (store_id IS NULL)
INSERT INTO public.cms_v3_themes (store_id, name, slug, category, description, colors, typography, global_styles)
VALUES
  (NULL, 'Minimal Bakery', 'minimal-bakery', 'bakery', 'Editorial cream & warm espresso theme for bakeries & patisseries.',
   '{"background": "#FFFDF9", "surface": "#FFFFFF", "surfaceMuted": "#FDFBF7", "text": "#431407", "textMuted": "#7C2D12", "primary": "#9A3412", "primaryContrast": "#FFFFFF", "accent": "#F59E0B", "border": "#F3E8FF"}'::jsonb,
   '{"headingFont": "Playfair Display", "bodyFont": "DM Sans", "scale": "normal", "headingWeight": 700, "bodyWeight": 400, "lineHeight": 1.6, "letterSpacing": "0em"}'::jsonb,
   '{"buttonRadius": "0.75rem", "cardRadius": "1rem", "sectionPadding": "4rem"}'::jsonb),

  (NULL, 'Modern Café', 'modern-cafe', 'cafe', 'Warm, sleek aesthetic for specialty coffee shops and morning spots.',
   '{"background": "#FAFAFA", "surface": "#FFFFFF", "surfaceMuted": "#F4F4F5", "text": "#0F172A", "textMuted": "#64748B", "primary": "#4F46E5", "primaryContrast": "#FFFFFF", "accent": "#00E0FF", "border": "#E2E8F0"}'::jsonb,
   '{"headingFont": "Outfit", "bodyFont": "Inter", "scale": "normal", "headingWeight": 700, "bodyWeight": 400, "lineHeight": 1.5, "letterSpacing": "-0.01em"}'::jsonb,
   '{"buttonRadius": "1rem", "cardRadius": "1rem", "sectionPadding": "4rem"}'::jsonb),

  (NULL, 'Midnight Bistro', 'midnight-bistro', 'restaurant', 'Dark luxury charcoal theme with elegant gold accents.',
   '{"background": "#121212", "surface": "#1E1E1E", "surfaceMuted": "#2A2A2A", "text": "#F8FAFC", "textMuted": "#94A3B8", "primary": "#D97706", "primaryContrast": "#000000", "accent": "#F59E0B", "border": "#334155"}'::jsonb,
   '{"headingFont": "Playfair Display", "bodyFont": "Inter", "scale": "large", "headingWeight": 600, "bodyWeight": 400, "lineHeight": 1.6, "letterSpacing": "0.02em"}'::jsonb,
   '{"buttonRadius": "0.5rem", "cardRadius": "0.75rem", "sectionPadding": "5rem"}'::jsonb),

  (NULL, 'Mediterranean Table', 'mediterranean-table', 'restaurant', 'Olive, terracotta, sand, and cream story-driven aesthetic.',
   '{"background": "#FEF3C7", "surface": "#FFFBEB", "surfaceMuted": "#FEF08A", "text": "#365314", "textMuted": "#4D7C0F", "primary": "#9A3412", "primaryContrast": "#FFFFFF", "accent": "#65A30D", "border": "#FDE68A"}'::jsonb,
   '{"headingFont": "Lora", "bodyFont": "DM Sans", "scale": "normal", "headingWeight": 700, "bodyWeight": 400, "lineHeight": 1.6, "letterSpacing": "0em"}'::jsonb,
   '{"buttonRadius": "0.75rem", "cardRadius": "1.25rem", "sectionPadding": "4rem"}'::jsonb),

  (NULL, 'Urban Street Food', 'urban-street-food', 'fast_food', 'High contrast, bold typography, fast order grid focus.',
   '{"background": "#09090B", "surface": "#18181B", "surfaceMuted": "#27272A", "text": "#FAFAFA", "textMuted": "#A1A1AA", "primary": "#EAB308", "primaryContrast": "#000000", "accent": "#EF4444", "border": "#3F3F46"}'::jsonb,
   '{"headingFont": "Space Grotesk", "bodyFont": "Inter", "scale": "large", "headingWeight": 800, "bodyWeight": 500, "lineHeight": 1.4, "letterSpacing": "-0.02em"}'::jsonb,
   '{"buttonRadius": "0.25rem", "cardRadius": "0.5rem", "sectionPadding": "3.5rem"}'::jsonb),

  (NULL, 'Coastal Brunch', 'coastal-brunch', 'cafe', 'Light blue, coral, and sand palette for airy daytime spots.',
   '{"background": "#F0F9FF", "surface": "#FFFFFF", "surfaceMuted": "#E0F2FE", "text": "#0C4A6E", "textMuted": "#0369A1", "primary": "#F43F5E", "primaryContrast": "#FFFFFF", "accent": "#38BDF8", "border": "#BAE6FD"}'::jsonb,
   '{"headingFont": "Plus Jakarta Sans", "bodyFont": "Inter", "scale": "normal", "headingWeight": 700, "bodyWeight": 400, "lineHeight": 1.5, "letterSpacing": "0em"}'::jsonb,
   '{"buttonRadius": "1.5rem", "cardRadius": "1.5rem", "sectionPadding": "4.5rem"}'::jsonb),

  (NULL, 'Fine Dining', 'fine-dining', 'restaurant', 'Monochrome pure black/white gold leaf system with spacious layouts.',
   '{"background": "#000000", "surface": "#09090B", "surfaceMuted": "#141417", "text": "#FFFFFF", "textMuted": "#71717A", "primary": "#CA8A04", "primaryContrast": "#000000", "accent": "#EAB308", "border": "#27272A"}'::jsonb,
   '{"headingFont": "Cinzel", "bodyFont": "Plus Jakarta Sans", "scale": "compact", "headingWeight": 600, "bodyWeight": 300, "lineHeight": 1.7, "letterSpacing": "0.05em"}'::jsonb,
   '{"buttonRadius": "0rem", "cardRadius": "0.25rem", "sectionPadding": "6rem"}'::jsonb),

  (NULL, 'Coffee Roastery', 'coffee-roastery', 'roastery', 'Copper, espresso, and warm roasted bean story split layout.',
   '{"background": "#120E0C", "surface": "#1C1714", "surfaceMuted": "#271E18", "text": "#F3F4F6", "textMuted": "#9CA3AF", "primary": "#B45309", "primaryContrast": "#FFFFFF", "accent": "#F59E0B", "border": "#372A22"}'::jsonb,
   '{"headingFont": "Space Grotesk", "bodyFont": "DM Sans", "scale": "normal", "headingWeight": 700, "bodyWeight": 400, "lineHeight": 1.6, "letterSpacing": "0em"}'::jsonb,
   '{"buttonRadius": "0.5rem", "cardRadius": "0.75rem", "sectionPadding": "4rem"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 12. Seed System Animation Presets (store_id IS NULL)
INSERT INTO public.cms_v3_animation_presets (store_id, name, scope, definition)
VALUES
  (NULL, 'Fade In', 'system', '{"type": "fade-in", "durationMs": 500, "delayMs": 0, "easing": "ease-out"}'::jsonb),
  (NULL, 'Slide Up', 'system', '{"type": "slide-up", "durationMs": 600, "delayMs": 0, "easing": "cubic-bezier(0.16, 1, 0.3, 1)"}'::jsonb),
  (NULL, 'Slide Down', 'system', '{"type": "slide-down", "durationMs": 600, "delayMs": 0, "easing": "cubic-bezier(0.16, 1, 0.3, 1)"}'::jsonb),
  (NULL, 'Slide Left', 'system', '{"type": "slide-left", "durationMs": 600, "delayMs": 0, "easing": "cubic-bezier(0.16, 1, 0.3, 1)"}'::jsonb),
  (NULL, 'Slide Right', 'system', '{"type": "slide-right", "durationMs": 600, "delayMs": 0, "easing": "cubic-bezier(0.16, 1, 0.3, 1)"}'::jsonb),
  (NULL, 'Zoom In', 'system', '{"type": "zoom-in", "durationMs": 500, "delayMs": 0, "easing": "ease-out"}'::jsonb),
  (NULL, 'Blur In', 'system', '{"type": "blur-in", "durationMs": 700, "delayMs": 0, "easing": "ease-out"}'::jsonb),
  (NULL, 'Hover Lift', 'system', '{"type": "hover-lift", "translateYPx": -4, "shadowStep": "lg", "durationMs": 200}'::jsonb),
  (NULL, 'Hover Scale', 'system', '{"type": "hover-scale", "scale": 1.05, "durationMs": 200}'::jsonb)
ON CONFLICT DO NOTHING;
