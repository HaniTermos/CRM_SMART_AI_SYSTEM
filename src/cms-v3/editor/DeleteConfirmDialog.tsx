/**
 * SmartStore Website Studio (CMS V3) — Delete Confirmation Dialog
 * Shows clear warning with descendant element count before destructive tree removals
 */

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { PageNode } from "../types/cms-v3";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  node: PageNode | null;
  descendantCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  node,
  descendantCount,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen || !node) return null;

  const nodeName =
    (node.props?.title as string) ||
    (node.props?.label as string) ||
    node.component ||
    node.kind;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="font-bold text-sm text-slate-100">
              Delete "{nodeName}"?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This node contains{" "}
              <span className="font-bold text-rose-400">
                {descendantCount} nested {descendantCount === 1 ? "element" : "elements"}
              </span>
              . Deleting it will permanently remove the entire subtree from your canvas.
            </p>
            <p className="text-[11px] text-slate-500">
              Tip: You can use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+Z</kbd> to undo this action.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Tree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
