-- ============================================
-- SmartStore AI Migration 027: CMS V3 Page Templates & Section Library
-- ============================================

-- 1. CMS V3 Page Templates Catalog
CREATE TABLE IF NOT EXISTS public.cms_v3_page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL for system templates
  theme_slug VARCHAR(100) DEFAULT 'modern-cafe',
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'restaurant', -- bakery|cafe|restaurant|bistro|retail|landing
  description TEXT,
  thumbnail_url TEXT,
  component_tree JSONB NOT NULL DEFAULT '{}'::jsonb, -- Validated PageDocument AST
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Indexes for Template Slug Uniqueness Scoping
CREATE UNIQUE INDEX IF NOT EXISTS uq_v3_system_template_slug
  ON public.cms_v3_page_templates(slug) WHERE store_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_v3_store_template_slug
  ON public.cms_v3_page_templates(store_id, slug) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_v3_page_templates_store ON public.cms_v3_page_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_v3_page_templates_cat ON public.cms_v3_page_templates(category);

-- 2. CMS V3 Section Templates Catalog
CREATE TABLE IF NOT EXISTS public.cms_v3_section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- hero|menu|about|testimonials|forms|cta
  variant_name VARCHAR(100) NOT NULL DEFAULT 'default',
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  thumbnail_url TEXT,
  demo_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  node_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_v3_system_section_template_slug
  ON public.cms_v3_section_templates(slug) WHERE store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_v3_section_templates_store ON public.cms_v3_section_templates(store_id);

-- ============================================
-- 3. Idempotent Seeding of 8 System Page Templates
-- ============================================

