/**
 * SmartStore Website Studio (CMS V3) — Layout Inspector Tab
 * Comprehensive controls for Display (Block/Flex/Grid), Alignment, Flex Direction, Wrap, Width, Height, and Overflow
 */

import React from "react";
import { PageNode } from "../../types/cms-v3";
import {
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize2,
  Minimize2,
  Columns,
  Rows,
  WrapText,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutTabProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function LayoutTab({ node, onChangeNode }: LayoutTabProps) {
  const styles = node.styles?.base || {};

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

  const display = (styles.display as string) || (node.kind === "container" ? "flex" : "block");
  const flexDirection = (styles.flexDirection as string) || "column";
  const justifyContent = (styles.justifyContent as string) || "flex-start";
  const alignItems = (styles.alignItems as string) || "stretch";
  const flexWrap = (styles.flexWrap as string) || "nowrap";
  const gap = (styles.gap as string) || "";
  const width = (styles.width as string) || "auto";
  const maxWidth = (styles.maxWidth as string) || "";
  const minHeight = (styles.minHeight as string) || "";
  const overflow = (styles.overflow as string) || "visible";

  return (
    <div className="p-4 space-y-6 text-xs text-slate-300">
      {/* 1. Display Mode */}
      <div className="space-y-2">
        <label className="font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-indigo-400" /> Display Mode
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{display}</span>
        </label>
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {[
            { id: "block", label: "Block" },
            { id: "flex", label: "Flex" },
            { id: "grid", label: "Grid" },
            { id: "inline-block", label: "Inline" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => updateStyle("display", d.id)}
              className={cn(
                "py-1.5 rounded text-[11px] font-semibold transition text-center",
                display === d.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Flexbox Controls (if display is flex or container) */}
      {(display === "flex" || node.kind === "container" || node.component === "flex-container") && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          {/* Direction */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Direction</span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {[
                { id: "row", label: "Row →", icon: MoveHorizontal },
                { id: "column", label: "Col ↓", icon: MoveVertical },
                { id: "row-reverse", label: "Row ←" },
                { id: "column-reverse", label: "Col ↑" },
              ].map((dir) => (
                <button
                  key={dir.id}
                  onClick={() => updateStyle("flexDirection", dir.id)}
                  className={cn(
                    "py-1.5 rounded text-[10px] font-semibold transition text-center",
                    flexDirection === dir.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </div>

          {/* Justify Content */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Justify Content (Main Axis)</span>
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {[
                { id: "flex-start", label: "Start", icon: AlignLeft },
                { id: "center", label: "Center", icon: AlignCenter },
                { id: "flex-end", label: "End", icon: AlignRight },
                { id: "space-between", label: "Between", icon: AlignJustify },
                { id: "space-around", label: "Around" },
              ].map((j) => (
                <button
                  key={j.id}
                  onClick={() => updateStyle("justifyContent", j.id)}
                  className={cn(
                    "py-1.5 rounded text-[10px] font-semibold transition text-center truncate",
                    justifyContent === j.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                  title={j.id}
                >
                  {j.label}
                </button>
              ))}
            </div>
          </div>

          {/* Align Items */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Align Items (Cross Axis)</span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {[
                { id: "flex-start", label: "Start" },
                { id: "center", label: "Center" },
                { id: "flex-end", label: "End" },
                { id: "stretch", label: "Stretch" },
              ].map((a) => (
                <button
                  key={a.id}
                  onClick={() => updateStyle("alignItems", a.id)}
                  className={cn(
                    "py-1.5 rounded text-[10px] font-semibold transition text-center",
                    alignItems === a.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wrap & Gap */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-400">Flex Wrap</span>
              <select
                value={flexWrap}
                onChange={(e) => updateStyle("flexWrap", e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="nowrap">No Wrap</option>
                <option value="wrap">Wrap</option>
                <option value="wrap-reverse">Wrap Reverse</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400">Gap (Spacing)</span>
              <input
                type="text"
                value={gap}
                onChange={(e) => updateStyle("gap", e.target.value)}
                placeholder="e.g. 1.5rem / 24px"
                className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Grid Controls (if display is grid) */}
      {(display === "grid" || node.component === "grid-container") && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-400">Grid Columns</span>
              <select
                value={Number(styles.columns) || 3}
                onChange={(e) => updateStyle("columns", Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
                <option value={6}>6 Columns</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400">Grid Gap</span>
              <input
                type="text"
                value={gap}
                onChange={(e) => updateStyle("gap", e.target.value)}
                placeholder="e.g. 2rem / 32px"
                className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Sizing Dimensions */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Sizing & Dimensions
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400">Width</span>
            <input
              type="text"
              value={width}
              onChange={(e) => updateStyle("width", e.target.value)}
              placeholder="auto, 100%, 300px"
              className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Max Width</span>
            <input
              type="text"
              value={maxWidth}
              onChange={(e) => updateStyle("maxWidth", e.target.value)}
              placeholder="e.g. 1200px, 100%"
              className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400">Min Height</span>
            <input
              type="text"
              value={minHeight}
              onChange={(e) => updateStyle("minHeight", e.target.value)}
              placeholder="e.g. 300px, 80vh"
              className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Overflow</span>
            <select
              value={overflow}
              onChange={(e) => updateStyle("overflow", e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="visible">Visible</option>
              <option value="hidden">Hidden (Crop)</option>
              <option value="scroll">Scroll</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
