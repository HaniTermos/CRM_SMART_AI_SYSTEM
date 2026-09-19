-- CMS Themes: ready-made theme presets and per-store theme assignment

CREATE TABLE IF NOT EXISTS cms_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  colors JSONB NOT NULL DEFAULT '{}',
  fonts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cms_settings
  ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES cms_themes(id) ON DELETE SET NULL;

-- Seed default themes
INSERT INTO cms_themes (name, slug, description, is_default, colors, fonts)
VALUES
  ('Classic', 'classic', 'Bold primary blue with a bright cyan accent.', true,
   '{"primary_color": "#190E85", "accent_color": "#00E0FF", "background_color": "#ffffff", "text_color": "#0F172A"}'::jsonb,
   '{"font_family": "Inter"}'::jsonb),
  ('Warm', 'warm', 'Earthy orange and amber tones for a cozy feel.', false,
   '{"primary_color": "#C2410C", "accent_color": "#F59E0B", "background_color": "#FFF7ED", "text_color": "#431407"}'::jsonb,
   '{"font_family": "Outfit"}'::jsonb),
  ('Minimal', 'minimal', 'Clean grayscale with a soft indigo accent.', false,
   '{"primary_color": "#111827", "accent_color": "#6366F1", "background_color": "#F9FAFB", "text_color": "#111827"}'::jsonb,
   '{"font_family": "DM Sans"}'::jsonb),
  ('Dark', 'dark', 'Deep violet and cyan for a modern dark mode.', false,
   '{"primary_color": "#8B5CF6", "accent_color": "#22D3EE", "background_color": "#0F172A", "text_color": "#F8FAFC"}'::jsonb,
   '{"font_family": "Poppins"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  colors = EXCLUDED.colors,
  fonts = EXCLUDED.fonts,
  updated_at = NOW();

-- Ensure exactly one default theme
UPDATE cms_themes SET is_default = false WHERE slug != 'classic';
UPDATE cms_themes SET is_default = true WHERE slug = 'classic' AND NOT EXISTS (
  SELECT 1 FROM cms_themes WHERE is_default = true
);

-- Backfill existing stores to the default theme if they have none
UPDATE cms_settings
SET theme_id = (SELECT id FROM cms_themes WHERE is_default = true LIMIT 1)
WHERE theme_id IS NULL;