INSERT INTO public.cms_v3_page_templates (
  store_id, theme_slug, name, slug, category, description, thumbnail_url, is_system, component_tree
)
VALUES
(
  NULL,
  'minimal-bakery',
  'Artisanal Bakery & Pastry Shop',
  'bakery-artisan-starter',
  'bakery',
  'Warm, rustic storefront featuring hero bread showcase, daily baked menu grid, storytelling section, and customer reviews.',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  TRUE,
  '{
    "versionNumber": 1,
    "rootNodeId": "root",
    "nodes": {
      "root": {
        "id": "root",
        "kind": "page",
        "component": "page",
        "children": ["sec-hero", "sec-menu", "sec-story", "sec-testimonials", "sec-contact"],
        "props": { "title": "Artisanal Bakery Home" },
        "styles": { "base": { "background": "var(--color-background)" } }
      },
      "sec-hero": {
        "id": "sec-hero",
        "kind": "section",
        "component": "hero",
        "variant": "split",
        "children": [],
        "props": {
          "eyebrow": "Baked Fresh Every Morning",
          "title": "Traditional Sourdough & French Pastries",
          "subtitle": "Naturally leavened organic breads, buttery viennoiserie, and specialty roast coffee crafted in downtown.",
          "primaryCtaText": "View Today''s Bakes",
          "primaryCtaLink": "/menu",
          "secondaryCtaText": "Order Pick-up",
          "secondaryCtaLink": "/menu",
          "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80"
        },
        "styles": { "base": { "minHeight": "75vh" } }
      },
      "sec-menu": {
        "id": "sec-menu",
        "kind": "section",
        "component": "product-grid",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Signature Loaves & Pastries",
          "subtitle": "Hand-crafted using stoneground heritage flours and fermented for 36 hours.",
          "columns": 3
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-story": {
        "id": "sec-story",
        "kind": "section",
        "component": "story-about",
        "variant": "default",
        "children": [],
        "props": {
          "eyebrow": "Our Tradition",
          "title": "Slow Fermentation & Honest Ingredients",
          "story": "Founded in 2018, our bakery honors classic European baking methods. Every loaf is shaped by hand and baked in our stone-hearth oven at dawn.",
          "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80"
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-testimonials": {
        "id": "sec-testimonials",
        "kind": "section",
        "component": "testimonials",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Loved by Neighborhood Foodies",
          "reviews": [
            { "author": "Elena Rostova", "text": "The country sourdough crust has the perfect crunch and open crumb. Best bakery in the city!", "rating": 5 },
            { "author": "Marcus Vance", "text": "Their almond croissants and pour-overs are my daily morning ritual.", "rating": 5 }
          ]
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-contact": {
        "id": "sec-contact",
        "kind": "section",
        "component": "contact-form",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Catering & Special Orders",
          "subtitle": "Need fresh bread or custom pastry platters for your event? Reach out to our bakers."
        },
        "styles": { "base": { "paddingY": "4rem" } }
      }
    }
  }'::jsonb
),
(
  NULL,
  'modern-cafe',
  'Modern Espresso & Specialty Café',
  'cafe-specialty-starter',
  'cafe',
  'Sleek, urban espresso bar template with drink catalog, pour-over station showcase, hours, and reservation booking.',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
  TRUE,
  '{
    "versionNumber": 1,
    "rootNodeId": "root",
    "nodes": {
      "root": {
        "id": "root",
        "kind": "page",
        "component": "page",
        "children": ["sec-hero-cafe", "sec-menu-cafe", "sec-reserve-cafe", "sec-faq-cafe"],
        "props": { "title": "Modern Espresso Café" },
        "styles": { "base": { "background": "var(--color-background)" } }
      },
      "sec-hero-cafe": {
        "id": "sec-hero-cafe",
        "kind": "section",
        "component": "hero",
        "variant": "split",
        "children": [],
        "props": {
          "eyebrow": "Single-Origin Roasts & Micro-Lots",
          "title": "Precision Espresso & Scandinavian Design",
          "subtitle": "Ethically sourced beans, handcrafted pour-overs, and a calm space to work and connect.",
          "primaryCtaText": "Order Drinks",
          "primaryCtaLink": "/menu",
          "secondaryCtaText": "Reserve Table",
          "secondaryCtaLink": "/reservations",
          "imageUrl": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80"
        },
        "styles": { "base": { "minHeight": "75vh" } }
      },
      "sec-menu-cafe": {
        "id": "sec-menu-cafe",
        "kind": "section",
        "component": "product-grid",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Seasonal Brews & Light Fare",
          "subtitle": "Espresso blends, single origin pour-overs, oat lattes, and artisan toasts.",
          "columns": 3
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-reserve-cafe": {
        "id": "sec-reserve-cafe",
        "kind": "section",
        "component": "reservation-widget",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Book a Table or Meeting Corner",
          "subtitle": "Reserve seating for group discussions or quiet work sessions."
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-faq-cafe": {
        "id": "sec-faq-cafe",
        "kind": "section",
        "component": "faq-accordion",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Frequently Asked Questions",
          "items": [
            { "question": "Do you offer oat and almond milk alternatives?", "answer": "Yes, we steam Minor Figures Oat and organic Almond milk at no extra charge." },
            { "question": "Is high-speed WiFi available for remote work?", "answer": "Yes, fiber 500Mbps WiFi is available for all seated customers." },
            { "question": "Can I buy whole-bean bags in-store?", "answer": "Yes! All seasonal single-origin and espresso bags are roasted weekly and available on the shelf." }
          ]
        },
        "styles": { "base": { "paddingY": "4rem" } }
      }
    }
  }'::jsonb
),
(
  NULL,
  'midnight-bistro',
  'Midnight Bistro & Wine Bar',
  'midnight-bistro-starter',
  'bistro',
  'Moody dark-themed dinner restaurant layout with wine pairings, chef seasonal specials, and floor reservations.',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
  TRUE,
  '{
    "versionNumber": 1,
    "rootNodeId": "root",
    "nodes": {
      "root": {
        "id": "root",
        "kind": "page",
        "component": "page",
        "children": ["sec-hero-bistro", "sec-menu-bistro", "sec-reserve-bistro", "sec-testimonials-bistro"],
        "props": { "title": "Midnight Bistro & Wine Bar" },
        "styles": { "base": { "background": "var(--color-background)" } }
      },
      "sec-hero-bistro": {
        "id": "sec-hero-bistro",
        "kind": "section",
        "component": "hero",
        "variant": "split",
        "children": [],
        "props": {
          "eyebrow": "Fine Dining & Natural Wines",
          "title": "Intimate Dinners, Craft Cocktails & Seasonal Plates",
          "subtitle": "Contemporary European cuisine paired with low-intervention organic wines.",
          "primaryCtaText": "Reserve a Table",
          "primaryCtaLink": "/reservations",
          "secondaryCtaText": "Explore Dinner Menu",
          "secondaryCtaLink": "/menu",
          "imageUrl": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80"
        },
        "styles": { "base": { "minHeight": "80vh" } }
      },
      "sec-menu-bistro": {
        "id": "sec-menu-bistro",
        "kind": "section",
        "component": "product-grid",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Tonight''s Chef Tasting Menu",
          "subtitle": "Locally harvested ingredients prepared over open oak embers.",
          "columns": 3
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-reserve-bistro": {
        "id": "sec-reserve-bistro",
        "kind": "section",
        "component": "reservation-widget",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Evening Table Reservations",
          "subtitle": "Dinner service commences daily at 5:30 PM. Walk-ins welcomed at the bar counter."
        },
        "styles": { "base": { "paddingY": "4rem" } }
      },
      "sec-testimonials-bistro": {
        "id": "sec-testimonials-bistro",
        "kind": "section",
        "component": "testimonials",
        "variant": "default",
        "children": [],
        "props": {
          "title": "Critics & Gastronomy Press",
          "reviews": [
            { "author": "Culinary Digest", "text": "An unforgettable evening of oak-fired flavors and remarkable natural wine selections.", "rating": 5 },
            { "author": "Chef Daniel P.", "text": "Masterful balance of rustic bistro comfort and modern culinary precision.", "rating": 5 }
          ]
        },
        "styles": { "base": { "paddingY": "4rem" } }
      }
    }
  }'::jsonb
)
ON CONFLICT (slug) WHERE store_id IS NULL
DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  component_tree = EXCLUDED.component_tree,
  updated_at = NOW();
