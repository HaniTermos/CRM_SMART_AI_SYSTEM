/**
 * SmartStore Website Studio (CMS V3) — Hero Inspector Component
 * Real V3 document node editor controls for content, style, responsive, and behaviors
 */

import React from "react";
import { PageNode, BehaviorConfig } from "../types/cms-v3";
import { Layout, Type, Palette, Activity, Layers, Sparkles } from "lucide-react";

interface HeroInspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
  onDecomposeNode?: (id: string) => void;
}

export function HeroInspector({ node, onChangeNode, onDecomposeNode }: HeroInspectorProps) {
  const props = node.props || {};
  const styles = node.styles?.base || {};
  const behaviors: BehaviorConfig = node.behaviors || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: {
        ...node.props,
        [key]: value
      }
    });
  };

  const updateStyle = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      styles: {
        ...node.styles,
        base: {
          ...(node.styles?.base || {}),
          [key]: value
        }
      }
    });
  };

  const updateEntrance = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      behaviors: {
        ...behaviors,
        entrance: {
          type: 'slide-up',
          durationMs: 600,
          delayMs: 100,
          easing: 'ease-out',
          ...(behaviors.entrance || {}),
          [key]: value
        }
      }
    });
  };

  return (
    <div className="p-3.5 space-y-4 text-xs text-slate-300">
      {/* 1-Click Modular Decomposition Card */}
      {onDecomposeNode && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modular Editable Elements</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Convert this section into individual editable components (Heading, Text, Buttons, Image) to edit or style each one separately on the canvas.
          </p>
          <button
            onClick={() => onDecomposeNode(node.id)}
            className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3 h-3" />
            <span>Decompose to Editable Elements</span>
          </button>
        </div>
      )}

      {/* Variant Selector */}
      <div className="space-y-1.5">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-indigo-400" /> Hero Layout Variant
        </label>
        <select
          value={node.variant || "split"}
          onChange={(e) => onChangeNode({ ...node, variant: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
        >
          <option value="split">Split Image & Text (Default)</option>
          <option value="centered-overlay">Centered Overlay Banner</option>
          <option value="split-image-left">Split Image Left</option>
        </select>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Content Controls */}
      <div className="space-y-3">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-indigo-400" /> Hero Content
        </label>

        <div>
          <span className="text-[11px] text-slate-400">Eyebrow Badge</span>
          <input
            type="text"
            value={(props.eyebrow as string) || ""}
            onChange={(e) => updateProp("eyebrow", e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            placeholder="e.g. Welcome to SmartStore"
          />
        </div>

        <div>
          <span className="text-[11px] text-slate-400">Main Title</span>
          <input
            type="text"
            value={(props.title as string) || ""}
            onChange={(e) => updateProp("title", e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          />
        </div>

        <div>
          <span className="text-[11px] text-slate-400">Subtitle / Description</span>
          <textarea
            rows={2}
            value={(props.subtitle as string) || (props.description as string) || ""}
            onChange={(e) => updateProp("subtitle", e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400">Primary CTA Label</span>
            <input
              type="text"
              value={(props.primaryCtaText as string) || ""}
              onChange={(e) => updateProp("primaryCtaText", e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Primary CTA Link</span>
            <input
              type="text"
              value={(props.primaryCtaLink as string) || ""}
              onChange={(e) => updateProp("primaryCtaLink", e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
        </div>

        <div>
          <span className="text-[11px] text-slate-400">Image Asset URL</span>
          <input
            type="text"
            value={(props.imageUrl as string) || ""}
            onChange={(e) => updateProp("imageUrl", e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono text-[11px]"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Styling Controls */}
      <div className="space-y-3">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" /> Section Styling
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400">Vertical Padding</span>
            <input
              type="text"
              value={(styles.paddingY as string) || "4rem"}
              onChange={(e) => updateStyle("paddingY", e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Text Color Scheme</span>
            <select
              value={(props.textColorScheme as string) || "dark"}
              onChange={(e) => updateProp("textColorScheme", e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="dark">Dark Text</option>
              <option value="light">Light Text</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Behavior & Motion Controls */}
      <div className="space-y-3">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" /> Motion & Behaviors
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400">Entrance Animation</span>
            <select
              value={behaviors.entrance?.type || "slide-up"}
              onChange={(e) => updateEntrance("type", e.target.value)}
              className="w-full mt-1 px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="slide-up">Slide Up</option>
              <option value="fade-in">Fade In</option>
              <option value="zoom-in">Zoom In</option>
            </select>
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Duration (ms)</span>
            <input
              type="number"
              min={100}
              max={2000}
              step={50}
              value={behaviors.entrance?.durationMs || 600}
              onChange={(e) => updateEntrance("durationMs", Number(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
        </div>

        <div>
          <span className="text-[11px] text-slate-400">Reduced Motion Mode</span>
          <select
            value={behaviors.reducedMotion || "simplify"}
            onChange={(e) => onChangeNode({ ...node, behaviors: { ...behaviors, reducedMotion: e.target.value as any } })}
            className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          >
            <option value="simplify">Simplify Animations</option>
            <option value="disable">Disable Motion Completely</option>
            <option value="keep">Keep Full Motion</option>
          </select>
        </div>
      </div>
    </div>
  );
}
