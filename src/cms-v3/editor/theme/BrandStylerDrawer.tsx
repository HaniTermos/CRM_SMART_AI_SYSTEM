/**
 * SmartStore Website Studio (CMS V3) — Live Brand & Theme Customization
 * Instant 1-click brand palettes, Google Fonts typography scaling, shape radii, and live CSS variable injection.
 */

import React, { useState } from "react";
import {
  Palette,
  Type,
  Square,
  Sparkles,
  Check,
  Sliders,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { ThemeTokens } from "../../types/cms-v3";
import { cn } from "@/lib/utils";

interface BrandPalettePreset {
  id: string;
  name: string;
  category: string;
  headingFont: string;
  bodyFont: string;
  buttonRadius: string;
  cardRadius: string;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryContrast: string;
    secondary: string;
    accent: string;
    border: string;
  };
}

const BRAND_PRESETS: BrandPalettePreset[] = [
  {
    id: "artisanal-warm",
    name: "Artisanal Bakery & Cafe",
    category: "Warm & Rustic",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    buttonRadius: "0.75rem",
    cardRadius: "1rem",
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
  },
  {
    id: "bistro-luxury-dark",
    name: "Bistro Luxury Dark & Gold",
    category: "High-End Gastronomy",
    headingFont: "Cinzel",
    bodyFont: "Plus Jakarta Sans",
    buttonRadius: "0.5rem",
    cardRadius: "0.75rem",
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
  },
  {
    id: "espresso-modern",
    name: "Specialty Espresso & Brunch",
    category: "Contemporary Cafe",
    headingFont: "Outfit",
    bodyFont: "Inter",
    buttonRadius: "1rem",
    cardRadius: "1.25rem",
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
  },
  {
    id: "nordic-minimalist",
    name: "Nordic Minimalist Clean",
    category: "Sleek Boutique",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    buttonRadius: "0.25rem",
    cardRadius: "0.5rem",
    colors: {
      background: "#FFFFFF",
      surface: "#F9FAFB",
      surfaceMuted: "#F3F4F6",
      text: "#111827",
      textMuted: "#6B7280",
      primary: "#0F172A",
      primaryContrast: "#FFFFFF",
      secondary: "#334155",
      accent: "#06B6D4",
      border: "#E5E7EB",
    },
  },
  {
    id: "burgundy-wine",
    name: "Velvet Burgundy Lounge",
    category: "Wine & Evening Dining",
    headingFont: "Fraunces",
    bodyFont: "DM Sans",
    buttonRadius: "0.75rem",
    cardRadius: "1rem",
    colors: {
      background: "#180B10",
      surface: "#241018",
      surfaceMuted: "#361623",
      text: "#FFF1F5",
      textMuted: "#D4A5B5",
      primary: "#BE123C",
      primaryContrast: "#FFFFFF",
      secondary: "#9F1239",
      accent: "#FB7185",
      border: "#4C1D2E",
    },
  },
  {
    id: "cyber-emerald",
    name: "Modern Fresh Botanical",
    category: "Healthy & Organic",
    headingFont: "Cabinet Grotesk",
    bodyFont: "Satoshi",
    buttonRadius: "9999px",
    cardRadius: "1.5rem",
    colors: {
      background: "#F0FDF4",
      surface: "#FFFFFF",
      surfaceMuted: "#DCFCE7",
      text: "#052E16",
      textMuted: "#166534",
      primary: "#059669",
      primaryContrast: "#FFFFFF",
      secondary: "#047857",
      accent: "#10B981",
      border: "#BBF7D0",
    },
  },
];

const GOOGLE_FONTS = [
  "Inter",
  "Outfit",
  "Plus Jakarta Sans",
  "Playfair Display",
  "Cinzel",
  "Space Grotesk",
  "Cabinet Grotesk",
  "Satoshi",
  "Fraunces",
  "DM Sans",
  "Poppins",
  "Montserrat",
  "Manrope",
  "JetBrains Mono",
];

interface BrandStylerDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentTheme: Partial<ThemeTokens> | undefined;
  onApplyTheme: (theme: Partial<ThemeTokens>) => void;
}

