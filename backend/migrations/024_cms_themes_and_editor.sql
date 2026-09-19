-- ============================================
-- SmartStore AI Migration 024: CMS Themes, Section Variants & Dashboard Layouts
-- ============================================

-- 1. CMS Theme Template Catalog (Option A: Upgrade existing V1 table safely)
CREATE TABLE IF NOT EXISTS public.cms_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  colors JSONB NOT NULL DEFAULT '{}',
  fonts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cms_themes 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS best_for JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conversion_goal VARCHAR(50) DEFAULT 'online_orders',
  ADD COLUMN IF NOT EXISTS typography JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS global_styles JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS page_templates JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_templates JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS responsive_settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preview_images JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- 2. Section Variants Registry Catalog
CREATE TABLE IF NOT EXISTS public.cms_section_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type VARCHAR(50) NOT NULL, -- hero|featured_menu|about|gallery|testimonials|faq|contact_form|cta|rich_text|divider|map|opening_hours|social_links
  variant_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_image VARCHAR(255),
  default_content JSONB NOT NULL DEFAULT '{}',
  default_layout JSONB NOT NULL DEFAULT '{}',
  default_appearance JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_type_variant UNIQUE(section_type, variant_name)
);

-- 3. Store Active & Draft Theme Versions
CREATE TABLE IF NOT EXISTS public.cms_theme_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.cms_themes(id) ON DELETE SET NULL,
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|in_review|published|archived|rolled_back
  settings_snapshot JSONB NOT NULL DEFAULT '{}',
  page_mappings JSONB NOT NULL DEFAULT '{}',
  section_mappings JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_theme_version UNIQUE(store_id, version)
);

-- 4. Store Theme Assignments (Enforces Max 1 Published Theme per Store)
CREATE TABLE IF NOT EXISTS public.cms_store_theme_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  published_theme_version_id UUID REFERENCES public.cms_theme_versions(id) ON DELETE SET NULL,
  draft_theme_version_id UUID REFERENCES public.cms_theme_versions(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_assignment UNIQUE(store_id)
);

-- Unique index ensuring max 1 published version per store
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_published_theme_per_store 
  ON public.cms_theme_versions(store_id) WHERE status = 'published';

-- 5. CMS Section Overrides & Variants
ALTER TABLE public.cms_page_sections 
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100) DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS element_overrides JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_override_active BOOLEAN DEFAULT FALSE;

-- 6. User Dashboard Layout Persistence
CREATE TABLE IF NOT EXISTS public.user_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  mode VARCHAR(30) NOT NULL DEFAULT 'today', -- today|growth|planning|custom
  layout_config JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_user_store_mode UNIQUE(user_id, store_id, mode)
);

