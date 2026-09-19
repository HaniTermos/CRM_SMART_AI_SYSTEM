import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { motion } from "framer-motion";
import {
  Sparkles, TrendingUp, Users, UtensilsCrossed, Megaphone, AlertTriangle,
  BrainCircuit, Loader2, ArrowRight, Lightbulb, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/ai-insights")({
  component: AiInsightsRoute,
});

function AiInsightsRoute() {
  const { data: store } = useMyStore();
  const storeId = store?.id;
  const navigate = useNavigate();

  const { data: recentInsights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["ai-recent-insights", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/ai/${storeId}/recent-insights`);
      return res.data.data;
    },
  });

  const { data: demandHistory = [], isLoading: demandLoading } = useQuery({
    queryKey: ["ai-demand-history", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/ai/${storeId}/demand-history`);
      return res.data.data;
    },
  });

  const { data: reengagement = [], isLoading: reengagementLoading } = useQuery({
    queryKey: ["ai-reengagement", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/ai/${storeId}/reengagement`);
      return res.data.data;
    },
  });

  const isLoading = insightsLoading || demandLoading || reengagementLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Demand predictions, churn analysis, product recommendations, and campaign ideas.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/ai" })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <BrainCircuit className="h-4 w-4" /> AI Chat
        </button>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Analyzing your store data…</p>
        </div>
      ) : (
        <>
          {/* Daily Briefing */}
          <div className="grid gap-4 md:grid-cols-3">
            <InsightCard
              icon={TrendingUp}
              title="Recent Insights"
              value={recentInsights.length}
              subtitle="generated from store data"
              color="text-emerald-500"
            />
            <InsightCard
              icon={Target}
              title="Demand Scores"
              value={demandHistory.length}
              subtitle="product ideas evaluated"
              color="text-blue-500"
            />
            <InsightCard
              icon={Users}
              title="Re-engagement"
              value={reengagement.length}
              subtitle="customers need attention"
              color="text-amber-500"
            />
          </div>

          {/* Recent AI Insights */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Recent Insights
            </h2>
            {recentInsights.length === 0 ? (
              <EmptyState message="No AI insights yet. Use the AI Chat to generate your first insight." />
            ) : (
              <div className="grid gap-3">
                {recentInsights.slice(0, 6).map((insight: any, i: number) => (
                  <motion.div
                    key={insight.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold capitalize">{insight.kind?.replace(/_/g, " ") || "Insight"}</p>
                        <p className="text-sm text-muted-foreground">{insight.summary}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(insight.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {insight.next_action && (
                      <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-lg px-3 py-2">
                        <ArrowRight className="h-3 w-3" />
                        {insight.next_action}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Demand History */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Demand Scoring History
            </h2>
            {demandHistory.length === 0 ? (
              <EmptyState message="No demand scores yet. Try the Demand Scoring page to evaluate product ideas." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {demandHistory.slice(0, 6).map((item: any, i: number) => (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4"
                  >
                    <p className="text-sm font-semibold line-clamp-2">{item.summary || "Demand score"}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.next_action || "No recommendation provided."}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Re-engagement */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Customers to Re-engage
            </h2>
            {reengagement.length === 0 ? (
              <EmptyState message="All customers are active. Great job!" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reengagement.slice(0, 6).map((customer: any, i: number) => (
                  <motion.div
                    key={customer.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4"
                  >
                    <p className="text-sm font-semibold">{customer.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-muted-foreground">Orders: {customer.total_orders || 0}</span>
                      <span className="font-medium">${Number(customer.total_spent || 0).toFixed(2)}</span>
                    </div>
                    {customer.last_order_at && (
                      <p className="text-[10px] text-amber-500 mt-1">
                        Last order: {new Date(customer.last_order_at).toLocaleDateString()}
                      </p>
                    )}
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

function InsightCard({ icon: Icon, title, value, subtitle, color }: any) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl bg-opacity-10", color.replace("text-", "bg-"))}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>
      </div>
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
