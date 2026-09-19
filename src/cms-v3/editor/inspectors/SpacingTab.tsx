/**
 * SmartStore Website Studio (CMS V3) — Spacing Inspector Tab
 * Visual 2D Box Model diagram (Margin & Padding) with concentric interactive inputs & link/unlink controls
 */

import React, { useState } from "react";
import { PageNode } from "../../types/cms-v3";
import { Move, Link2, Unlink, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpacingTabProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function SpacingTab({ node, onChangeNode }: SpacingTabProps) {
  const styles = node.styles?.base || {};
  const [linkMargin, setLinkMargin] = useState(false);
  const [linkPadding, setLinkPadding] = useState(false);

  const updateStyle = (key: string, value: unknown) => {
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
  };

  const updateAllMargins = (val: string) => {
    onChangeNode({
      ...node,
      styles: {
        ...node.styles,
        base: {
          ...(node.styles?.base || {}),
          marginTop: val,
          marginRight: val,
          marginBottom: val,
          marginLeft: val,
          margin: val,
        },
      },
    });
  };

  const updateAllPaddings = (val: string) => {
    onChangeNode({
      ...node,
      styles: {
        ...node.styles,
        base: {
          ...(node.styles?.base || {}),
          paddingTop: val,
          paddingRight: val,
          paddingBottom: val,
          paddingLeft: val,
          padding: val,
        },
      },
    });
  };

  const marginTop = (styles.marginTop as string) || (styles.margin as string) || "0";
  const marginRight = (styles.marginRight as string) || (styles.margin as string) || "0";
  const marginBottom = (styles.marginBottom as string) || (styles.margin as string) || "0";
  const marginLeft = (styles.marginLeft as string) || (styles.margin as string) || "0";

  const paddingTop = (styles.paddingTop as string) || (styles.paddingY as string) || (styles.padding as string) || "0";
  const paddingRight = (styles.paddingRight as string) || (styles.paddingX as string) || (styles.padding as string) || "0";
  const paddingBottom = (styles.paddingBottom as string) || (styles.paddingY as string) || (styles.padding as string) || "0";
  const paddingLeft = (styles.paddingLeft as string) || (styles.paddingX as string) || (styles.padding as string) || "0";

  return (
    <div className="p-4 space-y-6 text-xs text-slate-300">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-indigo-400" /> Visual Box Model
        </label>
        <span className="text-[10px] text-slate-500 font-mono">px / rem / %</span>
      </div>

      {/* Visual 2D Box Diagram */}
      <div className="relative p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 shadow-inner">
        {/* Margin Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">Margin (Outer)</span>
          <button
            onClick={() => setLinkMargin(!linkMargin)}
            className="text-[10px] flex items-center gap-1 text-amber-400 hover:text-amber-200"
            title={linkMargin ? "Unlink sides" : "Link all 4 sides"}
          >
            {linkMargin ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
            <span>{linkMargin ? "Linked" : "Independent"}</span>
          </button>
        </div>

        {/* Margin Top */}
        <div className="flex justify-center mb-1">
          <input
            type="text"
            value={marginTop}
            onChange={(e) => linkMargin ? updateAllMargins(e.target.value) : updateStyle("marginTop", e.target.value)}
            placeholder="0"
            className="w-16 text-center py-0.5 rounded bg-slate-950 border border-amber-500/40 text-amber-200 text-[11px] font-mono"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Margin Left */}
          <input
            type="text"
            value={marginLeft}
            onChange={(e) => linkMargin ? updateAllMargins(e.target.value) : updateStyle("marginLeft", e.target.value)}
            placeholder="0"
            className="w-14 text-center py-0.5 rounded bg-slate-950 border border-amber-500/40 text-amber-200 text-[11px] font-mono"
          />

          {/* Nested Padding Box */}
          <div className="flex-1 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-indigo-300">
            {/* Padding Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/80">Padding (Inner)</span>
              <button
                onClick={() => setLinkPadding(!linkPadding)}
                className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-200"
                title={linkPadding ? "Unlink sides" : "Link all 4 sides"}
              >
                {linkPadding ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
              </button>
            </div>

            {/* Padding Top */}
            <div className="flex justify-center mb-1">
              <input
                type="text"
                value={paddingTop}
                onChange={(e) => linkPadding ? updateAllPaddings(e.target.value) : updateStyle("paddingTop", e.target.value)}
                placeholder="0"
                className="w-14 text-center py-0.5 rounded bg-slate-950 border border-indigo-500/50 text-indigo-200 text-[11px] font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-1.5">
              {/* Padding Left */}
              <input
                type="text"
                value={paddingLeft}
                onChange={(e) => linkPadding ? updateAllPaddings(e.target.value) : updateStyle("paddingLeft", e.target.value)}
                placeholder="0"
                className="w-12 text-center py-0.5 rounded bg-slate-950 border border-indigo-500/50 text-indigo-200 text-[11px] font-mono"
              />

              {/* Element Core */}
              <div className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 text-center uppercase tracking-wider truncate">
                {node.component || node.kind}
              </div>

              {/* Padding Right */}
              <input
                type="text"
                value={paddingRight}
                onChange={(e) => linkPadding ? updateAllPaddings(e.target.value) : updateStyle("paddingRight", e.target.value)}
                placeholder="0"
                className="w-12 text-center py-0.5 rounded bg-slate-950 border border-indigo-500/50 text-indigo-200 text-[11px] font-mono"
              />
            </div>

            {/* Padding Bottom */}
            <div className="flex justify-center mt-1">
              <input
                type="text"
                value={paddingBottom}
                onChange={(e) => linkPadding ? updateAllPaddings(e.target.value) : updateStyle("paddingBottom", e.target.value)}
                placeholder="0"
                className="w-14 text-center py-0.5 rounded bg-slate-950 border border-indigo-500/50 text-indigo-200 text-[11px] font-mono"
              />
            </div>
          </div>

          {/* Margin Right */}
          <input
            type="text"
            value={marginRight}
            onChange={(e) => linkMargin ? updateAllMargins(e.target.value) : updateStyle("marginRight", e.target.value)}
            placeholder="0"
            className="w-14 text-center py-0.5 rounded bg-slate-950 border border-amber-500/40 text-amber-200 text-[11px] font-mono"
          />
        </div>

        {/* Margin Bottom */}
        <div className="flex justify-center mt-1">
          <input
            type="text"
            value={marginBottom}
            onChange={(e) => linkMargin ? updateAllMargins(e.target.value) : updateStyle("marginBottom", e.target.value)}
            placeholder="0"
            className="w-16 text-center py-0.5 rounded bg-slate-950 border border-amber-500/40 text-amber-200 text-[11px] font-mono"
          />
        </div>
      </div>

      {/* Quick Spacing Presets */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <span className="text-[11px] font-semibold text-slate-400">Quick Section Padding Presets</span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "None", val: "0" },
            { label: "Compact", val: "1.5rem 1rem" },
            { label: "Standard", val: "3rem 1.5rem" },
            { label: "Spacious", val: "6rem 2rem" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => updateStyle("padding", preset.val)}
              className="py-1 px-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 transition text-center"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
