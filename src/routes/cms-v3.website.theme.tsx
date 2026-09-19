import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Palette,
  CheckCircle2,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Check,
  Layers,
  Sliders,
  SlidersHorizontal,
  RefreshCw,
  Type,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const GOOGLE_FONTS_CATALOG = [
  // Modern & Sans-Serif
  { name: "Inter", category: "Sans-Serif", sample: "Clean Modern Sans" },
  { name: "Outfit", category: "Geometric Sans", sample: "Trendy Tech & Retail" },
  { name: "Plus Jakarta Sans", category: "Geometric Sans", sample: "Ultra Clean Contemporary" },
  { name: "Poppins", category: "Geometric Sans", sample: "Friendly & Rounded" },
  { name: "Montserrat", category: "Sans-Serif", sample: "Urban Architectural" },
  { name: "DM Sans", category: "Sans-Serif", sample: "Editorial Geometric" },
  { name: "Roboto", category: "Sans-Serif", sample: "Classic Readable Sans" },
  { name: "Open Sans", category: "Sans-Serif", sample: "Balanced Neutral" },
  { name: "Space Grotesk", category: "Brutalist Sans", sample: "Tech Innovation & Web3" },
  { name: "Syne", category: "Display Sans", sample: "Avant-Garde High Fashion" },
  { name: "Urbanist", category: "Geometric Sans", sample: "Sleek Minimalist" },
  { name: "Manrope", category: "Modern Sans", sample: "Executive Commercial" },
  { name: "Rubik", category: "Soft Sans", sample: "Friendly Organic" },
  { name: "Nunito", category: "Rounded Sans", sample: "Warm Approachable" },
  { name: "Work Sans", category: "Grotesque", sample: "Optimized UI Design" },
  { name: "Raleway", category: "Elegant Sans", sample: "Sophisticated Headings" },
  { name: "Epilogue", category: "Sans-Serif", sample: "Bold Editorial Modern" },
  { name: "Jost", category: "Futura Inspired", sample: "German Geometric Perfection" },
  { name: "Sora", category: "Display Sans", sample: "Futuristic Precision" },
  
  // Luxury, Editorial & Classical Serifs
  { name: "Playfair Display", category: "Editorial Serif", sample: "High Fashion Luxury" },
  { name: "Cinzel", category: "Classical Roman", sample: "Palatial Fine Dining" },
  { name: "Cinzel Decorative", category: "Classical Ornate", sample: "Regal Elegance" },
  { name: "Lora", category: "Contemporary Serif", sample: "Artisanal Bakery & Cafe" },
  { name: "Merriweather", category: "Editorial Serif", sample: "Traditional Warmth" },
  { name: "Cormorant Garamond", category: "Vintage Serif", sample: "Boutique Heritage" },
  { name: "Bodoni Moda", category: "Modern Didone", sample: "Haute Couture & Bistro" },
  { name: "Spectral", category: "French Serif", sample: "Literary Excellence" },
  { name: "Prata", category: "Didone Serif", sample: "Graceful High Contrast" },
  { name: "Fraunces", category: "Variable Serif", sample: "Craft Brewery & Roastery" },
  { name: "Bitter", category: "Slab Serif", sample: "Sturdy Craftsmanship" },

  // Display & Impact
  { name: "Oswald", category: "Display Condensed", sample: "Punchy Banner Titles" },
  { name: "Bebas Neue", category: "Display All-Caps", sample: "Dynamic Impactful Headlines" },
  { name: "Anton", category: "Heavy Poster", sample: "Bold Commercial Focus" },
  { name: "Righteous", category: "Retro Display", sample: "Neon 80s Hospitality" },
  { name: "Abril Fatface", category: "Headline Display", sample: "Glamorous Dramatic" },

  // Script & Handwritten
  { name: "Dancing Script", category: "Handwritten", sample: "Artisan Cafe Signature" },
  { name: "Great Vibes", category: "Calligraphy", sample: "Luxury Wedding & Event" },
  { name: "Sacramento", category: "Monoline Script", sample: "Charming Boutique" },
  { name: "Caveat", category: "Casual Handwriting", sample: "Friendly Coffee Notes" },

  // Monospace & Creative
  { name: "Space Mono", category: "Monospace", sample: "Cybernetic Futuristic" },
  { name: "Fira Code", category: "Clean Monospace", sample: "Developer Tech Store" }
];

