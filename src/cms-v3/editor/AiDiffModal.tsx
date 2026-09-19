/**
 * SmartStore Website Studio (CMS V3) — Visual AI Diff Review Modal
 * Reviews proposed AiOperations with visual diffs, checkboxes, and apply controls
 */

import React, { useState } from "react";
import { Sparkles, X, Plus, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { AiOperation, PageDocument } from "../types/cms-v3";
import { cn } from "@/lib/utils";

interface AiDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  operations: AiOperation[];
  onApplyOperations: (selectedOps: AiOperation[]) => void;
}

export function AiDiffModal({ isOpen, onClose, prompt, operations, onApplyOperations }: AiDiffModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(operations.map((_, i) => i));

  if (!isOpen) return null;

  const toggleIndex = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const handleApply = () => {
    const selectedOps = operations.filter((_, idx) => selectedIndices.includes(idx));
    onApplyOperations(selectedOps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-200">AI Proposed Changes</h3>
              <p className="text-[11px] text-slate-400">Review operations before applying to draft</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Prompt Banner */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 text-xs text-indigo-300 flex items-center gap-2">
          <span className="font-bold text-slate-400">Prompt:</span>
          <span>"{prompt}"</span>
        </div>

        {/* Diff Items List */}
        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
          {operations.map((op, idx) => {
            const isChecked = selectedIndices.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleIndex(idx)}
                className={cn(
                  "p-3 rounded-xl border transition cursor-pointer flex items-start gap-3",
                  isChecked
                    ? "bg-indigo-950/20 border-indigo-500/40 text-slate-200"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleIndex(idx)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600"
                />

                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {op.type === "add_node" && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                        <Plus className="w-3 h-3" /> ADD {op.component.toUpperCase()}
                      </span>
                    )}
                    {op.type === "update_content" && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> UPDATE CONTENT
                      </span>
                    )}
                    {op.type === "update_behaviors" && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> UPDATE MOTION
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-200">
                    {op.type === "add_node"
                      ? `Insert new ${op.component} section into document root`
                      : `Modify content & props for node #${(op as any).nodeId || "target"}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selectedIndices.length} of {operations.length} operations selected
          </span>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">
              Discard All
            </button>
            <button
              onClick={handleApply}
              disabled={selectedIndices.length === 0}
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
            >
              <span>Apply Selected Changes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
