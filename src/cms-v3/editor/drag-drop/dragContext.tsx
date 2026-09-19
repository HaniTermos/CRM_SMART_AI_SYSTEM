/**
 * SmartStore Website Studio (CMS V3) — Drag & Drop Context & Position Resolver
 * Handles dragging new elements from Drawer or existing nodes on Canvas/Navigator,
 * calculating drop zones (before / after / inside) with live insertion coordinates.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type DragItemType = "new_component" | "existing_node";

export interface DraggedItem {
  type: DragItemType;
  componentKey?: string;
  nodeId?: string;
  title?: string;
  initialProps?: Record<string, unknown>;
  initialStyles?: Record<string, unknown>;
}

export type DropPosition = "before" | "after" | "inside";

export interface DropTarget {
  targetNodeId: string;
  position: DropPosition;
}

interface DragContextValue {
  draggedItem: DraggedItem | null;
  dropTarget: DropTarget | null;
  isDragging: boolean;
  startDrag: (item: DraggedItem) => void;
  updateDropTarget: (targetNodeId: string, position: DropPosition) => void;
  clearDropTarget: () => void;
  endDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const dropTargetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startDrag = useCallback((item: DraggedItem) => {
    setDraggedItem(item);
    setDropTarget(null);
  }, []);

  const updateDropTarget = useCallback((targetNodeId: string, position: DropPosition) => {
    if (dropTargetTimeoutRef.current) {
      clearTimeout(dropTargetTimeoutRef.current);
    }
    setDropTarget({ targetNodeId, position });
  }, []);

  const clearDropTarget = useCallback(() => {
    if (dropTargetTimeoutRef.current) {
      clearTimeout(dropTargetTimeoutRef.current);
    }
    dropTargetTimeoutRef.current = setTimeout(() => {
      setDropTarget(null);
    }, 150);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  return (
    <DragContext.Provider
      value={{
        draggedItem,
        dropTarget,
        isDragging: !!draggedItem,
        startDrag,
        updateDropTarget,
        clearDropTarget,
        endDrag,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDragDrop() {
  const ctx = useContext(DragContext);
  if (!ctx) {
    throw new Error("useDragDrop must be used within a DragProvider");
  }
  return ctx;
}
