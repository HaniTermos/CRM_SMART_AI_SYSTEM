import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LayoutTemplate, Sparkles, CheckCircle2, ArrowRight, Eye, Layers, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/templates")({
  component: CmsTemplatesGallery,
});

// Built-in 100% functional commercial templates with full PageDocument ASTs & Brand Tokens
const SYSTEM_FUNCTIONAL_TEMPLATES = [
  {
    id: "bakery-artisan-starter",
    slug: "bakery-artisan-starter",
    name: "Artisanal Bakery & Pastry Shop",
    category: "bakery",
    description: "Warm, rustic storefront featuring hero bread showcase, daily baked menu grid, storytelling section, customer reviews, and pick-up order CTA.",
    thumbnail_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    sectionsCount: 5,
    component_tree: {
      versionNumber: 1,
      rootNodeId: "root",
      themeOverride: {
        colors: {
          background: "#FAF7F2",
          surface: "#FFFFFF",
          surfaceMuted: "#F3EDE2",
          text: "#2D241E",
          textMuted: "#7C6F65",
          primary: "#C26D38",
          primaryContrast: "#FFFFFF",
          secondary: "#8C5835",
          accent: "#E29555",
          border: "#EADDCF",
        },
        typography: {
          headingFont: "Playfair Display",
          bodyFont: "Inter",
          scale: "normal",
          headingWeight: 700,
          bodyWeight: 400,
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
        },
        shape: {
          buttonRadius: "0.75rem",
          cardRadius: "1rem",
        },
      },
      nodes: {
        root: {
          id: "root",
          kind: "page",
          component: "page",
          children: ["sec-hero-1", "sec-menu-1", "sec-story-1", "sec-reviews-1", "sec-contact-1"],
          props: { title: "Artisanal Bakery & Pastry Shop" },
          styles: { base: { background: "#FAF7F2" } }
        },
        "sec-hero-1": {
          id: "sec-hero-1",
          kind: "section",
          component: "section",
          children: ["sec-hero-1-row"],
          props: { title: "Hero Banner Section" },
          styles: { base: { paddingY: "4rem", width: "100%", backgroundColor: "#FAF7F2" } }
        },
        "sec-hero-1-row": {
          id: "sec-hero-1-row",
          kind: "container",
          component: "flex-container",
          children: ["sec-hero-1-col-content", "sec-hero-1-col-media"],
          props: { title: "Hero Split Row" },
          styles: { base: { flexDirection: "row", gap: "2.5rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", padding: "0" } }
        },
        "sec-hero-1-col-content": {
          id: "sec-hero-1-col-content",
          kind: "container",
          component: "flex-container",
          children: ["sec-hero-1-eyebrow", "sec-hero-1-title", "sec-hero-1-sub", "sec-hero-1-btns"],
          props: { title: "Hero Content Column" },
          styles: { base: { flexDirection: "column", gap: "1rem", alignItems: "flex-start", flex: "1 1 320px", padding: "0" } }
        },
        "sec-hero-1-eyebrow": {
          id: "sec-hero-1-eyebrow",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "✨ Baked Fresh Daily at 5:00 AM", tag: "span", title: "Eyebrow Badge" },
          styles: { base: { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", backgroundColor: "var(--color-surface-muted)", padding: "0.25rem 0.75rem", borderRadius: "9999px" } }
        },
        "sec-hero-1-title": {
          id: "sec-hero-1-title",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Traditional Sourdough & French Viennoiserie", tag: "h1", title: "Hero Heading (H1)" },
          styles: { base: { fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.2, color: "var(--color-text)" } }
        },
        "sec-hero-1-sub": {
          id: "sec-hero-1-sub",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Naturally leavened organic breads, buttery pastries, and specialty single-origin coffee crafted by master artisans.", tag: "p", title: "Hero Subtitle" },
          styles: { base: { fontSize: "1rem", lineHeight: 1.6, color: "var(--color-text-muted)" } }
        },
        "sec-hero-1-btns": {
          id: "sec-hero-1-btns",
          kind: "container",
          component: "flex-container",
          children: ["sec-hero-1-btn-1", "sec-hero-1-btn-2"],
          props: { title: "Hero CTA Buttons" },
          styles: { base: { flexDirection: "row", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", padding: "0.5rem 0 0 0" } }
        },
        "sec-hero-1-btn-1": {
          id: "sec-hero-1-btn-1",
          kind: "element",
          component: "button",
          children: [],
          props: { label: "Order Daily Bakes", url: "/menu", title: "Primary CTA Button" },
          styles: { base: { backgroundColor: "var(--color-primary)", color: "var(--color-primary-contrast)", borderRadius: "var(--shape-button-radius)", padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 700 } }
        },
        "sec-hero-1-btn-2": {
          id: "sec-hero-1-btn-2",
          kind: "element",
          component: "button",
          children: [],
          props: { label: "Reserve Table", url: "/reservations", title: "Secondary CTA Button" },
          styles: { base: { backgroundColor: "transparent", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--shape-button-radius)", padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 600 } }
        },
        "sec-hero-1-col-media": {
          id: "sec-hero-1-col-media",
          kind: "container",
          component: "flex-container",
          children: ["sec-hero-1-img"],
          props: { title: "Hero Media Column" },
          styles: { base: { flex: "1 1 320px", alignItems: "center", justifyContent: "center", padding: "0" } }
        },
        "sec-hero-1-img": {
          id: "sec-hero-1-img",
          kind: "element",
          component: "image",
          children: [],
          props: { url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80", alt: "Artisan Bread Showcase", title: "Hero Image Asset" },
          styles: { base: { aspectRatio: "4/3", borderRadius: "var(--shape-card-radius)", width: "100%", objectFit: "cover" } }
        },
        "sec-menu-1": {
          id: "sec-menu-1",
          kind: "section",
          component: "product-grid",
          variant: "grid",
          children: [],
          props: {
            title: "Today's Bakery Counter Specials",
            subtitle: "Handcrafted in small batches using stone-ground heritage grains",
            columns: 3,
            showPrice: true,
            filterCategory: "Bakery"
          },
          styles: { base: { paddingY: "4rem" } }
        },
        "sec-story-1": {
          id: "sec-story-1",
          kind: "section",
          component: "section",
          children: ["sec-story-1-row"],
          props: { title: "Our Story Section" },
          styles: { base: { paddingY: "4rem", width: "100%", backgroundColor: "var(--color-surface)" } }
        },
        "sec-story-1-row": {
          id: "sec-story-1-row",
          kind: "container",
          component: "flex-container",
          children: ["sec-story-1-col-content", "sec-story-1-col-media"],
          props: { title: "Story Split Row" },
          styles: { base: { flexDirection: "row", gap: "2.5rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", padding: "0" } }
        },
        "sec-story-1-col-content": {
          id: "sec-story-1-col-content",
          kind: "container",
          component: "flex-container",
          children: ["sec-story-1-eyebrow", "sec-story-1-title", "sec-story-1-sub"],
          props: { title: "Story Content Column" },
          styles: { base: { flexDirection: "column", gap: "1rem", alignItems: "flex-start", flex: "1 1 320px", padding: "0" } }
        },
        "sec-story-1-eyebrow": {
          id: "sec-story-1-eyebrow",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Est. 2018 · Heritage Baking", tag: "span", title: "Story Eyebrow" },
          styles: { base: { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)" } }
        },
        "sec-story-1-title": {
          id: "sec-story-1-title",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Our Fermentation Philosophy", tag: "h2", title: "Story Heading (H2)" },
          styles: { base: { fontSize: "2rem", fontWeight: 800, lineHeight: 1.25, color: "var(--color-text)" } }
        },
        "sec-story-1-sub": {
          id: "sec-story-1-sub",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Slow 36-hour wild yeast fermentation delivers unmatched depth, golden blistered crusts, and airy, wholesome crumb.", tag: "p", title: "Story Paragraph" },
          styles: { base: { fontSize: "1rem", lineHeight: 1.6, color: "var(--color-text-muted)" } }
        },
        "sec-story-1-col-media": {
          id: "sec-story-1-col-media",
          kind: "container",
          component: "flex-container",
          children: ["sec-story-1-img"],
          props: { title: "Story Media Column" },
          styles: { base: { flex: "1 1 320px", alignItems: "center", justifyContent: "center", padding: "0" } }
        },
        "sec-story-1-img": {
          id: "sec-story-1-img",
          kind: "element",
          component: "image",
          children: [],
          props: { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", alt: "Fermentation Process", title: "Story Image Asset" },
          styles: { base: { aspectRatio: "4/3", borderRadius: "var(--shape-card-radius)", width: "100%", objectFit: "cover" } }
        },
        "sec-reviews-1": {
          id: "sec-reviews-1",
          kind: "section",
          component: "testimonials",
          variant: "cards",
          children: [],
          props: {
            title: "Loved by Downtown Connoisseurs",
            subtitle: "Real feedback from our regular morning patrons and food critics"
          },
          styles: { base: { paddingY: "4rem" } }
        },
        "sec-contact-1": {
          id: "sec-contact-1",
          kind: "section",
          component: "contact-form",
          variant: "split",
          children: [],
          props: {
            title: "Visit Our Flagship Bakery",
            subtitle: "Drop by for warm pastries, fresh brew, or pick up custom catering orders.",
            address: "420 Artisan Lane, Culinary District",
            phone: "+1 (555) 345-6789",
            email: "hello@artisanbakery.com"
          },
          styles: { base: { paddingY: "4rem" } }
        }
      }
    }
  },
  {
    id: "bistro-gastronomy-starter",
    slug: "bistro-gastronomy-starter",
    name: "Modern Gastronomy & Wine Bistro",
    category: "bistro",
    description: "Sleek dark-mode aesthetic with chef tasting menus, sommelier pairings, instant online table booking, and curated photo showcase.",
    thumbnail_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
    sectionsCount: 4,
    component_tree: {
      versionNumber: 1,
      rootNodeId: "root",
      themeOverride: {
        colors: {
          background: "#0A0D14",
          surface: "#121722",
          surfaceMuted: "#1B2232",
          text: "#F8FAFC",
          textMuted: "#94A3B8",
          primary: "#D4AF37",
          primaryContrast: "#000000",
          secondary: "#A38020",
          accent: "#E8C868",
          border: "#263044",
        },
        typography: {
          headingFont: "Cinzel",
          bodyFont: "Plus Jakarta Sans",
          scale: "normal",
          headingWeight: 700,
          bodyWeight: 400,
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
        },
        shape: {
          buttonRadius: "0.5rem",
          cardRadius: "0.75rem",
        },
      },
      nodes: {
        root: {
          id: "root",
          kind: "page",
          component: "page",
          children: ["bistro-hero", "bistro-menu", "bistro-reserve", "bistro-location"],
          props: { title: "Modern Gastronomy & Wine Bistro" },
          styles: { base: { background: "#0A0D14", color: "#F8FAFC" } }
        },
        "bistro-hero": {
          id: "bistro-hero",
          kind: "section",
          component: "section",
          children: ["bistro-hero-row"],
          props: { title: "Bistro Hero Section" },
          styles: { base: { paddingY: "5rem", width: "100%", backgroundColor: "#0A0D14" } }
        },
        "bistro-hero-row": {
          id: "bistro-hero-row",
          kind: "container",
          component: "flex-container",
          children: ["bistro-hero-col-content", "bistro-hero-col-media"],
          props: { title: "Bistro Split Row" },
          styles: { base: { flexDirection: "row", gap: "3rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", padding: "0" } }
        },
        "bistro-hero-col-content": {
          id: "bistro-hero-col-content",
          kind: "container",
          component: "flex-container",
          children: ["bistro-hero-eyebrow", "bistro-hero-title", "bistro-hero-sub", "bistro-hero-btns"],
          props: { title: "Bistro Content Column" },
          styles: { base: { flexDirection: "column", gap: "1.25rem", alignItems: "flex-start", flex: "1 1 320px", padding: "0" } }
        },
        "bistro-hero-eyebrow": {
          id: "bistro-hero-eyebrow",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "★ Michelin Guide Recommended", tag: "span", title: "Eyebrow" },
          styles: { base: { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#D4AF37" } }
        },
        "bistro-hero-title": {
          id: "bistro-hero-title",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Elevated Seasonal Dining & Natural Wine", tag: "h1", title: "Bistro Title (H1)" },
          styles: { base: { fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.2, color: "#F8FAFC" } }
        },
        "bistro-hero-sub": {
          id: "bistro-hero-sub",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "An intimate culinary exploration of hyper-local ingredients paired with rare biodynamic vintages.", tag: "p", title: "Bistro Subtitle" },
          styles: { base: { fontSize: "1rem", lineHeight: 1.6, color: "#94A3B8" } }
        },
        "bistro-hero-btns": {
          id: "bistro-hero-btns",
          kind: "container",
          component: "flex-container",
          children: ["bistro-hero-btn-1", "bistro-hero-btn-2"],
          props: { title: "CTA Buttons" },
          styles: { base: { flexDirection: "row", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", padding: "0.5rem 0 0 0" } }
        },
        "bistro-hero-btn-1": {
          id: "bistro-hero-btn-1",
          kind: "element",
          component: "button",
          children: [],
          props: { label: "Reserve Evening Table", url: "/reservations", title: "Primary CTA" },
          styles: { base: { backgroundColor: "#D4AF37", color: "#000000", borderRadius: "0.5rem", padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 700 } }
        },
        "bistro-hero-btn-2": {
          id: "bistro-hero-btn-2",
          kind: "element",
          component: "button",
          children: [],
          props: { label: "Explore Tasting Menu", url: "/menu", title: "Secondary CTA" },
          styles: { base: { backgroundColor: "transparent", color: "#F8FAFC", border: "1px solid #263044", borderRadius: "0.5rem", padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 600 } }
        },
        "bistro-hero-col-media": {
          id: "bistro-hero-col-media",
          kind: "container",
          component: "flex-container",
          children: ["bistro-hero-img"],
          props: { title: "Bistro Media Column" },
          styles: { base: { flex: "1 1 320px", alignItems: "center", justifyContent: "center", padding: "0" } }
        },
        "bistro-hero-img": {
          id: "bistro-hero-img",
          kind: "element",
          component: "image",
          children: [],
          props: { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&auto=format&fit=crop&q=80", alt: "Bistro Dining Room", title: "Bistro Image Asset" },
          styles: { base: { aspectRatio: "4/3", borderRadius: "0.75rem", width: "100%", objectFit: "cover" } }
        },
        "bistro-menu": {
          id: "bistro-menu",
          kind: "section",
          component: "product-grid",
          variant: "tasting-list",
          children: [],
          props: {
            title: "Summer 7-Course Chef Tasting",
            subtitle: "Crafted daily based on coastal harvest and organic farm deliveries",
            showPrice: true
          },
          styles: { base: { paddingY: "5rem" } }
        },
        "bistro-reserve": {
          id: "bistro-reserve",
          kind: "section",
          component: "reservation-widget",
          variant: "interactive-card",
          children: [],
          props: {
            title: "Reserve Your Table",
            subtitle: "Tables released 30 days in advance. Private dining suites available."
          },
          styles: { base: { paddingY: "4rem" } }
        },
        "bistro-location": {
          id: "bistro-location",
          kind: "section",
          component: "contact-form",
          variant: "minimal",
          children: [],
          props: {
            title: "Private Dining & Location",
            address: "100 Grand Promenade, Suite 4",
            hours: "Tuesday - Sunday: 5:00 PM – 11:30 PM"
          },
          styles: { base: { paddingY: "4rem" } }
        }
      }
    }
  },
  {
    id: "cafe-espresso-starter",
    slug: "cafe-espresso-starter",
    name: "Specialty Espresso & Brunch Lounge",
    category: "cafe",
    description: "Vibrant and contemporary cafe template featuring specialty bean origins, breakfast & brunch menu, and fast mobile pickup ordering.",
    thumbnail_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
    sectionsCount: 4,
    component_tree: {
      versionNumber: 1,
      rootNodeId: "root",
      themeOverride: {
        colors: {
          background: "#F8F5F0",
          surface: "#FFFFFF",
          surfaceMuted: "#EFE8DC",
          text: "#1C1917",
          textMuted: "#78716C",
          primary: "#78350F",
          primaryContrast: "#FFFFFF",
          secondary: "#B45309",
          accent: "#D97706",
          border: "#E7DFD5",
        },
        typography: {
          headingFont: "Outfit",
          bodyFont: "Inter",
          scale: "normal",
          headingWeight: 700,
          bodyWeight: 400,
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
        },
        shape: {
          buttonRadius: "1rem",
          cardRadius: "1.25rem",
        },
      },
      nodes: {
        root: {
          id: "root",
          kind: "page",
          component: "page",
          children: ["cafe-hero", "cafe-beans", "cafe-menu", "cafe-visit"],
          props: { title: "Specialty Espresso & Brunch Lounge" },
          styles: { base: { background: "#F8F5F0" } }
        },
        "cafe-hero": {
          id: "cafe-hero",
          kind: "section",
          component: "section",
          children: ["cafe-hero-row"],
          props: { title: "Cafe Hero Section" },
          styles: { base: { paddingY: "4rem", width: "100%", backgroundColor: "#F8F5F0" } }
        },
        "cafe-hero-row": {
          id: "cafe-hero-row",
          kind: "container",
          component: "flex-container",
          children: ["cafe-hero-col-content", "cafe-hero-col-media"],
          props: { title: "Cafe Split Row" },
          styles: { base: { flexDirection: "row", gap: "2.5rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", padding: "0" } }
        },
        "cafe-hero-col-content": {
          id: "cafe-hero-col-content",
          kind: "container",
          component: "flex-container",
          children: ["cafe-hero-eyebrow", "cafe-hero-title", "cafe-hero-sub", "cafe-hero-btns"],
          props: { title: "Cafe Content Column" },
          styles: { base: { flexDirection: "column", gap: "1rem", alignItems: "flex-start", flex: "1 1 320px", padding: "0" } }
        },
        "cafe-hero-eyebrow": {
          id: "cafe-hero-eyebrow",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "☕ Direct Trade Micro-Roastery", tag: "span", title: "Eyebrow" },
          styles: { base: { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#78350F" } }
        },
        "cafe-hero-title": {
          id: "cafe-hero-title",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Precision Brewed Coffee & All-Day Brunch", tag: "h1", title: "Cafe Heading (H1)" },
          styles: { base: { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.2, color: "#1C1917" } }
        },
        "cafe-hero-sub": {
          id: "cafe-hero-sub",
          kind: "element",
          component: "text",
          children: [],
          props: { content: "Single-origin pour-overs, velvety espresso tonics, and golden sourdough brioche toasts.", tag: "p", title: "Cafe Subtitle" },
          styles: { base: { fontSize: "1rem", lineHeight: 1.6, color: "#78716C" } }
        },
        "cafe-hero-btns": {
          id: "cafe-hero-btns",
          kind: "container",
          component: "flex-container",
          children: ["cafe-hero-btn"],
          props: { title: "CTA Button Container" },
          styles: { base: { flexDirection: "row", gap: "0.75rem", alignItems: "center", padding: "0.5rem 0 0 0" } }
        },
        "cafe-hero-btn": {
          id: "cafe-hero-btn",
          kind: "element",
          component: "button",
          children: [],
          props: { label: "Order Pickup Online", url: "/menu", title: "Primary CTA" },
          styles: { base: { backgroundColor: "#78350F", color: "#FFFFFF", borderRadius: "1rem", padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 700 } }
        },
        "cafe-hero-col-media": {
          id: "cafe-hero-col-media",
          kind: "container",
          component: "flex-container",
          children: ["cafe-hero-img"],
          props: { title: "Cafe Media Column" },
          styles: { base: { flex: "1 1 320px", alignItems: "center", justifyContent: "center", padding: "0" } }
        },
        "cafe-hero-img": {
          id: "cafe-hero-img",
          kind: "element",
          component: "image",
          children: [],
          props: { url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80", alt: "Specialty Coffee Art", title: "Cafe Image Asset" },
          styles: { base: { aspectRatio: "4/3", borderRadius: "1.25rem", width: "100%", objectFit: "cover" } }
        },
        "cafe-beans": {
          id: "cafe-beans",
          kind: "section",
          component: "story-about",
          variant: "features-grid",
          children: [],
          props: {
            title: "Ethically Sourced Single Origins",
            subtitle: "Roasted weekly in small 5kg batches for optimal sweetness and clarity."
          },
          styles: { base: { paddingY: "4rem" } }
        },
        "cafe-menu": {
          id: "cafe-menu",
          kind: "section",
          component: "product-grid",
          variant: "grid",
          children: [],
          props: {
            title: "Espresso Bar & Kitchen Menu",
            columns: 3,
            showPrice: true
          },
          styles: { base: { paddingY: "4rem" } }
        },
        "cafe-visit": {
          id: "cafe-visit",
          kind: "section",
          component: "contact-form",
          variant: "hours-first",
          children: [],
          props: {
            title: "Roastery Hours & Location",
            address: "742 Botanical Way, Suite 10",
            hours: "Mon – Sun: 6:30 AM – 4:00 PM"
          },
          styles: { base: { paddingY: "4rem" } }
        }
      }
    }
  }
];

function CmsTemplatesGallery() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>(SYSTEM_FUNCTIONAL_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await api.get("/cms-v3/me/templates");
        if (res.data?.data?.templates && res.data.data.templates.length > 0) {
          const apiTemplates = res.data.data.templates;
          const merged = [...SYSTEM_FUNCTIONAL_TEMPLATES];
          apiTemplates.forEach((apiTpl: any) => {
            if (!merged.some(m => m.id === apiTpl.id || m.slug === apiTpl.slug)) {
              merged.push(apiTpl);
            }
          });
          setTemplates(merged);
        }
      } catch (err) {
        console.warn("Using built-in system templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "bakery", label: "Bakery & Sweets" },
    { id: "bistro", label: "Fine Dining & Bistro" },
    { id: "cafe", label: "Specialty Cafe" },
    { id: "restaurant", label: "Casual Dining" }
  ];

  const filteredTemplates = templates.filter(tpl => {
    if (selectedCategory === "all") return true;
    return tpl.category === selectedCategory;
  });

  const handleApplyTemplate = async (template: any) => {
    setApplyingTemplateId(template.id);
    try {
      const pageTitle = `${template.name} (Draft)`;
      const pageSlug = `page-${Date.now().toString().slice(-4)}`;

      const res = await api.post("/cms-v3/me/pages", {
        title: pageTitle,
        slug: pageSlug,
        pageType: template.category === "bistro" ? "menu" : "home",
        initialTree: template.component_tree
      });

      if (res.data?.success && res.data?.data?.page?.id) {
        const newPageId = res.data.data.page.id;
        toast.success(`Template applied! Opening visual editor...`);
        navigate({
          to: "/cms-v3/editor/$pageId",
          params: { pageId: newPageId }
        });
      } else {
        toast.error("Failed to create page from template");
      }
    } catch (err: any) {
      console.error("Apply template failed:", err);
      toast.error(err.response?.data?.error || "Error applying template to store");
    } finally {
      setApplyingTemplateId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-indigo-600" />
            <span>Storefront Templates Gallery</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Production-ready commercial storefront architectures with live AST trees and coordinated brand identities.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
          >
            {/* Template Visual Thumbnail Preview */}
            <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
              <img
                src={tpl.thumbnail_url || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80"}
                alt={tpl.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1.5 capitalize">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>{tpl.category}</span>
              </div>
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>{tpl.sectionsCount || tpl.component_tree?.nodes ? Object.keys(tpl.component_tree?.nodes || {}).length : 4} Sections</span>
              </div>
            </div>

            {/* Template Info Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleApplyTemplate(tpl)}
                  disabled={applyingTemplateId === tpl.id}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {applyingTemplateId === tpl.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Page...</span>
                    </>
                  ) : (
                    <>
                      <span>Use Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
