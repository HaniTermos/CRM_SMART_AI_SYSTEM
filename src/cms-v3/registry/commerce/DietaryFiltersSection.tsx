/**
 * SmartStore Website Studio (CMS V3) — Category Accordion & Dietary Filters Components
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DietaryFiltersSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function DietaryFiltersSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: DietaryFiltersSectionProps) {
  const props = node.props || {};
  const [activeTag, setActiveTag] = useState<string>("all");

  const tags = [
    { id: "all", label: "All Items" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten_free", label: "Gluten-Free" },
    { id: "halal", label: "Halal Certified" },
    { id: "nut_free", label: "Nut-Free" },
  ];

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-dietary-filters max-w-5xl mx-auto py-6 px-4 flex items-center justify-center gap-2 flex-wrap my-4",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 rounded-2xl"
      )}
    >
      <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
        <Filter className="w-3.5 h-3.5" /> Dietary Filter:
      </span>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTag(tag.id);
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1",
            activeTag === tag.id
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          )}
        >
          {activeTag === tag.id && <Check className="w-3 h-3 text-emerald-300" />}
          <span>{tag.label}</span>
        </button>
      ))}
    </div>
  );
}

export function DietaryFiltersInspector({ node, onChangeNode }: { node: PageNode; onChangeNode: (node: PageNode) => void }) {
  return (
    <div className="p-4 text-xs text-slate-300 space-y-2">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-indigo-400" /> Dietary Filter Controls
      </label>
      <p className="text-[11px] text-slate-400">Filters store products by verified dietary tags.</p>
    </div>
  );
}
