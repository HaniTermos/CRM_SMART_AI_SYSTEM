/**
 * SmartStore Website Studio (CMS V3) — Elementor Pro Advanced Inspector Tab
 * Faithfully matches Elementor Advanced panel design:
 * - 4-way linked Margin & Padding with unit selector (px, %, em, rem, vw) and responsive device toggle
 * - Width dropdown (Default, Full Width 100%, Inline auto, Custom) with responsive device toggle
 * - Align Self & Order controls with responsive device toggle
 * - Z-Index, Position, Responsive Visibility (Hide on Desktop/Tablet/Mobile)
 * - Motion Effects, CSS ID, Custom Classes
 */

import React, { useState } from "react";
import { PageNode, BehaviorConfig } from "../../types/cms-v3";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Move,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveControlHeader, DeviceBreakpoint } from "./ResponsiveControl";
import { DimensionsInput } from "./DimensionsInput";

interface AdvancedTabProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function AdvancedTab({ node, onChangeNode }: AdvancedTabProps) {
  const [activeDevice, setActiveDevice] = useState<DeviceBreakpoint>("desktop");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    layout: true,
    motion: false,
    responsive: true,
    attributes: false,
  });

  const toggleSection = (s: string) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  const props = node.props || {};
  const baseStyles = node.styles?.base || {};
  const responsiveStyles = node.styles?.responsive || {};
  const visibility = node.visibility || { desktop: true, tablet: true, mobile: true };
  const behaviors: BehaviorConfig = node.behaviors || {};

  // Resolve current active styles based on breakpoint
  const getCurrentStyleValue = (key: string): any => {
    if (activeDevice === "desktop") {
      return baseStyles[key];
    }
    const devOverrides = (responsiveStyles[activeDevice] as Record<string, unknown>) || {};
    return devOverrides[key] !== undefined ? devOverrides[key] : baseStyles[key];
  };

  const updateStyle = (key: string, value: unknown) => {
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

  const updateMargin = (vals: { top: string; right: string; bottom: string; left: string }) => {
    updateMultipleStyles({
      marginTop: vals.top,
      marginRight: vals.right,
      marginBottom: vals.bottom,
      marginLeft: vals.left,
      margin: vals.top && vals.top === vals.right && vals.top === vals.bottom && vals.top === vals.left ? vals.top : undefined,
    });
  };

  const updatePadding = (vals: { top: string; right: string; bottom: string; left: string }) => {
    updateMultipleStyles({
      paddingTop: vals.top,
      paddingRight: vals.right,
      paddingBottom: vals.bottom,
      paddingLeft: vals.left,
      padding: vals.top && vals.top === vals.right && vals.top === vals.bottom && vals.top === vals.left ? vals.top : undefined,
    });
  };

  const marginTop = getCurrentStyleValue("marginTop") || "";
  const marginRight = getCurrentStyleValue("marginRight") || "";
  const marginBottom = getCurrentStyleValue("marginBottom") || "";
  const marginLeft = getCurrentStyleValue("marginLeft") || "";

  const paddingTop = getCurrentStyleValue("paddingTop") || "";
  const paddingRight = getCurrentStyleValue("paddingRight") || "";
  const paddingBottom = getCurrentStyleValue("paddingBottom") || "";
  const paddingLeft = getCurrentStyleValue("paddingLeft") || "";

  const width = getCurrentStyleValue("width") || "default";
  const alignSelf = getCurrentStyleValue("alignSelf") || "auto";
  const order = getCurrentStyleValue("order") !== undefined ? String(getCurrentStyleValue("order")) : "0";
  const zIndex = getCurrentStyleValue("zIndex") !== undefined ? String(getCurrentStyleValue("zIndex")) : "";
  const position = getCurrentStyleValue("position") || "static";

  return (
    <div className="space-y-3 pb-8 text-xs text-slate-300">
      {/* SECTION 1: LAYOUT (Margin, Padding, Width, Align Self, Order, Z-Index) */}
      <div className="border border-slate-800 rounded-lg overflow-visible bg-slate-900/50">
        <button
          type="button"
          onClick={() => toggleSection("layout")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.layout ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Layout
          </span>
        </button>

        {openSections.layout && (
          <div className="p-3 space-y-4">
            {/* Margin 4-box */}
            <DimensionsInput
              label="Margin"
              activeDevice={activeDevice}
              onSelectDevice={setActiveDevice}
              top={marginTop}
              right={marginRight}
              bottom={marginBottom}
              left={marginLeft}
              onChange={updateMargin}
              hasTabletOverride={!!(responsiveStyles.tablet && (responsiveStyles.tablet as any).marginTop)}
              hasMobileOverride={!!(responsiveStyles.mobile && (responsiveStyles.mobile as any).marginTop)}
            />

            {/* Padding 4-box */}
            <div className="border-t border-slate-800/60 pt-3">
              <DimensionsInput
                label="Padding"
                activeDevice={activeDevice}
                onSelectDevice={setActiveDevice}
                top={paddingTop}
                right={paddingRight}
                bottom={paddingBottom}
                left={paddingLeft}
                onChange={updatePadding}
                hasTabletOverride={!!(responsiveStyles.tablet && (responsiveStyles.tablet as any).paddingTop)}
                hasMobileOverride={!!(responsiveStyles.mobile && (responsiveStyles.mobile as any).paddingTop)}
              />
            </div>

            {/* Width Dropdown */}
            <div className="border-t border-slate-800/60 pt-3 space-y-1">
              <ResponsiveControlHeader
                label="Width"
                activeDevice={activeDevice}
                onSelectDevice={setActiveDevice}
              />
              <select
                value={width}
                onChange={(e) => updateStyle("width", e.target.value === "default" ? undefined : e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="default">Default</option>
                <option value="100%">Full Width (100%)</option>
                <option value="auto">Inline (Auto)</option>
                <option value="50%">Half Width (50%)</option>
                <option value="33.333%">One Third (33.3%)</option>
                <option value="25%">One Fourth (25%)</option>
              </select>
            </div>

            {/* Align Self */}
            <div className="border-t border-slate-800/60 pt-3 space-y-1">
              <ResponsiveControlHeader
                label="Align Self"
                activeDevice={activeDevice}
                onSelectDevice={setActiveDevice}
              />
              <div className="grid grid-cols-5 gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-center">
                {[
                  { id: "auto", label: "Auto" },
                  { id: "flex-start", label: "Start" },
                  { id: "center", label: "Center" },
                  { id: "flex-end", label: "End" },
                  { id: "stretch", label: "Stretch" },
                ].map((item) => {
                  const active = alignSelf === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateStyle("alignSelf", item.id === "auto" ? undefined : item.id)}
                      className={cn(
                        "py-1 rounded text-[10px] font-medium transition",
                        active ? "bg-slate-800 text-white shadow-xs font-bold" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order */}
            <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
              <ResponsiveControlHeader
                label="Order"
                activeDevice={activeDevice}
                onSelectDevice={setActiveDevice}
              />
              <input
                type="number"
                value={order}
                onChange={(e) => updateStyle("order", Number(e.target.value))}
                placeholder="0"
                className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono text-center"
              />
            </div>

            {/* Z-Index */}
            <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">Z-Index</span>
              <input
                type="number"
                value={zIndex}
                onChange={(e) => updateStyle("zIndex", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Auto"
                className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono text-center"
              />
            </div>

            {/* Position */}
            <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">Position</span>
              <select
                value={position}
                onChange={(e) => updateStyle("position", e.target.value === "static" ? undefined : e.target.value)}
                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="static">Default</option>
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
                <option value="fixed">Fixed</option>
                <option value="sticky">Sticky</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: RESPONSIVE VISIBILITY */}
      <div className="border border-slate-800 rounded-lg overflow-visible bg-slate-900/50">
        <button
          type="button"
          onClick={() => toggleSection("responsive")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.responsive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Responsive Visibility
          </span>
        </button>

        {openSections.responsive && (
          <div className="p-3 space-y-2.5">
            {[
              { key: "desktop", label: "Hide On Desktop" },
              { key: "tablet", label: "Hide On Tablet" },
              { key: "mobile", label: "Hide On Mobile" },
            ].map((d) => {
              const isHidden = visibility[d.key as keyof typeof visibility] === false;
              return (
                <div key={d.key} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                  <span className="text-[11px] text-slate-300">{d.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeNode({
                        ...node,
                        visibility: {
                          ...visibility,
                          [d.key]: !isHidden ? false : true,
                        },
                      });
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1",
                      isHidden
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                    )}
                  >
                    {isHidden ? <EyeOff className="w-3 h-3 text-rose-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                    <span>{isHidden ? "Hidden" : "Visible"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: MOTION EFFECTS */}
      <div className="border border-slate-800 rounded-lg overflow-visible bg-slate-900/50">
        <button
          type="button"
          onClick={() => toggleSection("motion")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.motion ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Motion Effects
          </span>
        </button>

        {openSections.motion && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">Entrance Animation</span>
              <select
                value={behaviors.entrance?.type || "none"}
                onChange={(e) => {
                  onChangeNode({
                    ...node,
                    behaviors: {
                      ...behaviors,
                      entrance: e.target.value === "none" ? undefined : { type: e.target.value as any, durationMs: 500, delayMs: 0, easing: "ease-out" },
                    },
                  });
                }}
                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="none">None</option>
                <option value="fade-in">Fade In</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="scale-in">Scale In</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ATTRIBUTES & CUSTOM CSS */}
      <div className="border border-slate-800 rounded-lg overflow-visible bg-slate-900/50">
        <button
          type="button"
          onClick={() => toggleSection("attributes")}
          className="w-full px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800 hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.attributes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Attributes & CSS ID
          </span>
        </button>

        {openSections.attributes && (
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-400" /> CSS ID (Anchor)
              </span>
              <input
                type="text"
                value={(props.anchorId as string) || ""}
                onChange={(e) => onChangeNode({ ...node, props: { ...props, anchorId: e.target.value } })}
                placeholder="e.g. contact-section"
                className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium">CSS Classes</span>
              <input
                type="text"
                value={(props.customClasses as string) || ""}
                onChange={(e) => onChangeNode({ ...node, props: { ...props, customClasses: e.target.value } })}
                placeholder="e.g. shadow-lg rounded-2xl"
                className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
