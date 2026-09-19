"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import {
  useDailyPulse,
  useViewRecommendation,
  useDismissRecommendation,
  useExecuteRecommendation,
  useImpactSummary,
  useRecalculateExperiment,
  PulseRecommendation,
  SetupAction,
  RecommendationCategory
} from "@/lib/use-daily-pulse";
import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles, Zap, TrendingUp, Users, Wrench, X, Info,
  AlertCircle, CheckCircle2, ChevronRight, ShieldAlert, Database,
  Play, Check, Loader2, BarChart3, RefreshCw, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

function CategoryIcon({ category }: { category: RecommendationCategory }) {
  switch (category) {
    case "revenue":
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case "operations":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "customer_growth":
      return <Users className="h-4 w-4 text-sky-500" />;
    default:
      return <Zap className="h-4 w-4 text-primary" />;
  }
}

function CategoryBg({ category }: { category: RecommendationCategory }) {
  switch (category) {
    case "revenue":
      return "bg-emerald-500/10";
    case "operations":
      return "bg-amber-500/10";
    case "customer_growth":
      return "bg-sky-500/10";
    default:
      return "bg-primary/10";
  }
}

function CategoryLabel({ category }: { category: RecommendationCategory }) {
  switch (category) {
    case "revenue":
      return "Revenue Growth";
    case "operations":
      return "Operations";
    case "customer_growth":
      return "Customer Retention";
    default:
      return category;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "high":
    case "critical":
      return <IOSBadge variant="destructive" size="sm">High Priority</IOSBadge>;
    case "medium":
      return <IOSBadge variant="warning" size="sm">Medium</IOSBadge>;
    default:
      return <IOSBadge variant="secondary" size="sm">Low Priority</IOSBadge>;
  }
}

function getActionTypeForCategory(rec: PulseRecommendation): { type: string; label: string; payload?: any } {
  if (rec.category === "operations") {
    return {
      type: "create_task",
      label: "Create Operations Task",
      payload: { title: rec.title, description: rec.reason }
    };
  } else if (rec.category === "customer_growth") {
    return {
      type: "create_campaign_draft",
      label: "Create Campaign Draft",
      payload: { name: `Draft: ${rec.title}`, subject: rec.title }
    };
  } else {
    return {
      type: "create_task",
      label: "Create Revenue Task",
      payload: { title: rec.title, description: rec.reason }
    };
  }
}

function ExecutionConfirmModal({
  recommendation,
  onConfirm,
  onCancel,
  isExecuting
}: {
  recommendation: PulseRecommendation;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}) {
  const actionInfo = getActionTypeForCategory(recommendation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Play className="h-5 w-5 fill-primary" />
            <span>Confirm Safe One-Click Execution</span>
          </div>
          <button onClick={onCancel} disabled={isExecuting} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/60 space-y-1">
            <div className="font-semibold text-foreground text-sm">{recommendation.title}</div>
            <div className="text-muted-foreground">{recommendation.reason}</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Action to be Executed:
            </div>
            <div className="font-mono text-xs text-foreground bg-background/50 p-2 rounded">
              Action Type: <strong>{actionInfo.type}</strong>
            </div>
            <p className="text-[11px]">
              This safe action creates a store resource draft and automatically starts a 7-day impact experiment to measure actual revenue & operational lift.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <IOSButton variant="subtle" className="flex-1" onClick={onCancel} disabled={isExecuting}>
            Cancel
          </IOSButton>
          <IOSButton variant="gradient" className="flex-1 gap-2" onClick={onConfirm} disabled={isExecuting}>
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
            {isExecuting ? "Executing..." : "Confirm & Execute"}
          </IOSButton>
        </div>
      </motion.div>
    </div>
  );
}