export function BrandStylerDrawer({
  currentTheme,
  onApplyTheme,
}: BrandStylerDrawerProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [customColors, setCustomColors] = useState({
    primary: currentTheme?.colors?.primary || "#4F46E5",
    secondary: currentTheme?.colors?.secondary || "#3B82F6",
    accent: currentTheme?.colors?.accent || "#00E0FF",
    background: currentTheme?.colors?.background || "#FAFAFA",
    surface: currentTheme?.colors?.surface || "#FFFFFF",
    text: currentTheme?.colors?.text || "#0F172A",
  });

  const [headingFont, setHeadingFont] = useState(currentTheme?.typography?.headingFont || "Outfit");
  const [bodyFont, setBodyFont] = useState(currentTheme?.typography?.bodyFont || "Inter");
  const [buttonRadius, setButtonRadius] = useState(currentTheme?.shape?.buttonRadius || "1rem");

  const handleApplyPreset = (preset: BrandPalettePreset) => {
    onApplyTheme({
      colors: preset.colors,
      typography: {
        headingFont: preset.headingFont,
        bodyFont: preset.bodyFont,
        scale: "normal",
        headingWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
      },
      shape: {
        buttonRadius: preset.buttonRadius,
        cardRadius: preset.cardRadius,
        radiusSmall: "0.375rem",
        radiusMedium: "0.75rem",
        radiusLarge: "1.25rem",
      },
      direction: "ltr",
    });
  };

  const handleApplyCustom = () => {
    onApplyTheme({
      colors: {
        ...currentTheme?.colors,
        ...customColors,
        surfaceMuted: "#F4F4F5",
        textMuted: "#64748B",
        primaryContrast: "#FFFFFF",
        border: "#E2E8F0",
      },
      typography: {
        ...currentTheme?.typography,
        headingFont,
        bodyFont,
        scale: "normal",
        headingWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
      },
      shape: {
        ...currentTheme?.shape,
        buttonRadius,
        cardRadius: "1rem",
      },
      direction: "ltr",
    });
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 text-slate-100">
      {/* Sub Header Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950 border-b border-slate-800 text-center shrink-0">
        <button
          onClick={() => setActiveTab("presets")}
          className={cn(
            "py-1 rounded-md text-[11px] font-bold transition",
            activeTab === "presets" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
          )}
        >
          Brand Palettes
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={cn(
            "py-1 rounded-md text-[11px] font-bold transition",
            activeTab === "custom" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
          )}
        >
          Custom Brand
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {activeTab === "presets" ? (
          <div className="space-y-2.5">
            <div className="text-[10px] text-slate-400 leading-normal">
              1-click curated brand styling with coordinated fonts, colors, and button shapes:
            </div>

            {BRAND_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="group p-2.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:border-indigo-500/60 transition-all cursor-pointer space-y-1.5 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[8px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {preset.category}
                  </span>
                </div>

                {/* Color Swatch Bar */}
                <div className="flex items-center gap-1 h-4 rounded-md overflow-hidden border border-slate-800">
                  <div className="flex-1 h-full" style={{ backgroundColor: preset.colors.background }} title="Background" />
                  <div className="flex-1 h-full" style={{ backgroundColor: preset.colors.surface }} title="Surface" />
                  <div className="flex-1 h-full" style={{ backgroundColor: preset.colors.primary }} title="Primary" />
                  <div className="flex-1 h-full" style={{ backgroundColor: preset.colors.secondary }} title="Secondary" />
                  <div className="flex-1 h-full" style={{ backgroundColor: preset.colors.accent }} title="Accent" />
                  <div className="flex-1 h-full" style={{ backgroundColor: preset.colors.text }} title="Text" />
                </div>

                {/* Font and Radius Preview */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                  <span style={{ fontFamily: preset.headingFont }} className="font-bold text-slate-300">
                    {preset.headingFont}
                  </span>
                  <span>Radius: {preset.buttonRadius}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {/* Custom Brand Colors */}
            <div className="space-y-2">
              <label className="font-bold text-[11px] text-slate-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" /> Brand Colors
              </label>

              {[
                { key: "primary", label: "Primary Accent" },
                { key: "secondary", label: "Secondary Color" },
                { key: "accent", label: "Highlight Accent" },
                { key: "background", label: "Page Background" },
                { key: "surface", label: "Card / Surface" },
                { key: "text", label: "Text Color" },
              ].map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">{c.label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customColors[c.key as keyof typeof customColors]}
                      onChange={(e) =>
                        setCustomColors((prev) => ({ ...prev, [c.key]: e.target.value }))
                      }
                      className="w-6 h-6 rounded border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={customColors[c.key as keyof typeof customColors]}
                      onChange={(e) =>
                        setCustomColors((prev) => ({ ...prev, [c.key]: e.target.value }))
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Global Typography */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="font-bold text-[11px] text-slate-200 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" /> Typography
              </label>

              <div>
                <span className="text-[10px] text-slate-400">Heading Font</span>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full mt-0.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400">Body Font</span>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full mt-0.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Global Shape Radii */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="font-bold text-[11px] text-slate-200 flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5 text-indigo-400" /> Button Radii
              </label>

              <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-center">
                {[
                  { label: "Sharp", val: "0px" },
                  { label: "Subtle", val: "0.5rem" },
                  { label: "Curved", val: "1rem" },
                  { label: "Pill", val: "9999px" },
                ].map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setButtonRadius(r.val)}
                    className={cn(
                      "py-1 rounded text-[9px] font-bold transition",
                      buttonRadius === r.val
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 mt-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Custom Tokens</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
