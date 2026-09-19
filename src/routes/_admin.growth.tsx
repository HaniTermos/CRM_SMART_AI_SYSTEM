import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { motion } from "framer-motion";
import {
  TrendingUp, Target, Users, DollarSign, BarChart3, Rocket,
  Loader2, ArrowUpRight, ArrowDownRight, Lightbulb, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/growth")({
  component: GrowthRoute,
});

function GrowthRoute() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  const { data: pulse, isLoading: pulseLoading } = useQuery({
    queryKey: ["growth-daily-pulse", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/growth/daily-pulse`);
      return res.data.data;
    },
  });

  const { data: experiments = [], isLoading: experimentsLoading } = useQuery({
    queryKey: ["growth-experiments", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/growth/experiments`);
      return res.data.data;
    },
  });

  const { data: impact, isLoading: impactLoading } = useQuery({
    queryKey: ["growth-impact", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/stores/me/growth/impact-summary`);
      return res.data.data;
    },
  });

  const isLoading = pulseLoading || experimentsLoading || impactLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" /> Growth
        </h1>
        <p className="text-sm text-muted-foreground">
          Monthly revenue growth, experiments, opportunities, and impact tracking.
        </p>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading growth data…</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GrowthKpi
              icon={DollarSign}
              label="Revenue Growth"
              value={impact?.revenue_growth ? `${impact.revenue_growth}%` : "—"}
              trend={impact?.revenue_growth >= 0 ? "up" : "down"}
            />
            <GrowthKpi
              icon={Users}
              label="Customer Growth"
              value={impact?.customer_growth ? `${impact.customer_growth}%` : "—"}
              trend={impact?.customer_growth >= 0 ? "up" : "down"}
            />
            <GrowthKpi
              icon={BarChart3}
              label="Order Growth"
              value={impact?.order_growth ? `${impact.order_growth}%` : "—"}
              trend={impact?.order_growth >= 0 ? "up" : "down"}
            />
            <GrowthKpi
              icon={Target}
              label="Avg Order Value"
              value={impact?.aov ? `$${Number(impact.aov).toFixed(2)}` : "—"}
              trend="neutral"
            />
          </div>

          {/* Daily Pulse */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Daily Pulse
            </h2>
            {pulse ? (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{pulse.title || "Today's growth snapshot"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pulse.summary || "No pulse generated yet."}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {pulse.date ? new Date(pulse.date).toLocaleDateString() : "Today"}
                  </span>
                </div>
                {pulse.recommendations && pulse.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommendations</p>
                    {pulse.recommendations.slice(0, 3).map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl bg-primary/5">
                        <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{rec.title || "Recommendation"}</p>
                          <p className="text-xs text-muted-foreground">{rec.description || rec.reason || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No daily pulse available yet." />
            )}
          </section>

          {/* Experiments */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Active Experiments
            </h2>
            {experiments.length === 0 ? (
              <EmptyState message="No growth experiments running. Start one from the AI Chat or Growth recommendations." />
            ) : (
              <div className="grid gap-3">
                {experiments.map((exp: any, i: number) => (
                  <motion.div
                    key={exp.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{exp.name || "Experiment"}</p>
                      <p className="text-xs text-muted-foreground">{exp.hypothesis || "No hypothesis provided."}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                        exp.status === "active" ? "bg-emerald-500/10 text-emerald-500" :
                        exp.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {exp.status || "draft"}
                      </span>
                      {exp.impact !== undefined && (
                        <span className={cn(
                          "text-xs font-semibold flex items-center gap-0.5",
                          exp.impact >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                          {exp.impact >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {exp.impact}%
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function GrowthKpi({ icon: Icon, label, value, trend }: any) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn(
          "h-4 w-4",
          trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-primary"
        )} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {trend !== "neutral" && (
        <p className={cn("text-[10px] font-medium", trend === "up" ? "text-emerald-500" : "text-red-500")}>
          {trend === "up" ? "Positive growth" : "Declining"}
        </p>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