function SourceBasisModal({ recommendation, onClose }: { recommendation: PulseRecommendation; onClose: () => void }) {
  const sb = recommendation.source_basis;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Database className="h-5 w-5" />
            <span>Data Attribution & Proof</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/60 space-y-1">
            <div className="font-semibold text-foreground text-sm">{recommendation.title}</div>
            <div className="text-muted-foreground">{recommendation.reason}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Metric Name</span>
              <span className="font-semibold text-foreground">{sb?.metric_name || "Internal Metric"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Data Source</span>
              <span className="font-semibold text-emerald-500 uppercase">{sb?.source_type || "Internal Store Data"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Current Value</span>
              <span className="font-semibold text-foreground">{String(sb?.current_value ?? "N/A")}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Benchmark</span>
              <span className="font-semibold text-foreground">{String(sb?.comparison_value ?? "N/A")}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Time Period</span>
            <span className="font-medium text-foreground">{sb?.period || "Trailing Period"}</span>
          </div>

          {sb?.explanation && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-muted-foreground leading-relaxed">
              <strong className="text-foreground font-semibold">Evidence Explanation: </strong>
              {sb.explanation}
            </div>
          )}
        </div>

        <IOSButton variant="subtle" className="w-full" onClick={onClose}>
          Close Proof Window
        </IOSButton>
      </motion.div>
    </div>
  );
}

