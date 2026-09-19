/**
 * SmartStore Website Studio (CMS V3) — AI Quality & Audit Panel
 * Real-time SEO, Accessibility, Mobile Layout, and Content Audit Engine
 */

import React, { useState, useEffect } from "react";
import { PageDocument } from "../types/cms-v3";
import { ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, Search, Smartphone, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiAuditPanelProps {
  document: PageDocument | null;
  onApplyFix?: (category: string) => void;
}

export function AiAuditPanel({ document, onApplyFix }: AiAuditPanelProps) {
  const [score, setScore] = useState<number>(95);
  const [findings, setFindings] = useState<any[]>([]);

  useEffect(() => {
    if (!document || !document.nodes) return;

    const newFindings: any[] = [];
    let currentScore = 100;

    const nodes = Object.values(document.nodes);
    const heroNode = nodes.find((n) => n.component === "hero");

    if (!heroNode?.props?.title) {
      newFindings.push({ category: "SEO", severity: "error", message: "Main hero heading (H1) is missing or empty." });
      currentScore -= 20;
    }

    nodes.forEach((n) => {
      if (n.component === "image" && !n.props?.alt) {
        newFindings.push({ category: "Accessibility", severity: "warning", message: `Image node '${n.id}' is missing alt descriptive text.` });
        currentScore -= 10;
      }
    });

    if (heroNode && heroNode.styles?.responsive?.mobile?.flexDirection === "row") {
      newFindings.push({ category: "Mobile", severity: "warning", message: "Hero uses row layout on mobile (risk of horizontal overflow)." });
      currentScore -= 10;
    }

    setScore(Math.max(currentScore, 0));
    setFindings(newFindings);
  }, [document]);

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      {/* Score Header */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Studio Quality Audit</span>
          </div>
          <p className="text-[11px] text-slate-400">Automated SEO & Accessibility checks</p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-extrabold text-indigo-400">{score}</span>
          <span className="text-[10px] text-slate-500 block">/ 100</span>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audit Findings</div>

        {findings.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
            <p className="font-bold">Perfect Quality Score!</p>
            <p className="text-[11px] text-emerald-400">All SEO, mobile layout, and accessibility rules pass.</p>
          </div>
        ) : (
          findings.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {item.category}
                </span>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {item.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{item.message}</p>
              {onApplyFix && (
                <button
                  onClick={() => onApplyFix(item.category)}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" /> Auto-fix with AI
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
