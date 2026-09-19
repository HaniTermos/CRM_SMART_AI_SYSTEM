"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import {
  useMonthlyStrategy,
  useExternalSignals,
  useVerifyExternalSignal,
  useRejectExternalSignal,
  useRefreshMonthlyStrategy,
  MonthlyStrategyRecommendation,
  MonthlyStrategyCategory,
  ExternalMarketSignal
} from "@/lib/use-daily-pulse";
import { useNavigate } from "@tanstack/react-router";
import {
  Compass, TrendingUp, Wrench, Users, ArrowUpRight,
  ShieldCheck, AlertCircle, Calendar, Sparkles, Database,
  Globe, ExternalLink, Check, X, Filter, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

function CategoryIcon({ category }: { category: MonthlyStrategyCategory }) {
  switch (category) {
    case "revenue_optimization":
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case "operational_efficiency":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "customer_retention":
      return <Users className="h-4 w-4 text-sky-500" />;
    default:
      return <Compass className="h-4 w-4 text-primary" />;
  }
}

function CategoryLabel({ category }: { category: MonthlyStrategyCategory }) {
  switch (category) {
    case "revenue_optimization":
      return "Revenue Optimization";
    case "operational_efficiency":
      return "Operational Efficiency";
    case "customer_retention":
      return "Customer Retention";
    default:
      return category;
  }
}

function RiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case "high":
      return <IOSBadge variant="destructive" size="sm">High Risk</IOSBadge>;
    case "medium":
      return <IOSBadge variant="warning" size="sm">Medium Risk</IOSBadge>;
    default:
      return <IOSBadge variant="success" size="sm">Low Risk</IOSBadge>;
  }
}

