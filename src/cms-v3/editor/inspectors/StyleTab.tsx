/**
 * SmartStore Website Studio (CMS V3) — Elementor Pro Style Inspector Tab
 * Faithfully matches Elementor Style panel design:
 * - Alignment with responsive per-device toggle
 * - Typography trigger with full typography popover
 * - Text Color with full color picker popover
 * - Text Stroke, Text Shadow, Blend Mode
 * - Background, Borders, 4-corner Radius, Shadows
 * - Normal vs Hover state modes
 */

import React, { useState } from "react";
import { PageNode } from "../../types/cms-v3";
import {
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sun,
  Layers,
  Sparkles,
  Link2,
  Unlink,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveControlHeader, DeviceBreakpoint } from "./ResponsiveControl";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { TypographyPopover } from "./TypographyPopover";
import { BorderRadiusEditor } from "./BorderRadiusEditor";
import { BoxShadowEditor } from "./BoxShadowEditor";

interface StyleTabProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function StyleTab({ node, onChangeNode }: StyleTabProps) {
  const [styleState, setStyleState] = useState<"normal" | "hover">("normal");
  const [activeDevice, setActiveDevice] = useState<DeviceBreakpoint>("desktop");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    heading: true,
    background: true,
    border: true,
    shadow: true,
  });

  const toggleSection = (s: string) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  const baseStyles = node.styles?.base || {};
  const hoverStyles = node.styles?.states?.hover || {};
  const responsiveStyles = node.styles?.responsive || {};

  // Resolve current active styles based on breakpoint & state
  const getCurrentStyleValue = (key: string): any => {
    if (styleState === "hover") {
      return hoverStyles[key];
    }
    if (activeDevice === "desktop") {
      return baseStyles[key];
    }
    const devOverrides = (responsiveStyles[activeDevice] as Record<string, unknown>) || {};
    return devOverrides[key] !== undefined ? devOverrides[key] : baseStyles[key];
  };

  const updateStyle = (key: string, value: unknown) => {
    if (styleState === "hover") {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          states: {
            ...(node.styles?.states || {}),
            hover: {
              ...(node.styles?.states?.hover || {}),
              [key]: value,
            },
          },
        },
      });
      return;
    }

    if (activeDevice === "desktop") {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          base: {
            ...(node.styles?.base || {}),
            [key]: value,
          },
        },
      });
    } else {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          responsive: {
            ...responsiveStyles,
            [activeDevice]: {
              ...((responsiveStyles[activeDevice] as Record<string, unknown>) || {}),
              [key]: value,
            },
          },
        },
      });
    }
  };

  const updateMultipleStyles = (patch: Record<string, unknown>) => {
    if (styleState === "hover") {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          states: {
            ...(node.styles?.states || {}),
            hover: {
              ...(node.styles?.states?.hover || {}),
              ...patch,
            },
          },
        },
      });
      return;
    }

    if (activeDevice === "desktop") {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          base: {
            ...(node.styles?.base || {}),
            ...patch,
          },
        },
      });
    } else {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          responsive: {
            ...responsiveStyles,
            [activeDevice]: {
              ...((responsiveStyles[activeDevice] as Record<string, unknown>) || {}),
              ...patch,
            },
          },
        },
      });
    }
  };

  // Active properties
  const textAlign = getCurrentStyleValue("textAlign") || "left";
  const textColor = getCurrentStyleValue("color") || getCurrentStyleValue("textColor") || "";
  const fontFamily = getCurrentStyleValue("fontFamily") || "";
  const fontSize = getCurrentStyleValue("fontSize") || "";
  const fontWeight = getCurrentStyleValue("fontWeight") || 400;
  const lineHeight = getCurrentStyleValue("lineHeight") || "";
  const letterSpacing = getCurrentStyleValue("letterSpacing") || "";
  const textTransform = getCurrentStyleValue("textTransform") || "none";
  const textStroke = getCurrentStyleValue("textStroke") || "";
  const textShadow = getCurrentStyleValue("textShadow") || "";
  const mixBlendMode = getCurrentStyleValue("mixBlendMode") || "normal";

  const backgroundColor = getCurrentStyleValue("backgroundColor") || "";
  const borderStyle = getCurrentStyleValue("borderStyle") || "none";
  const borderWidth = getCurrentStyleValue("borderWidth") || "";
  const borderColor = getCurrentStyleValue("borderColor") || "";
  const borderRadius = getCurrentStyleValue("borderRadius") || "";
  const boxShadow = getCurrentStyleValue("boxShadow") || "none";

  const currentStyleMap =
    styleState === "hover"
      ? hoverStyles
      : activeDevice === "desktop"
      ? baseStyles
      : { ...baseStyles, ...((responsiveStyles[activeDevice] as Record<string, unknown>) || {}) };

  const isTextElement = ["text", "button", "hero", "header", "footer", "announcement-bar"].includes(node.component) || node.kind === "element";

  return (
    <div className="space-y-3 pb-8 text-xs text-slate-300">
      {/* 1. Normal vs Hover State Pill Switcher */}
      <div className="p-1 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-2 text-center text-xs font-semibold">
        <button
          type="button"
          onClick={() => setStyleState("normal")}
          className={cn(
            "py-1 rounded transition",
            styleState === "normal"
              ? "bg-slate-800 text-white shadow-xs font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Normal
        </button>
        <button
          type="button"
          onClick={() => setStyleState("hover")}
          className={cn(
            "py-1 rounded transition",
            styleState === "hover"
              ? "bg-slate-800 text-white shadow-xs font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Hover
        </button>
      </div>

      {/* SECTION 1: HEADING / TYPOGRAPHY */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/50 overflow-visible">
        <button
          type="button"
          onClick={() => toggleSection("heading")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5 capitalize">
            {openSections.heading ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {isTextElement ? "Heading / Typography" : "Style Properties"}
          </span>
        </button>

        {openSections.heading && (
          <div className="p-3 space-y-3">
            {/* Alignment */}
            <div className="space-y-1">
              <ResponsiveControlHeader
                label="Alignment"
                activeDevice={activeDevice}
                onSelectDevice={setActiveDevice}
                hasTabletOverride={!!(responsiveStyles.tablet && (responsiveStyles.tablet as any).textAlign)}
                hasMobileOverride={!!(responsiveStyles.mobile && (responsiveStyles.mobile as any).textAlign)}
              />
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                {[
                  { id: "left", icon: AlignLeft, title: "Left" },
                  { id: "center", icon: AlignCenter, title: "Center" },
                  { id: "right", icon: AlignRight, title: "Right" },
                  { id: "justify", icon: AlignJustify, title: "Justified" },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = textAlign === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateStyle("textAlign", item.id)}
                      className={cn(
                        "p-1.5 rounded flex items-center justify-center transition",
                        active ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-200"
                      )}
                      title={item.title}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Color */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-2">
              <span className="text-[11px] font-medium text-slate-300">Text Color</span>
              <ColorPickerPopover
                color={textColor}
                onChange={(val) => {
                  updateStyle("color", val);
                  updateStyle("textColor", val);
                }}
              />
            </div>

            {/* Typography Popover Row */}
            <div className="border-t border-slate-800/60 pt-2">
              <TypographyPopover
                activeDevice={activeDevice}
                onSelectDevice={setActiveDevice}
                fontFamily={fontFamily}
                fontSize={fontSize}
                fontWeight={fontWeight}
                lineHeight={lineHeight}
                letterSpacing={letterSpacing}
                textTransform={textTransform}
                onChange={updateMultipleStyles}
              />
            </div>

            {/* Text Stroke */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-2">
              <span className="text-[11px] font-medium text-slate-300">Text Stroke</span>
              <input
                type="text"
                value={textStroke}
                onChange={(e) => updateStyle("textStroke", e.target.value)}
                placeholder="e.g. 1px #000"
                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            {/* Text Shadow */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-2">
              <span className="text-[11px] font-medium text-slate-300">Text Shadow</span>
              <input
                type="text"
                value={textShadow}
                onChange={(e) => updateStyle("textShadow", e.target.value)}
                placeholder="e.g. 0 2px 4px rgba(0,0,0,0.5)"
                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            {/* Blend Mode */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-2">
              <span className="text-[11px] font-medium text-slate-300">Blend Mode</span>
              <select
                value={mixBlendMode}
                onChange={(e) => updateStyle("mixBlendMode", e.target.value)}
                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="difference">Difference</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: BACKGROUND */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/50 overflow-visible">
        <button
          type="button"
          onClick={() => toggleSection("background")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.background ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Background
          </span>
        </button>

        {openSections.background && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300">Background Color</span>
              <ColorPickerPopover
                color={backgroundColor}
                onChange={(val) => updateStyle("backgroundColor", val)}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: BORDER & CORNER RADIUS */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/50 overflow-visible">
        <button
          type="button"
          onClick={() => toggleSection("border")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.border ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Border & Radius
          </span>
        </button>

        {openSections.border && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">Border Type</span>
              <select
                value={borderStyle}
                onChange={(e) => updateStyle("borderStyle", e.target.value)}
                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </div>

            {borderStyle !== "none" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Border Width</span>
                  <input
                    type="text"
                    value={borderWidth}
                    onChange={(e) => updateStyle("borderWidth", e.target.value)}
                    placeholder="1px"
                    className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Border Color</span>
                  <ColorPickerPopover
                    color={borderColor}
                    onChange={(val) => updateStyle("borderColor", val)}
                  />
                </div>
              </>
            )}

            <BorderRadiusEditor
              styles={currentStyleMap}
              onChange={(patch) => updateMultipleStyles(patch)}
            />
          </div>
        )}
      </div>

      {/* SECTION 4: BOX SHADOW */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/50 overflow-visible">
        <button
          type="button"
          onClick={() => toggleSection("shadow")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.shadow ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Box Shadow
          </span>
        </button>

        {openSections.shadow && (
          <div className="p-3 space-y-3">
            <BoxShadowEditor
              value={boxShadow}
              onChange={(css) => updateStyle("boxShadow", css || "none")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
