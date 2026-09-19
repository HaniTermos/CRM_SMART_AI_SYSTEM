/**
 * SmartStore Website Studio (CMS V3) — Simple Mode Inspector
 * Tailored for non-technical users and business owners:
 * - Direct copy and CTA editing
 * - Visual style presets (Size, Alignment, Spacing, Rounding, Glassmorphism, Theme Tone)
 * - 1-Click Smart AI enhancements
 */

import React from "react";
import { PageNode } from "../../types/cms-v3";
import {
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Square,
  Palette,
  Sliders,
  Layers,
  Wand2,
  Check,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveControlHeader, DeviceBreakpoint } from "./ResponsiveControl";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface SimpleModeInspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
  activeDevice: DeviceBreakpoint;
  onSelectDevice: (device: DeviceBreakpoint) => void;
}

export function SimpleModeInspector({
  node,
  onChangeNode,
  activeDevice,
  onSelectDevice,
}: SimpleModeInspectorProps) {
  const props = node.props || {};
  const baseStyles = node.styles?.base || {};
  const responsiveStyles = node.styles?.responsive || {};

  const currentStyles =
    activeDevice === "desktop"
      ? baseStyles
      : { ...baseStyles, ...((responsiveStyles[activeDevice] as Record<string, unknown>) || {}) };

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, [key]: value },
    });
  };

  const updateStyle = (key: string, value: unknown) => {
    if (activeDevice === "desktop") {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          base: { ...(node.styles?.base || {}), [key]: value },
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
    if (activeDevice === "desktop") {
      onChangeNode({
        ...node,
        styles: {
          ...node.styles,
          base: { ...(node.styles?.base || {}), ...patch },
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

  const titleContent = (props.title as string) || (props.content as string) || (props.label as string) || "";
  const subtitle = (props.subtitle as string) || (props.description as string) || "";
  const textAlign = (currentStyles.textAlign as string) || "left";
  const fontSize = (currentStyles.fontSize as string) || "1.5rem";
  const textColor = (currentStyles.color as string) || (currentStyles.textColor as string) || "";
  const backgroundColor = (currentStyles.backgroundColor as string) || "";
  const borderRadius = (currentStyles.borderRadius as string) || "0.75rem";
  const padding = (currentStyles.padding as string) || "1.5rem";

  return (
    <div className="space-y-4 text-xs text-slate-200 pb-8 animate-in fade-in duration-150">
      {/* 1. Quick Copy Editing */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-750/80 backdrop-blur-md space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-white flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-400" /> Content & Copy
          </span>
          <span className="text-[10px] text-indigo-400 flex items-center gap-1">
            <Wand2 className="w-3 h-3" /> Easy Edit
          </span>
        </div>

        {/* Primary Text */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-300">Headline / Text</span>
          <textarea
            rows={2}
            value={titleContent}
            onChange={(e) => {
              updateProp("title", e.target.value);
              updateProp("content", e.target.value);
              updateProp("label", e.target.value);
            }}
            placeholder="Type content here..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-white text-xs leading-relaxed focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Secondary Subtitle if supported */}
        {("subtitle" in props || "description" in props || ["hero", "story-about", "testimonials"].includes(node.component)) && (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Subtitle / Description</span>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => {
                updateProp("subtitle", e.target.value);
                updateProp("description", e.target.value);
              }}
              placeholder="Supporting description..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-white text-xs leading-relaxed focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Button CTA Link if applicable */}
        {("url" in props || "primaryCtaLink" in props || node.component === "button") && (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Button Link</span>
            <input
              type="text"
              value={(props.url as string) || (props.primaryCtaLink as string) || ""}
              onChange={(e) => {
                updateProp("url", e.target.value);
                updateProp("primaryCtaLink", e.target.value);
              }}
              placeholder="e.g. /menu or https://..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* 2. Visual Look & Feel Presets */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-750/80 backdrop-blur-md space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-white flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400" /> Visual Look & Feel
          </span>
        </div>

        {/* Alignment with Responsive Control */}
        <div className="space-y-1">
          <ResponsiveControlHeader
            label="Alignment"
            activeDevice={activeDevice}
            onSelectDevice={onSelectDevice}
          />
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            {[
              { id: "left", icon: AlignLeft, label: "Left" },
              { id: "center", icon: AlignCenter, label: "Center" },
              { id: "right", icon: AlignRight, label: "Right" },
            ].map((item) => {
              const Icon = item.icon;
              const active = textAlign === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateStyle("textAlign", item.id)}
                  className={cn(
                    "py-1.5 rounded-md flex items-center justify-center gap-1.5 transition text-[11px]",
                    active
                      ? "bg-indigo-600 text-white font-bold shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Size Presets */}
        <div className="space-y-1 border-t border-slate-800/60 pt-2.5">
          <span className="text-[11px] font-medium text-slate-300">Size Preset</span>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: "Small", size: "0.875rem" },
              { label: "Medium", size: "1.125rem" },
              { label: "Large", size: "1.75rem" },
              { label: "Hero", size: "2.5rem" },
            ].map((p) => {
              const active = fontSize === p.size;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => updateStyle("fontSize", p.size)}
                  className={cn(
                    "py-1 rounded-md text-[10px] font-medium transition border text-center",
                    active
                      ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colors */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
          <span className="text-[11px] font-medium text-slate-300">Text Color</span>
          <ColorPickerPopover
            color={textColor}
            onChange={(val) => {
              updateStyle("color", val);
              updateStyle("textColor", val);
            }}
          />
        </div>

        {/* Corner Rounding */}
        <div className="space-y-1 border-t border-slate-800/60 pt-2.5">
          <span className="text-[11px] font-medium text-slate-300">Corner Rounding</span>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: "Sharp", radius: "0.25rem" },
              { label: "Soft", radius: "0.75rem" },
              { label: "Curved", radius: "1.5rem" },
              { label: "Pill", radius: "9999px" },
            ].map((r) => {
              const active = borderRadius === r.radius;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => updateStyle("borderRadius", r.radius)}
                  className={cn(
                    "py-1 rounded-md text-[10px] font-medium transition border text-center",
                    active
                      ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacing Presets */}
        <div className="space-y-1 border-t border-slate-800/60 pt-2.5">
          <span className="text-[11px] font-medium text-slate-300">Padding Spacing</span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: "Compact", pad: "0.75rem" },
              { label: "Balanced", pad: "1.5rem" },
              { label: "Spacious", pad: "3rem" },
            ].map((sp) => {
              const active = padding === sp.pad;
              return (
                <button
                  key={sp.label}
                  type="button"
                  onClick={() => updateStyle("padding", sp.pad)}
                  className={cn(
                    "py-1 rounded-md text-[10px] font-medium transition border text-center",
                    active
                      ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                  )}
                >
                  {sp.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 1-Click Glassmorphism & Visual Styles */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-750/80 backdrop-blur-md space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Smart Card Styles
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Frosted Dark Glass */}
          <button
            type="button"
            onClick={() => {
              updateMultipleStyles({
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderRadius: "1rem",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
                color: "#ffffff",
              });
            }}
            className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-400/50 transition text-left space-y-1 group"
          >
            <div className="w-4 h-4 rounded-full bg-cyan-400/20 border border-cyan-400/50" />
            <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 block">
              Frosted Dark Glass
            </span>
            <span className="text-[9px] text-slate-500 block">Modern dark blur effect</span>
          </button>

          {/* Neon Glow Accent */}
          <button
            type="button"
            onClick={() => {
              updateMultipleStyles({
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(99, 102, 241, 0.4)",
                borderRadius: "1rem",
                boxShadow: "0 0 25px -5px rgba(99, 102, 241, 0.35)",
                color: "#ffffff",
              });
            }}
            className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-400/50 transition text-left space-y-1 group"
          >
            <div className="w-4 h-4 rounded-full bg-indigo-500/30 border border-indigo-400" />
            <span className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300 block">
              Neon Glow Accent
            </span>
            <span className="text-[9px] text-slate-500 block">Indigo ambient radiance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