function ImpactTrackerWidget() {
  const { data: summary, isLoading, refetch } = useImpactSummary();
  const recalcMutation = useRecalculateExperiment();

  if (isLoading || !summary || summary.total_experiments === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <span>Measured Impact Tracker</span>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Refresh Impact
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block uppercase">Measured Net Lift</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            +${summary.total_measured_revenue_impact.toFixed(2)}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold block uppercase">Active Experiments</span>
          <span className="text-base font-extrabold text-sky-600 dark:text-sky-400">
            {summary.active_running}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block uppercase">Success Actions</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary.completed_success}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold block uppercase">Neutral / Inconclusive</span>
          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
            {summary.completed_neutral + summary.inconclusive + summary.awaiting_campaign_send}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {summary.breakdown.map((exp) => (
          <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground truncate">{exp.recommendation_title || exp.action_type}</div>
              <div className="text-[11px] text-muted-foreground">
                Est: {exp.expected_impact} • Base: ${exp.baseline_value}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {exp.status === "awaiting_campaign_send" ? (
                <IOSBadge variant="warning" size="sm">Awaiting Send</IOSBadge>
              ) : exp.result === "success" ? (
                <IOSBadge variant="success" size="sm">
                  +${exp.actual_impact?.toFixed(2) || "0.00"} Measured
                </IOSBadge>
              ) : exp.result === "failure" ? (
                <IOSBadge variant="destructive" size="sm">Measured Negative</IOSBadge>
              ) : (
                <IOSBadge variant="secondary" size="sm">
                  {exp.status === "running" ? "Running" : "Neutral"}
                </IOSBadge>
              )}

              {exp.status === "running" && (
                <button
                  onClick={() => recalcMutation.mutate(exp.id)}
                  disabled={recalcMutation.isPending}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  title="Recalculate Actual Impact"
                >
                  <RefreshCw className={cn("h-3 w-3", recalcMutation.isPending && "animate-spin")} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsufficientDataState({ actions }: { actions: SetupAction[] }) {
  const navigate = useNavigate();

  return (
    <IOSCard className="p-6 border-dashed border-amber-500/30 bg-amber-500/5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">AI Daily Micro-Pulse: Data Pending</h3>
            <IOSBadge variant="warning" size="sm">Setup Required</IOSBadge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SmartStore AI requires at least 3 customer orders to start generating precise revenue and operational recommendations.
            Follow these setup steps to activate your daily pulse:
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 pt-2">
        {actions.map((act) => (
          <div
            key={act.id}
            onClick={() => navigate({ to: act.link as any })}
            className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 cursor-pointer transition-all space-y-1 group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-foreground group-hover:text-primary">
              <span>{act.title}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">{act.description}</p>
          </div>
        ))}
      </div>
    </IOSCard>
  );
}

export function TodayActionsPanel() {
  const { data: pulse, isLoading, isError } = useDailyPulse();
  const viewMutation = useViewRecommendation();
  const dismissMutation = useDismissRecommendation();
  const executeMutation = useExecuteRecommendation();

  const [selectedProof, setSelectedProof] = useState<PulseRecommendation | null>(null);
  const [selectedConfirm, setSelectedConfirm] = useState<PulseRecommendation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <IOSCard className="p-5 space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="h-16 w-full bg-muted/60 rounded-xl" />
        <div className="h-16 w-full bg-muted/60 rounded-xl" />
      </IOSCard>
    );
  }

  if (isError || !pulse) {
    return null;
  }

  const isInsufficient = pulse.sufficiency_tier === "insufficient" || pulse.status === "insufficient_data";
  const isLimited = pulse.sufficiency_tier === "limited";
  const activeRecs = pulse.recommendations.filter((r) => r.status !== "dismissed");

  if (isInsufficient) {
    return <InsufficientDataState actions={pulse.setup_actions || []} />;
  }

  const handleExecute = (rec: PulseRecommendation) => {
    const actionInfo = getActionTypeForCategory(rec);
    executeMutation.mutate(
      { id: rec.id, action_type: actionInfo.type, payload: actionInfo.payload },
      {
        onSuccess: (data) => {
          setSelectedConfirm(null);
          setToastMessage(`Executed (${data.action_type})! Started 7-day impact tracking experiment.`);
          setTimeout(() => setToastMessage(null), 4000);
        },
        onError: (err: any) => {
          setToastMessage(`Execution failed: ${err.response?.data?.error || err.message}`);
          setTimeout(() => setToastMessage(null), 5000);
        }
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      {selectedProof && (
        <SourceBasisModal recommendation={selectedProof} onClose={() => setSelectedProof(null)} />
      )}

      {selectedConfirm && (
        <ExecutionConfirmModal
          recommendation={selectedConfirm}
          onConfirm={() => handleExecute(selectedConfirm)}
          onCancel={() => setSelectedConfirm(null)}
          isExecuting={executeMutation.isPending}
        />
      )}

      <IOSCard className="p-5 glow space-y-4">
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-500/10 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-[#00E0FF]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-base">Today's Micro-Pulse & Actions</h3>
            {isLimited && (
              <IOSBadge variant="secondary" size="sm" className="gap-1">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                Limited History Mode (70% Max Confidence)
              </IOSBadge>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Date: {pulse.business_date} • {activeRecs.length} Active Recommendations
          </span>
        </div>

        <ImpactTrackerWidget />

        {activeRecs.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs bg-muted/30 rounded-xl space-y-1">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
            <p className="font-semibold text-foreground">All daily actions completed!</p>
            <p>Check back tomorrow for your next micro-pulse recommendations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activeRecs.map((rec) => {
                const isExecuted = rec.status === "executed";
                const isViewed = rec.status === "viewed";

                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    transition={{ type: "spring", damping: 25 }}
                    className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl transition-all border",
                      isExecuted
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : isViewed
                        ? "bg-muted/30 border-border/40 opacity-85"
                        : "bg-muted/60 border-border/80 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", CategoryBg({ category: rec.category }))}>
                        <CategoryIcon category={rec.category} />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{rec.title}</span>
                          <IOSBadge variant="secondary" size="sm" className="text-[10px]">
                            {CategoryLabel({ category: rec.category })}
                          </IOSBadge>
                          <PriorityBadge priority={rec.priority} />
                          {isExecuted && <IOSBadge variant="success" size="sm">Executed & Tracking</IOSBadge>}
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Target: {rec.target_role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>

                        <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px]">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            Est. Impact: {rec.expected_impact}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {rec.confidence}% Confidence
                          </span>
                          <button
                            onClick={() => {
                              viewMutation.mutate(rec.id);
                              setSelectedProof(rec);
                            }}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                          >
                            <Info className="h-3 w-3" /> View Data Proof
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!isExecuted ? (
                        <>
                          <IOSButton
                            variant="gradient"
                            size="pill"
                            className="h-7 text-xs gap-1"
                            onClick={() => setSelectedConfirm(rec)}
                          >
                            <Play className="h-3 w-3 fill-white" /> Execute Action
                          </IOSButton>
                          {!isViewed && (
                            <IOSButton
                              variant="subtle"
                              size="pill"
                              className="h-7 text-xs gap-1"
                              onClick={() => viewMutation.mutate(rec.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Mark Viewed
                            </IOSButton>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg">
                          <Check className="h-4 w-4" /> Executed
                        </div>
                      )}
                      <button
                        onClick={() => dismissMutation.mutate(rec.id)}
                        className="p-1.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                        title="Dismiss Recommendation"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </IOSCard>
    </motion.div>
  );
}