export const Route = createFileRoute("/cms-v3/website/theme")({
  component: CmsThemeStudio,
});

function CmsThemeStudio() {
  const [themes, setThemes] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
  const [tokens, setTokens] = useState<any>({
    colors: { primary: "#4F46E5", background: "#FAFAFA", text: "#0F172A", accent: "#06B6D4", surface: "#FFFFFF" },
    typography: { fontHeading: "Outfit", fontBody: "Inter" },
    styles: { cardRadius: "1rem", sectionPadding: "4rem" }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Dynamic Google Font Injection in DOM head
  useEffect(() => {
    const fontNames = GOOGLE_FONTS_CATALOG.map((f) => f.name.replace(/ /g, "+")).join("&family=");
    const linkId = "cms-v3-dynamic-google-fonts";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fontNames}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  const loadThemeData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cms-v3/me/themes");
      if (res.data?.success) {
        setThemes(res.data.data?.themes || []);
        setSiteConfig(res.data.data?.siteConfig || null);

        if (res.data.data?.siteConfig?.global_tokens?.colors) {
          setTokens(res.data.data.siteConfig.global_tokens);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load themes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThemeData();
  }, []);

  const handleApplyDraftTheme = async (theme: any) => {
    setSelectedTheme(theme);
    try {
      const res = await api.post("/cms-v3/me/themes/apply-draft", {
        themeId: theme.id,
        themeSlug: theme.slug
      });

      if (res.data?.success) {
        setSiteConfig(res.data.data?.siteConfig);
        if (theme.colors) {
          setTokens((prev: any) => ({
            ...prev,
            colors: { ...prev.colors, ...theme.colors }
          }));
        }
        toast.success(`Applied ${theme.name} as draft theme!`);
      } else {
        toast.error("Failed to apply theme draft");
      }
    } catch (err) {
      toast.error("Error applying theme");
    }
  };

  const handleSaveTokens = async () => {
    setIsSaving(true);
    try {
      const res = await api.put("/cms-v3/me/themes/tokens", {
        global_tokens: tokens
      });

      if (res.data?.success) {
        toast.success("Design tokens saved to store config!");
      } else {
        toast.error("Failed to save tokens");
      }
    } catch (err) {
      toast.error("Error saving tokens");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishTheme = async () => {
    setIsPublishing(true);
    try {
      const res = await api.post("/cms-v3/me/themes/publish");

      if (res.data?.success) {
        toast.success("Theme published live to storefront!");
        loadThemeData();
      } else {
        toast.error(res.data?.error || "Failed to publish theme");
      }
    } catch (err) {
      toast.error("Error publishing theme");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" /> Theme & Design Token Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select system themes, customize global design tokens, and generate live CSS variables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveTokens}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Draft Tokens"}</span>
          </button>
          <button
            onClick={handlePublishTheme}
            disabled={isPublishing}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isPublishing ? "Publishing..." : "Publish Theme"}</span>
          </button>
        </div>
      </div>

      {/* System Theme Catalog */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Themes Catalog</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map((t) => {
              const isSelected =
                siteConfig?.draft_theme_id === t.id ||
                siteConfig?.active_theme_id === t.id ||
                selectedTheme?.id === t.id;

              const isLive = siteConfig?.active_theme_id === t.id;

              return (
                <div
                  key={t.id || t.slug}
                  onClick={() => handleApplyDraftTheme(t)}
                  className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 cursor-pointer transition ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className="h-20 rounded-lg border border-slate-200 p-3 flex flex-col justify-between"
                    style={{ backgroundColor: t.colors?.background || "#FAFAFA" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-slate-900/80">
                        {t.category || "General"}
                      </span>
                      {isLive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-emerald-800 bg-emerald-100">
                          Active Live
                        </span>
                      )}
                    </div>
                    <div
                      className="h-3 w-12 rounded"
                      style={{ backgroundColor: t.colors?.primary || "#4F46E5" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                      <span className="text-[11px] text-slate-400">Click to Apply Draft</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Design Token Customizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Design Token Inspector & CSS Variables</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live In-Memory Preview</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colors */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Brand Colors</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1 font-semibold">Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tokens.colors?.primary || "#4F46E5"}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        colors: { ...tokens.colors, primary: e.target.value }
                      })
                    }
                    className="h-8 w-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tokens.colors?.primary || "#4F46E5"}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        colors: { ...tokens.colors, primary: e.target.value }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1 font-semibold">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tokens.colors?.accent || "#06B6D4"}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        colors: { ...tokens.colors, accent: e.target.value }
                      })
                    }
                    className="h-8 w-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tokens.colors?.accent || "#06B6D4"}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        colors: { ...tokens.colors, accent: e.target.value }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1 font-semibold">Background Canvas</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tokens.colors?.background || "#FAFAFA"}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        colors: { ...tokens.colors, background: e.target.value }
                      })
                    }
                    className="h-8 w-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tokens.colors?.background || "#FAFAFA"}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        colors: { ...tokens.colors, background: e.target.value }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-600" /> Typography & Google Fonts
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">{GOOGLE_FONTS_CATALOG.length} fonts active</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 block mb-1.5 font-semibold flex items-center justify-between">
                  <span>Heading Font Family</span>
                  <span className="text-[10px] text-indigo-600 font-bold" style={{ fontFamily: tokens.typography?.fontHeading || "Outfit" }}>
                    Sample: {tokens.typography?.fontHeading || "Outfit"}
                  </span>
                </label>
                <select
                  value={tokens.typography?.fontHeading || "Outfit"}
                  onChange={(e) =>
                    setTokens({
                      ...tokens,
                      typography: { ...tokens.typography, fontHeading: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  style={{ fontFamily: tokens.typography?.fontHeading || "Outfit" }}
                >
                  {GOOGLE_FONTS_CATALOG.map((font) => (
                    <option
                      key={`heading-${font.name}`}
                      value={font.name}
                      style={{ fontFamily: font.name, fontSize: "14px", padding: "6px" }}
                    >
                      {font.name} — {font.sample} ({font.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1.5 font-semibold flex items-center justify-between">
                  <span>Body Font Family</span>
                  <span className="text-[10px] text-indigo-600 font-bold" style={{ fontFamily: tokens.typography?.fontBody || "Inter" }}>
                    Sample: {tokens.typography?.fontBody || "Inter"}
                  </span>
                </label>
                <select
                  value={tokens.typography?.fontBody || "Inter"}
                  onChange={(e) =>
                    setTokens({
                      ...tokens,
                      typography: { ...tokens.typography, fontBody: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  style={{ fontFamily: tokens.typography?.fontBody || "Inter" }}
                >
                  {GOOGLE_FONTS_CATALOG.map((font) => (
                    <option
                      key={`body-${font.name}`}
                      value={font.name}
                      style={{ fontFamily: font.name, fontSize: "14px", padding: "6px" }}
                    >
                      {font.name} — {font.sample} ({font.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Geometry & Shape */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Geometry & Spacing</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1 font-semibold">Card Border Radius</label>
                <select
                  value={tokens.styles?.cardRadius || "1rem"}
                  onChange={(e) =>
                    setTokens({
                      ...tokens,
                      styles: { ...tokens.styles, cardRadius: e.target.value }
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                >
                  <option value="0px">Sharp (0px)</option>
                  <option value="0.5rem">Subtle (8px)</option>
                  <option value="1rem">Rounded (16px)</option>
                  <option value="1.5rem">Pill Smooth (24px)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1 font-semibold">Section Vertical Spacing</label>
                <select
                  value={tokens.styles?.sectionPadding || "4rem"}
                  onChange={(e) =>
                    setTokens({
                      ...tokens,
                      styles: { ...tokens.styles, sectionPadding: e.target.value }
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                >
                  <option value="2.5rem">Compact (40px)</option>
                  <option value="4rem">Standard (64px)</option>
                  <option value="6rem">Spacious (96px)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
