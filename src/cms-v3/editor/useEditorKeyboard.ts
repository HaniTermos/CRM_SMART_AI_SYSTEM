/**
 * SmartStore Website Studio (CMS V3) — Global Editor Keyboard Shortcuts Engine
 * Handles Elementor/Webflow/Framer standard shortcuts: Del, Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Ctrl+D, Esc, Arrows
 * Full protection for text inputs, textareas, number fields, select dropdowns, and AI prompt bars.
 */

import { useEffect } from "react";

interface UseEditorKeyboardProps {
  selectedNodeId: string | null;
  onDelete: (nodeId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: (nodeId: string) => void;
  onPaste: (targetParentId?: string) => void;
  onDuplicate: (nodeId: string) => void;
  onDeselect: () => void;
  onMoveUp?: (nodeId: string) => void;
  onMoveDown?: (nodeId: string) => void;
}

export function useEditorKeyboard({
  selectedNodeId,
  onDelete,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDeselect,
  onMoveUp,
  onMoveDown,
}: UseEditorKeyboardProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check if user is currently typing in an input, textarea, select, or contentEditable element
      const activeElement = document.activeElement as HTMLElement | null;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable ||
          activeElement.getAttribute("role") === "textbox" ||
          activeElement.closest("input, textarea, select, [contenteditable='true']"));

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 1. Undo / Redo
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === "z") {
        if (!isTyping) {
          e.preventDefault();
          onUndo();
          return;
        }
      }
      if (
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z") ||
        (cmdOrCtrl && e.key.toLowerCase() === "y")
      ) {
        if (!isTyping) {
          e.preventDefault();
          onRedo();
          return;
        }
      }

      // If active in text input or inspector, suppress canvas keyboard shortcuts to protect user typing
      if (isTyping) return;

      // 2. Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          e.preventDefault();
          onDelete(selectedNodeId);
        }
        return;
      }

      // 3. Duplicate (Ctrl+D / Cmd+D)
      if (cmdOrCtrl && e.key.toLowerCase() === "d") {
        if (selectedNodeId) {
          e.preventDefault();
          onDuplicate(selectedNodeId);
        }
        return;
      }

      // 4. Copy (Ctrl+C / Cmd+C)
      if (cmdOrCtrl && e.key.toLowerCase() === "c") {
        if (selectedNodeId) {
          e.preventDefault();
          onCopy(selectedNodeId);
        }
        return;
      }

      // 5. Paste (Ctrl+V / Cmd+V)
      if (cmdOrCtrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        onPaste(selectedNodeId || undefined);
        return;
      }

      // 6. Deselect on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        onDeselect();
        return;
      }

      // 7. Arrow Move Up / Down with Shift or Alt
      if (selectedNodeId && (e.altKey || e.shiftKey)) {
        if (e.key === "ArrowUp" && onMoveUp) {
          e.preventDefault();
          onMoveUp(selectedNodeId);
        } else if (e.key === "ArrowDown" && onMoveDown) {
          e.preventDefault();
          onMoveDown(selectedNodeId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNodeId,
    onDelete,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onDeselect,
    onMoveUp,
    onMoveDown,
  ]);
}
