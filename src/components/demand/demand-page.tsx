"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { GlassTable, GlassTableRow, GlassTableCell } from "@/components/ui/glass-table";
import {
  Target, Zap, TrendingUp, AlertTriangle, DollarSign,
  Lightbulb, RotateCcw, Loader2
} from "lucide-react";
import { useDemandHistory, useScoreDemand } from "@/lib/use-demand";

const SEGMENT_CHIPS = [
  "Gen Z foodies", "Health-conscious", "Office lunch crowd", "Date night couples", "Families with kids"
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function DemandPage() {
  const [idea, setIdea] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState<ReturnType<typeof buildResult> | null>(null);
  const { data: history = [], isLoading: historyLoading } = useDemandHistory();
  const scoreMutation = useScoreDemand();

  function buildResult(insight: typeof history[0]) {
    const rec = insight.recommendations;
    const score = rec?.score ?? 70;
    return {
      id: insight.id,
      idea: insight.email_subject || insight.summary,
      score,
      confidence: rec?.confidence || (score > 80 ? "High" : score > 70 ? "Medium" : "Low"),
      price: rec?.suggested_price ?? 15,
      summary: insight.summary,
      nextAction: insight.next_action,
      positioning: rec?.positioning,
      targetSegments: rec?.target_segments || SEGMENT_CHIPS.slice(0, 3),
      risks: rec?.risks || [],
      date: "Just now",
    };
  }

  const handleScore = () => {
    if (!idea.trim()) return;
    scoreMutation.mutate(
      { idea: idea.trim(), targetPrice: price ? Number(price) : undefined },
      {
        onSuccess: (data) => {
          setResult(buildResult(data));
        },
      }
    );
  };

  const displayResult = result;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demand Scoring</h1>
          <p className="text-sm text-muted-foreground">AI scores your menu ideas against customer data and trends.</p>
        </div>
      </div>

      {/* Input Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#CF00FF]/15 to-[#190E85]/15">
            <Lightbulb className="h-5 w-5 text-[#CF00FF]" />
          </div>
          <div>
            <h3 className="font-semibold">New Menu Idea</h3>
            <p className="text-xs text-muted-foreground">Describe a dish and we will predict its success.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Dish Description</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A Lebanese-style shawarma bowl with tahini dressing, pickled turnips, and grilled chicken..."
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40 resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Target Price (USD)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="15.00"
                type="number"
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40"
              />
            </div>
            <div className="flex items-end">
              <IOSButton variant="gradient" className="w-full gap-2" onClick={handleScore} isLoading={scoreMutation.isPending}>
                <Zap className="h-4 w-4" />
                Score Idea
              </IOSButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {displayResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-6 border-l-4"
            style={{ borderLeftColor: displayResult.score > 80 ? "#03CF94" : displayResult.score > 70 ? "#F59E0B" : "#EF4444" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{displayResult.idea}</h3>
                <p className="text-sm text-muted-foreground">Target price: ${displayResult.price}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: displayResult.score > 80 ? "#03CF94" : displayResult.score > 70 ? "#F59E0B" : "#EF4444" }}>
                  {displayResult.score}<span className="text-lg text-muted-foreground">/100</span>
                </div>
                <IOSBadge variant={displayResult.score > 80 ? "success" : displayResult.score > 70 ? "warning" : "destructive"} size="sm">
                  {displayResult.confidence} Confidence
                </IOSBadge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Market Fit", value: `${Math.min(displayResult.score + 5, 95)}%`, icon: <Target className="h-4 w-4" />, color: "#190E85" },
                { label: "Profit Margin", value: `${Math.round((displayResult.price - 4) / displayResult.price * 100)}%`, icon: <DollarSign className="h-4 w-4" />, color: "#00E0FF" },
                { label: "Customer Demand", value: `${displayResult.score}%`, icon: <TrendingUp className="h-4 w-4" />, color: "#03CF94" },
              ].map((stat) => (
                <div key={stat.label} className="glass-row p-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {displayResult.targetSegments.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Segments</p>
                <div className="flex flex-wrap gap-2">
                  {displayResult.targetSegments.slice(0, 3).map((seg) => (
                    <span key={seg} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/20">
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {displayResult.risks.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {displayResult.risks[0]}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div>
        <h3 className="font-semibold text-base mb-3">History</h3>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No demand scores yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((item, i) => {
              const rec = item.recommendations;
              const score = rec?.score ?? 70;
              const confidence = rec?.confidence || (score > 80 ? "High" : score > 70 ? "Medium" : "Low");
              return (
                <GlassTableRow key={item.id} delay={i * 0.05} className="grid-cols-[1fr_auto_auto_auto_auto]">
                  <GlassTableCell>
                    <p className="text-sm font-medium">{item.email_subject || item.summary}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                  </GlassTableCell>
                  <GlassTableCell>
                    <span className="text-sm font-bold">{score}/100</span>
                  </GlassTableCell>
                  <GlassTableCell>
                    <IOSBadge variant={confidence === "High" ? "success" : "warning"} size="sm">{confidence}</IOSBadge>
                  </GlassTableCell>
                  <GlassTableCell>
                    <span className="text-sm">${rec?.suggested_price ?? 15}</span>
                  </GlassTableCell>
                  <GlassTableCell>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </GlassTableCell>
                </GlassTableRow>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
