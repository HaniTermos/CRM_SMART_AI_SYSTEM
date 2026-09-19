/**
 * SmartStore Website Studio (CMS V3) — Flex & Grid Container Inspectors
 */

import React from "react";
import { PageNode } from "../../types/cms-v3";
import { Layout, Palette, Sliders } from "lucide-react";

interface ContainerInspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function FlexContainerInspector({ node, onChangeNode }: ContainerInspectorProps) {
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

  return (
    <div className="p-4 space-y-5 text-xs text-slate-300">
      <div className="space-y-2">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-indigo-400" /> Flex Direction & Stack
        </label>
        <select
          value={(styles.flexDirection as string) || "column"}
          onChange={(e) => updateStyle("flexDirection", e.target.value)}
          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="column">Column (Vertical Stack)</option>
          <option value="row">Row (Horizontal Alignment)</option>
          <option value="column-reverse">Column Reverse</option>
          <option value="row-reverse">Row Reverse</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[11px] text-slate-400">Align Items</span>
          <select
            value={(styles.alignItems as string) || "stretch"}
            onChange={(e) => updateStyle("alignItems", e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          >
            <option value="stretch">Stretch</option>
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
          </select>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Justify Content</span>
          <select
            value={(styles.justifyContent as string) || "flex-start"}
            onChange={(e) => updateStyle("justifyContent", e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          >
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
          </select>
        </div>
      </div>

      <div>
        <span className="text-[11px] text-slate-400">Child Gap Spacing</span>
        <input
          type="text"
          value={(styles.gap as string) || "1.5rem"}
          onChange={(e) => updateStyle("gap", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          placeholder="e.g. 1.5rem or 24px"
        />
      </div>
    </div>
  );
}

export function GridContainerInspector({ node, onChangeNode }: ContainerInspectorProps) {
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

  return (
    <div className="p-4 space-y-5 text-xs text-slate-300">
      <div className="space-y-2">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Grid Columns Count
        </label>
        <select
          value={Number(styles.columns) || 3}
          onChange={(e) => updateStyle("columns", Number(e.target.value))}
          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value={1}>1 Column Stack</option>
          <option value={2}>2 Columns Grid</option>
          <option value={3}>3 Columns Grid (Default)</option>
          <option value={4}>4 Columns Grid</option>
        </select>
      </div>

      <div>
        <span className="text-[11px] text-slate-400">Grid Gap</span>
        <input
          type="text"
          value={(styles.gap as string) || "1.5rem"}
          onChange={(e) => updateStyle("gap", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}
