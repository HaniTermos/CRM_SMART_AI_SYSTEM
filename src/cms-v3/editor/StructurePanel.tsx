/**
 * SmartStore Website Studio (CMS V3) — Floating Structure / Layers Panel
 * Reproduces Elementor's floating Structure window (Screenshot 1)
 */

import React, { useState } from "react";
import {
  Layers,
  X,
  ChevronRight,
  ChevronDown,
  Copy,
  Trash2,
  GripVertical,
  Search,
  Maximize2,
  FolderTree,
  EyeOff,
} from "lucide-react";
import { PageDocument, PageNode } from "../types/cms-v3";
import { isNodeVisible } from "../renderer/visibility";
import { cn } from "@/lib/utils";
import { useDragDrop } from "./drag-drop/dragContext";

interface StructurePanelProps {
  isOpen: boolean;
  onClose: () => void;
  document: PageDocument | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  expandedNodes: Record<string, boolean>;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onRequestDeleteNode: (id: string) => void;
  activeDevice?: "desktop" | "tablet" | "mobile";
}

export function StructurePanel({
  isOpen,
  onClose,
  document: doc,
  selectedNodeId,
  hoveredNodeId,
  expandedNodes,
  onSelectNode,
  onHoverNode,
  onToggleExpand,
  onDuplicateNode,
  onRequestDeleteNode,
  activeDevice = "desktop",
}: StructurePanelProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const { startDrag, endDrag, updateDropTarget, clearDropTarget, draggedItem, dropTarget } = useDragDrop();

  if (!isOpen || !doc) return null;

  const renderTreeItem = (nodeId: string, depth = 0): React.ReactNode => {
    if (!doc.nodes || !doc.nodes[nodeId]) return null;
    const node = doc.nodes[nodeId];
    const isSelected = selectedNodeId === node.id;
    const isHovered = hoveredNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? true;
    const isDropTargetNode = dropTarget?.targetNodeId === node.id;

    const nodeName =
      (node.props?.title as string) ||
      (node.props?.label as string) ||
      (node.props?.content as string) ||
      node.component ||
      node.kind;

    if (searchFilter.trim() && !nodeName.toLowerCase().includes(searchFilter.toLowerCase())) {
      const hasMatchingChild = (node.children || []).some((cId) => {
        const cNode = doc.nodes[cId];
        const cName = (cNode?.props?.title as string) || (cNode?.props?.label as string) || (cNode?.props?.content as string) || cNode?.component || "";
        return cName.toLowerCase().includes(searchFilter.toLowerCase());
      });
      if (!hasMatchingChild) return null;
    }

    return (
      <div key={node.id} className="space-y-0.5 select-none relative text-xs">
        {isDropTargetNode && dropTarget?.position === "before" && (
          <div className="h-1 bg-cyan-400 rounded-full my-0.5 shadow-[0_0_6px_#22d3ee]" />
        )}

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", node.id);
            startDrag({
              type: "existing_node",
              nodeId: node.id,
              title: nodeName,
            });
          }}
          onDragEnd={() => endDrag()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedItem?.nodeId !== node.id) {
              const rect = e.currentTarget.getBoundingClientRect();
              const relY = e.clientY - rect.top;
              const pos = relY < rect.height * 0.3 ? "before" : relY > rect.height * 0.7 ? "after" : "inside";
              updateDropTarget(node.id, pos);
            }
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            clearDropTarget();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(node.id);
          }}
          onMouseEnter={() => onHoverNode(node.id)}
          onMouseLeave={() => onHoverNode(null)}
          style={{ paddingLeft: `${Math.max(depth * 12 + 6, 6)}px` }}
          className={cn(
            "group flex items-center justify-between py-1.5 pr-2 rounded-md transition cursor-grab active:cursor-grabbing",
            isSelected
              ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-xs font-semibold"
              : isHovered
              ? "bg-slate-800 text-slate-200"
              : "text-slate-400 hover:bg-slate-850 hover:text-slate-200",
            isDropTargetNode && dropTarget?.position === "inside" && "bg-cyan-500/20 border border-cyan-400"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(node.id);
                }}
                className="p-0.5 rounded hover:bg-slate-700 text-slate-400"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <div className="w-3" />
            )}

            <span className="capitalize text-slate-200 truncate text-[11px]">
              {nodeName}
            </span>
            {!isNodeVisible(node, activeDevice) && (
              <span title={`Hidden on ${activeDevice}`}>
                <EyeOff className="w-3 h-3 text-rose-400 shrink-0" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[8px] text-slate-500 font-mono uppercase bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
              {node.component || node.kind}
            </span>

            {/* Hover Actions */}
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateNode(node.id);
                }}
                className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
              {node.id !== doc.rootNodeId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDeleteNode(node.id);
                  }}
                  className="p-0.5 rounded hover:bg-rose-600/80 text-rose-400 hover:text-white"
                  title="Delete (Del)"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {isDropTargetNode && dropTarget?.position === "after" && (
          <div className="h-1 bg-cyan-400 rounded-full my-0.5 shadow-[0_0_6px_#22d3ee]" />
        )}

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((childId) => renderTreeItem(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed right-6 top-16 z-50 w-72 max-h-[calc(100vh-100px)] bg-slate-900/95 backdrop-blur-md border border-slate-750 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Structure Header */}
      <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
          <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
          <span>Structure</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/40 shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search structure..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-7 pr-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="p-2 overflow-y-auto flex-1 space-y-0.5 min-h-0">
        {doc.rootNodeId && renderTreeItem(doc.rootNodeId)}
      </div>
    </div>
  );
}
