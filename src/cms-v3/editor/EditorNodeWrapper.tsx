/**
 * SmartStore Website Studio (CMS V3) — Canvas Node Interactive Wrapper
 * Elementor/Webflow/Framer-grade Drag-and-Drop, Real-time Insertion Indicators (Before / After / Inside),
 * Deepest Hover outlines, Selection rings, Floating contextual action toolbar, and Inline Text Editing.
 */

import React, { useState, useRef, useEffect } from "react";
import { PageNode, RenderContext } from "../types/cms-v3";
import { useDragDrop, DraggedItem, DropPosition } from "./drag-drop/dragContext";
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  CornerLeftUp,
  Plus,
  Edit3,
  Check,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorNodeWrapperProps {
  node: PageNode;
  context: RenderContext;
  children: React.ReactNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onDelete?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onMoveUp?: (nodeId: string) => void;
  onMoveDown?: (nodeId: string) => void;
  onSelectParent?: (nodeId: string) => void;
  onAddChild?: (nodeId: string) => void;
  onUpdateTextContent?: (nodeId: string, newText: string) => void;
  onDropItem?: (item: DraggedItem, targetNodeId: string, position: DropPosition) => void;
}

export function EditorNodeWrapper({
  node,
  context,
  children,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onSelectParent,
  onAddChild,
  onUpdateTextContent,
  onDropItem,
}: EditorNodeWrapperProps) {
  // Pure preview isolation: Never render any wrapper or overlay in preview or public mode
  if (context.mode !== "editor" || context.preview) {
    return <>{children}</>;
  }

  const { draggedItem, dropTarget, isDragging, startDrag, updateDropTarget, clearDropTarget, endDrag } = useDragDrop();

  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineText, setInlineText] = useState("");
  const initialTextRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isTextElement = node.component === "text" || node.component === "heading";
  const isButtonElement = node.component === "button";
  const isContainer =
    node.kind === "container" ||
    node.kind === "section" ||
    node.component === "flex-container" ||
    node.component === "grid-container" ||
    node.component === "section" ||
    node.component === "page";

  const isCurrentDropTarget = dropTarget?.targetNodeId === node.id;
  const dropPosition = isCurrentDropTarget ? dropTarget?.position : null;

  // Handle double click for inline text editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isTextElement || isButtonElement) {
      e.stopPropagation();
      const currentText = isButtonElement
        ? (node.props?.label as string) || ""
        : (node.props?.content as string) || (node.props?.title as string) || "";
      initialTextRef.current = currentText;
      setInlineText(currentText);
      setIsEditingInline(true);
    }
  };

  useEffect(() => {
    if (isEditingInline && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingInline]);

  const handleSaveInline = () => {
    setIsEditingInline(false);
    const trimmed = inlineText.trim();
    if (onUpdateTextContent && trimmed && trimmed !== initialTextRef.current) {
      onUpdateTextContent(node.id, trimmed);
    }
  };

  const handleCancelInline = () => {
    setInlineText(initialTextRef.current);
    setIsEditingInline(false);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveInline();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelInline();
    }
  };

  // Drag over target calculation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!wrapperRef.current || !isDragging) return;

    // Do not allow dropping onto self
    if (draggedItem?.nodeId === node.id) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let pos: DropPosition = "after";

    if (isContainer) {
      if (offsetY < height * 0.2) {
        pos = "before";
      } else if (offsetY > height * 0.8) {
        pos = "after";
      } else {
        pos = "inside";
      }
    } else {
      if (offsetY < height * 0.5) {
        pos = "before";
      } else {
        pos = "after";
      }
    }

    updateDropTarget(node.id, pos);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem && onDropItem && dropPosition) {
      onDropItem(draggedItem, node.id, dropPosition);
    }
    endDrag();
  };

  return (
    <div
      ref={wrapperRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onMouseOver={(e) => {
        e.stopPropagation();
        if (!isDragging) {
          onHover(node.id);
        }
      }}
      onMouseOut={(e) => {
        e.stopPropagation();
        if (!isDragging) {
          onHover(null);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={(e) => {
        e.stopPropagation();
        clearDropTarget();
      }}
      onDrop={handleDrop}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cms-editor-node group relative transition-all duration-150",
        // Hover state
        !isSelected && !isDragging && isHovered && "ring-1 ring-dashed ring-indigo-500/80 ring-offset-1 z-10",
        // Selected state
        isSelected && !isDragging && "ring-2 ring-indigo-600 shadow-sm ring-offset-2 z-20",
        // Drag Target "Inside" state
        isCurrentDropTarget && dropPosition === "inside" && "ring-2 ring-dashed ring-cyan-400 bg-cyan-500/10 z-30"
      )}
    >
      {/* Insertion Indicator: BEFORE (Top cyan glowing bar) */}
      {isCurrentDropTarget && dropPosition === "before" && (
        <div className="absolute -top-1.5 left-0 right-0 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] z-50 pointer-events-none flex items-center justify-between">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 -ml-1 shadow-[0_0_6px_#22d3ee]" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 -mr-1 shadow-[0_0_6px_#22d3ee]" />
        </div>
      )}

      {/* Insertion Indicator: AFTER (Bottom cyan glowing bar) */}
      {isCurrentDropTarget && dropPosition === "after" && (
        <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] z-50 pointer-events-none flex items-center justify-between">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 -ml-1 shadow-[0_0_6px_#22d3ee]" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 -mr-1 shadow-[0_0_6px_#22d3ee]" />
        </div>
      )}

      {/* 1. Deepest Hover Component Pill Badge */}
      {!isSelected && !isDragging && isHovered && (
        <div className="absolute -top-5 left-0 z-30 pointer-events-none px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
          <span>{node.component || node.kind}</span>
        </div>
      )}

      {/* 2. Floating Contextual Action Toolbar (with Drag Handle) */}
      {isSelected && !isEditingInline && !isDragging && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-9 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg shadow-xl px-1.5 py-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap"
        >
          {/* Drag Handle */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", node.id);
              startDrag({
                type: "existing_node",
                nodeId: node.id,
                title: node.component || node.kind,
              });
            }}
            onDragEnd={() => endDrag()}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing mr-0.5"
            title="Drag to move element"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Element Type Pill */}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider mr-1">
            {node.component || node.kind}
          </span>

          {/* Select Parent */}
          {onSelectParent && (
            <button
              onClick={() => onSelectParent(node.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Select Parent Container (↑)"
            >
              <CornerLeftUp className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-px h-3 bg-slate-750" />

          {/* Move Up */}
          {onMoveUp && (
            <button
              onClick={() => onMoveUp(node.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move Down */}
          {onMoveDown && (
            <button
              onClick={() => onMoveDown(node.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-px h-3 bg-slate-750" />

          {/* Add Child (if container) */}
          {isContainer && onAddChild && (
            <button
              onClick={() => onAddChild(node.id)}
              className="p-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition"
              title="Add Component Inside"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate (Ctrl+D) */}
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(node.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete (Del) */}
          {onDelete && (
            <button
              onClick={() => onDelete(node.id)}
              className="p-1 rounded hover:bg-rose-600/80 text-rose-400 hover:text-white transition"
              title="Delete Element (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. Inline Text Editing Input Overlay */}
      {isEditingInline ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-30 p-1 bg-white dark:bg-slate-900 border-2 border-indigo-600 rounded-md shadow-lg min-w-[120px]"
        >
          <input
            ref={inputRef}
            type="text"
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
            onBlur={handleSaveInline}
            onKeyDown={handleInlineKeyDown}
            className="w-full bg-transparent border-none text-slate-900 dark:text-white font-inherit text-inherit focus:outline-none"
          />
          <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between px-1">
            <span>Enter = Save · Esc = Cancel</span>
            <Check className="w-3 h-3 text-emerald-500 cursor-pointer" onClick={handleSaveInline} />
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
