/**
 * SmartStore Website Studio (CMS V3) — CollectionList & Dynamic Loop Builder Component
 */

import React, { useState, useEffect } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { Layers, ArrowRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  field_data?: Record<string, unknown>;
}

interface CollectionListSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function CollectionListSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: CollectionListSectionProps) {
  const props = node.props || {};
  const collectionName = (props.collectionName as string) || "Blog Posts";
  const columns = Number(props.columns || 3);

  const [items, setItems] = useState<CollectionItem[]>([
    { id: "1", title: "Sourdough Fermentation Guide", slug: "sourdough-guide", field_data: { excerpt: "Secrets behind long fermentation crust and airy crumb." } },
    { id: "2", title: "Specialty Coffee Roasting Notes", slug: "coffee-notes", field_data: { excerpt: "Understanding bean origins and roasting profiles." } },
    { id: "3", title: "Seasonal Farm Table Menu", slug: "seasonal-menu", field_data: { excerpt: "Fresh local organic ingredients served daily." } },
  ]);

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-collection-list max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-8",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 rounded-2xl"
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5" /> CMS Collection
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">{collectionName}</h2>
        </div>
      </div>

      <div className={cn("grid gap-6", columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
            <h3 className="font-extrabold text-base text-slate-900">{item.title}</h3>
            {Boolean(item.field_data?.excerpt) && (
              <p className="text-xs text-slate-600 leading-relaxed">{String(item.field_data?.excerpt)}</p>
            )}
            <div className="pt-2 flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-500 gap-1 cursor-pointer">
              <span>Read Article</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CollectionListInspector({ node, onChangeNode }: { node: PageNode; onChangeNode: (node: PageNode) => void }) {
  const props = node.props || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-indigo-400" /> CMS Collection Loop Builder
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Collection Title</span>
        <input
          type="text"
          value={(props.collectionName as string) || "Blog Posts"}
          onChange={(e) => updateProp("collectionName", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Columns Layout</span>
        <select
          value={String(props.columns || 3)}
          onChange={(e) => updateProp("columns", parseInt(e.target.value) || 3)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="2">2 Columns</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </select>
      </div>
    </div>
  );
}