export function ExternalMarketSignalsWidget() {
  const [statusFilter, setStatusFilter] = useState<string>("verified");
  const { data: signals, isLoading } = useExternalSignals({
    status: statusFilter === "all" ? undefined : statusFilter
  });
  const verifyMutation = useVerifyExternalSignal();
  const rejectMutation = useRejectExternalSignal();

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-muted/40 animate-pulse space-y-2">
        <div className="h-4 w-36 bg-muted rounded" />
        <div className="h-12 w-full bg-muted/60 rounded-lg" />
      </div>
    );
  }

  const signalList = signals || [];

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-500" />
          <span className="font-bold text-xs text-foreground">External Market Intelligence Signals</span>
          <IOSBadge variant="secondary" size="sm" className="text-[10px]">
            Context Only
          </IOSBadge>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {["verified", "draft", "all"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors",
                statusFilter === st
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {signalList.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground bg-background/50 rounded-lg space-y-1">
          <p className="font-semibold text-foreground">No verified external market signals available for this period.</p>
          <p>Your monthly strategy is currently based on internal store data.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {signalList.map((sig) => (
            <div
              key={sig.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background/70 border border-border/50 text-xs gap-2"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground">{sig.title}</span>
                  <IOSBadge variant="secondary" size="sm" className="text-[10px] uppercase">
                    {sig.signal_type.replace("_", " ")}
                  </IOSBadge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {sig.confidence}% Confidence
                  </span>
                  {sig.status === "verified" ? (
                    <IOSBadge variant="success" size="sm">Verified</IOSBadge>
                  ) : sig.status === "draft" ? (
                    <IOSBadge variant="warning" size="sm">Draft</IOSBadge>
                  ) : (
                    <IOSBadge variant="destructive" size="sm">{sig.status}</IOSBadge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span>Source: {sig.source_name}</span>
                  <span>Observed: {new Date(sig.observed_at).toLocaleDateString()}</span>
                  {sig.source_url && (
                    <a
                      href={sig.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-500 hover:underline inline-flex items-center gap-0.5"
                    >
                      Source Link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {sig.status === "draft" && (
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  <IOSButton
                    variant="subtle"
                    size="pill"
                    className="h-6 text-[11px] gap-1"
                    onClick={() => verifyMutation.mutate(sig.id)}
                  >
                    <Check className="h-3 w-3 text-emerald-500" /> Verify
                  </IOSButton>
                  <IOSButton
                    variant="subtle"
                    size="pill"
                    className="h-6 text-[11px] gap-1"
                    onClick={() => rejectMutation.mutate(sig.id)}
                  >
                    <X className="h-3 w-3 text-rose-500" /> Reject
                  </IOSButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MonthlyStrategyPanel() {
  const { data: strategy, isLoading, isError } = useMonthlyStrategy(true);
  const refreshMutation = useRefreshMonthlyStrategy();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <IOSCard className="p-5 space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="h-20 w-full bg-muted/60 rounded-xl" />
        <div className="h-20 w-full bg-muted/60 rounded-xl" />
      </IOSCard>
    );
  }

  if (isError || !strategy) {
    return null;
  }

  const isInsufficient = strategy.data_sufficiency_tier === "insufficient" || strategy.status === "insufficient_data";
  const isLimited = strategy.data_sufficiency_tier === "limited";

  if (isInsufficient) {
    return (
      <IOSCard className="p-5 border-dashed border-amber-500/30 bg-amber-500/5 space-y-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
          <AlertCircle className="h-5 w-5" />
          <span>Monthly Strategy: Initial 30-Day Volume Pending</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Monthly growth strategy analysis requires at least 10 customer orders in the trailing 30-day period. Keep building store order volume to unlock multi-dimensional strategy recommendations.
        </p>
      </IOSCard>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <IOSCard className="p-5 glow space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#190E85] via-[#2D1B9E] to-[#00E0FF]">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-base">Monthly Growth Strategy & Context</h3>
            {isLimited ? (
              <IOSBadge variant="secondary" size="sm">Limited Data Mode (70% Max Confidence)</IOSBadge>
            ) : (
              <IOSBadge variant="success" size="sm">Multi-Dimensional Analysis</IOSBadge>
            )}
            {strategy.external_context_used && (
              <IOSBadge variant="secondary" size="sm" className="gap-1">
                <Globe className="h-3 w-3 text-sky-500" /> External Context Included
              </IOSBadge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => refreshMutation.mutate(undefined)}
              disabled={refreshMutation.isPending}
              className="text-muted-foreground hover:text-primary flex items-center gap-1 font-medium"
              title="Refresh Strategy with verified signals"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshMutation.isPending && "animate-spin")} />
              Refresh Strategy
            </button>
            <div className="flex items-center gap-1 text-muted-foreground font-mono">
              <Calendar className="h-3.5 w-3.5" />
              <span>Period: {strategy.strategy_period}</span>
            </div>
          </div>
        </div>

        <ExternalMarketSignalsWidget />

        <div className="space-y-3">
          {strategy.recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-muted/50 border border-border/70 hover:border-border transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-background border border-border/60 shrink-0">
                    <CategoryIcon category={rec.category} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{rec.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{CategoryLabel({ category: rec.category })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <RiskBadge risk={rec.risk_level} />
                  <IOSBadge variant="secondary" size="sm" className="font-mono">{rec.confidence}% Confidence</IOSBadge>
                  {rec.suggested_execution_path && (
                    <IOSButton
                      variant="subtle"
                      size="pill"
                      className="h-7 text-xs gap-1"
                      onClick={() => navigate({ to: rec.suggested_execution_path as any })}
                    >
                      Explore {rec.suggested_execution_path} <ArrowUpRight className="h-3 w-3" />
                    </IOSButton>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>

              <div className="grid sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded-lg bg-background/60 border border-border/50 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Expected Range</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{rec.expected_impact_range}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-background/60 border border-border/50 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Internal Evidence Basis</span>
                  <span className="text-foreground">{rec.source_basis?.metric_name || "30-Day Store Snapshot"}</span>
                </div>
              </div>

              {/* External Context section if attached */}
              {rec.external_evidence && rec.external_evidence.length > 0 && (
                <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/20 text-xs space-y-1.5">
                  <div className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> External Context (Not Causal Attribution):
                  </div>
                  <div className="space-y-1">
                    {rec.external_evidence.map((sig) => (
                      <div key={sig.id} className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>• {sig.title} ({sig.source_name})</span>
                        <span className="font-mono text-[10px]">{sig.confidence}% Confidence</span>
                      </div>
                    ))}
                  </div>
                  {rec.external_context_note && (
                    <p className="text-[10px] text-sky-600 dark:text-sky-400 italic">
                      Note: {rec.external_context_note}
                    </p>
                  )}
                </div>
              )}

              {rec.evidence_summary?.attribution_note && (
                <p className="text-[10px] text-muted-foreground italic bg-muted/30 p-2 rounded border border-border/30">
                  Note: {rec.evidence_summary.attribution_note}
                </p>
              )}
            </div>
          ))}
        </div>
      </IOSCard>
    </motion.div>
  );
}
