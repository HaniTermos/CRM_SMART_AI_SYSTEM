"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { Sparkles, Zap, Users, TrendingUp, X, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";

const TYPE_META: Record<string, { icon: React.ReactNode; bg: string; action: string }> = {
  inventory: { icon: <Zap className="h-4 w-4 text-amber-500" />, bg: "bg-amber-500/10", action: "Restock" },
  staffing: { icon: <Users className="h-4 w-4 text-sky-500" />, bg: "bg-sky-500/10", action: "Schedule" },
  marketing: { icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, bg: "bg-emerald-500/10", action: "Campaign" },
  customer_retention: { icon: <Users className="h-4 w-4 text-sky-500" />, bg: "bg-sky-500/10", action: "Campaign" },
  revenue_optimization: { icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, bg: "bg-emerald-500/10", action: "Act" },
  operational_efficiency: { icon: <Zap className="h-4 w-4 text-amber-500" />, bg: "bg-amber-500/10", action: "Review" },
  default: { icon: <Sparkles className="h-4 w-4 text-primary" />, bg: "bg-primary/10", action: "Review" },
};

export function AiBriefing() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  const { data: rawInsights = [], isLoading, isError } = useQuery({
    queryKey: ["ai-recent-insights", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/ai/${storeId}/recent-insights`);
      return res.data.data as Array<{
        id: string;
        summary: string;
        next_action: string;
        kind: string;
        confidence?: number;
        created_at: string;
      }>;
    },
  });

  const insights = useMemo(
    () =>
      rawInsights.map((insight) => {
        const meta = TYPE_META[insight.kind] || TYPE_META.default;
        return {
          id: insight.id,
          icon: meta.icon,
          bg: meta.bg,
          text: insight.summary || insight.next_action || "AI insight",
          action: meta.action,
          confidence: insight.confidence ?? 85,
          type: insight.kind,
        };
      }),
    [rawInsights]
  );

  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleInsights = insights.filter((i) => !dismissed.includes(i.id));

  const dismiss = (id: string) => setDismissed((prev) => [...prev, id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-[#00E0FF]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-base">AI Daily Briefing</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${visibleInsights.length} insights`}
          </span>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && isError && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Unable to load AI insights.
            </div>
          )}

          {!isLoading && !isError && visibleInsights.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No AI insights yet. Insights are generated from customer and order analysis.
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {visibleInsights.map((insight) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 group hover:bg-muted transition-colors"
              >
                <div className={cn("p-2 rounded-lg shrink-0", insight.bg)}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <IOSButton variant="default" size="pill" className="h-7 text-[11px]">
                      {insight.action}
                      <ChevronRight className="h-3 w-3" />
                    </IOSButton>
                    <span className="text-[10px] text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(insight.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted-foreground/10"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </IOSCard>
    </motion.div>
  );
}