-- 7. Seed 25+ Category Theme Presets (Safe ON CONFLICT DO UPDATE preserving IDs)
INSERT INTO public.cms_themes (name, slug, category, description, best_for, conversion_goal, is_default, colors, typography, global_styles)
VALUES
  ('Modern Café', 'modern-cafe', 'cafe', 'Sleek, warm aesthetic for specialty coffee shops and morning spots.', '["Coffee shops", "Brunch spots", "Artisan bakeries"]'::jsonb, 'pickup', true,
   '{"primary": "#190E85", "accent": "#00E0FF", "background": "#FAFAFA", "text": "#0F172A"}'::jsonb, '{"font_family": "Inter", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Cozy Coffee House', 'cozy-coffee-house', 'cafe', 'Warm amber and wooden tones for neighborhood coffee houses.', '["Coffee houses", "Espresso bars"]'::jsonb, 'repeat_visits', false,
   '{"primary": "#78350F", "accent": "#F59E0B", "background": "#FFFBEB", "text": "#451A03"}'::jsonb, '{"font_family": "DM Sans", "heading_font": "Playfair Display"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb),

  ('Minimal Coffee Bar', 'minimal-coffee-bar', 'cafe', 'Clean, high-contrast monochrome design for espresso bars.', '["Espresso bars", "Roasteries"]'::jsonb, 'online_orders', false,
   '{"primary": "#18181B", "accent": "#6366F1", "background": "#FFFFFF", "text": "#09090B"}'::jsonb, '{"font_family": "Inter", "heading_font": "Inter"}'::jsonb, '{"border_radius": "0.5rem"}'::jsonb),

  ('Specialty Roastery', 'specialty-roastery', 'cafe', 'Industrial dark coffee aesthetic focusing on bean origins.', '["Roasteries", "Bean shops"]'::jsonb, 'online_orders', false,
   '{"primary": "#271E18", "accent": "#D97706", "background": "#120E0C", "text": "#F3F4F6"}'::jsonb, '{"font_family": "Space Grotesk", "heading_font": "Space Grotesk"}'::jsonb, '{"border_radius": "0.5rem"}'::jsonb),

  ('Brunch Café', 'brunch-cafe', 'cafe', 'Vibrant, sunny design for daytime brunch locations.', '["Brunch cafes", "Breakfast spots"]'::jsonb, 'reservations', false,
   '{"primary": "#047857", "accent": "#FBBF24", "background": "#ECFDF5", "text": "#064E3B"}'::jsonb, '{"font_family": "Plus Jakarta Sans", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1.25rem"}'::jsonb),

  ('Neighborhood Café', 'neighborhood-cafe', 'cafe', 'Friendly, community-first café layout.', '["Local cafes", "Tea rooms"]'::jsonb, 'repeat_visits', false,
   '{"primary": "#1E40AF", "accent": "#38BDF8", "background": "#F0F9FF", "text": "#0C4A6E"}'::jsonb, '{"font_family": "Inter", "heading_font": "Inter"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Minimal Bakery', 'minimal-bakery', 'bakery', 'Elegant editorial design showcasing daily fresh bread and pastries.', '["Artisan bakeries", "French patisseries"]'::jsonb, 'pickup', false,
   '{"primary": "#9A3412", "accent": "#F59E0B", "background": "#FFFBB7", "text": "#431407"}'::jsonb, '{"font_family": "DM Sans", "heading_font": "Playfair Display"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb),

  ('French Patisserie', 'french-patisserie', 'bakery', 'Refined, luxurious pastry house theme with pastel accents.', '["Patisseries", "Cake boutiques"]'::jsonb, 'online_orders', false,
   '{"primary": "#831843", "accent": "#F472B6", "background": "#FDF2F8", "text": "#500724"}'::jsonb, '{"font_family": "Plus Jakarta Sans", "heading_font": "Cinzel"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Artisan Bread House', 'artisan-bread-house', 'bakery', 'Rustic, earthy bakery template centered on sourdough and grain.', '["Sourdough bakeries", "Flour mills"]'::jsonb, 'pickup', false,
   '{"primary": "#7C2D12", "accent": "#EAB308", "background": "#FEFCE8", "text": "#451A03"}'::jsonb, '{"font_family": "Inter", "heading_font": "Lora"}'::jsonb, '{"border_radius": "0.5rem"}'::jsonb),

  ('Dessert Boutique', 'dessert-boutique', 'bakery', 'Chic dessert studio design with high-end photography focus.', '["Dessert shops", "Chocolatiers"]'::jsonb, 'brand_awareness', false,
   '{"primary": "#4C1D95", "accent": "#EC4899", "background": "#FAF5FF", "text": "#2E1065"}'::jsonb, '{"font_family": "Outfit", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Modern Pastry Studio', 'modern-pastry-studio', 'bakery', 'Contemporary pastry lab theme for creative dessert chefs.', '["Pastry studios", "Custom cake labs"]'::jsonb, 'pickup', false,
   '{"primary": "#0F766E", "accent": "#2DD4BF", "background": "#F0FDFA", "text": "#115E59"}'::jsonb, '{"font_family": "Inter", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb),

  ('Modern Restaurant', 'modern-restaurant', 'restaurant', 'Dynamic full-service dining theme with menu & reservations.', '["Bistros", "Full-service dining"]'::jsonb, 'reservations', false,
   '{"primary": "#0F172A", "accent": "#38BDF8", "background": "#FFFFFF", "text": "#0F172A"}'::jsonb, '{"font_family": "Inter", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Mediterranean Table', 'mediterranean-table', 'restaurant', 'Sun-drenched coastal tones for Mediterranean and Italian dining.', '["Mediterranean dining", "Trattorias"]'::jsonb, 'reservations', false,
   '{"primary": "#0369A1", "accent": "#F97316", "background": "#F0F9FF", "text": "#0C4A6E"}'::jsonb, '{"font_family": "DM Sans", "heading_font": "Playfair Display"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb),

  ('Contemporary Dining', 'contemporary-dining', 'restaurant', 'Sophisticated modern layout for casual fine dining.', '["Modern bistros", "Wine bars"]'::jsonb, 'reservations', false,
   '{"primary": "#1C1917", "accent": "#A855F7", "background": "#FAFAFA", "text": "#1C1917"}'::jsonb, '{"font_family": "Inter", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "0.5rem"}'::jsonb),

  ('Family Restaurant', 'family-restaurant', 'restaurant', 'Warm, accessible layout highlighting family combos & kids menu.', '["Family diners", "Pizzerias"]'::jsonb, 'online_orders', false,
   '{"primary": "#B91C1C", "accent": "#FBBF24", "background": "#FEF2F2", "text": "#7F1D1D"}'::jsonb, '{"font_family": "Inter", "heading_font": "Inter"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Chefs Kitchen', 'chefs-kitchen', 'restaurant', 'Culinary showcase layout centered around chef stories & seasonal menus.', '["Chef tables", "Farm to table"]'::jsonb, 'reservations', false,
   '{"primary": "#14532D", "accent": "#84CC16", "background": "#F0FDF4", "text": "#052E16"}'::jsonb, '{"font_family": "Lora", "heading_font": "Lora"}'::jsonb, '{"border_radius": "0.5rem"}'::jsonb),

  ('Midnight Bistro', 'midnight-bistro', 'fine_dining', 'Dark luxury aesthetic with gold accents for evening fine dining.', '["Fine dining", "Steak houses", "Cocktail lounges"]'::jsonb, 'reservations', false,
   '{"primary": "#D97706", "accent": "#F59E0B", "background": "#09090B", "text": "#F4F4F5"}'::jsonb, '{"font_family": "Cinzel", "heading_font": "Cinzel"}'::jsonb, '{"border_radius": "0.5rem"}'::jsonb),

  ('Fine Dining', 'fine-dining-classic', 'fine_dining', 'Ultra-refined minimalist luxury with classic serif typography.', '["Michelin guide dining", "Luxury venues"]'::jsonb, 'reservations', false,
   '{"primary": "#18181B", "accent": "#EAB308", "background": "#000000", "text": "#FAFAFA"}'::jsonb, '{"font_family": "Playfair Display", "heading_font": "Playfair Display"}'::jsonb, '{"border_radius": "0.25rem"}'::jsonb),

  ('Urban Street Food', 'urban-street-food', 'fast_food', 'High-energy, high-contrast mobile-first ordering template.', '["Burger joints", "Taco bars", "Street food"]'::jsonb, 'online_orders', false,
   '{"primary": "#DC2626", "accent": "#FACC15", "background": "#0F172A", "text": "#F8FAFC"}'::jsonb, '{"font_family": "Space Grotesk", "heading_font": "Space Grotesk"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Quick Order', 'quick-order', 'fast_food', 'Fast-loading, delivery-first ordering page for quick service spots.', '["Quick service", "Takeout spots"]'::jsonb, 'delivery', false,
   '{"primary": "#2563EB", "accent": "#22C55E", "background": "#FFFFFF", "text": "#1E293B"}'::jsonb, '{"font_family": "Inter", "heading_font": "Inter"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb),

  ('Street Food Truck', 'street-food-truck', 'food_truck', 'Location-first mobile theme showing today location & popup schedule.', '["Food trucks", "Pop-up vendors"]'::jsonb, 'brand_awareness', false,
   '{"primary": "#EA580C", "accent": "#FACC15", "background": "#18181B", "text": "#FAFAFA"}'::jsonb, '{"font_family": "Outfit", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1rem"}'::jsonb),

  ('Premium Catering', 'premium-catering', 'catering', 'Lead generation layout for wedding, corporate, and event catering.', '["Catering services", "Event planners"]'::jsonb, 'catering_leads', false,
   '{"primary": "#1E1B4B", "accent": "#818CF8", "background": "#EEF2FF", "text": "#1E1B4B"}'::jsonb, '{"font_family": "Plus Jakarta Sans", "heading_font": "Playfair Display"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb),

  ('Fresh & Green', 'fresh-and-green', 'healthy_food', 'Bright organic theme for juice bars, salad spots, and health kitchens.', '["Juice bars", "Salad bars", "Poke spots"]'::jsonb, 'online_orders', false,
   '{"primary": "#15803D", "accent": "#A3E635", "background": "#F7FEE7", "text": "#14532D"}'::jsonb, '{"font_family": "Outfit", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1.25rem"}'::jsonb),

  ('Ice Cream Lab', 'ice-cream-lab', 'dessert', 'Playful colorful theme for ice cream parlors and gelato shops.', '["Ice cream shops", "Gelaterias"]'::jsonb, 'pickup', false,
   '{"primary": "#DB2777", "accent": "#38BDF8", "background": "#FDF2F8", "text": "#831843"}'::jsonb, '{"font_family": "Plus Jakarta Sans", "heading_font": "Outfit"}'::jsonb, '{"border_radius": "1.5rem"}'::jsonb),

  ('Delivery Kitchen', 'delivery-kitchen', 'cloud_kitchen', 'Streamlined cloud-kitchen layout optimized for fast delivery conversion.', '["Ghost kitchens", "Delivery brands"]'::jsonb, 'delivery', false,
   '{"primary": "#7C3AED", "accent": "#06B6D4", "background": "#0F172A", "text": "#F8FAFC"}'::jsonb, '{"font_family": "Inter", "heading_font": "Space Grotesk"}'::jsonb, '{"border_radius": "0.75rem"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  colors = EXCLUDED.colors,
  typography = EXCLUDED.typography;

-- 8. Seed Section Variants Catalog
INSERT INTO public.cms_section_variants (section_type, variant_name, display_name, description, default_layout)
VALUES
  ('hero', 'default', 'Classic Banner', 'Full width banner with CTA buttons', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('hero', 'split_left', 'Split Image Left', 'Image on the left, copy & CTA on the right', '{"width": "contained", "padding_top": "large", "padding_bottom": "large"}'::jsonb),
  ('hero', 'split_right', 'Split Image Right', 'Copy & CTA on the left, image on the right', '{"width": "contained", "padding_top": "large", "padding_bottom": "large"}'::jsonb),
  ('hero', 'fullscreen', 'Full-Screen Editorial', 'Immersive full height background image hero', '{"width": "full", "padding_top": "none", "padding_bottom": "none"}'::jsonb),
  ('featured_menu', 'default', 'Grid Layout', 'Standard grid of featured items', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('featured_menu', 'carousel', 'Product Carousel', 'Horizontal scrollable menu cards', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('about', 'default', 'Story Grid', 'Text on one side, brand image on the other', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('about', 'editorial', 'Editorial Text', 'Centered longform story layout', '{"width": "contained", "padding_top": "large", "padding_bottom": "large"}'::jsonb),
  ('gallery', 'default', 'Grid Gallery', 'Clean grid of photos', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('gallery', 'masonry', 'Masonry Layout', 'Dynamic height photo tiles', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('testimonials', 'default', 'Review Cards', 'Grid of customer reviews with star ratings', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('faq', 'default', 'Accordion', 'Expandable question accordion', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb),
  ('contact_form', 'default', 'Split Form & Info', 'Contact form on right, store info on left', '{"width": "contained", "padding_top": "medium", "padding_bottom": "medium"}'::jsonb)
ON CONFLICT (section_type, variant_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;
