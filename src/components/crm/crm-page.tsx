"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { GlassTable, GlassTableRow, GlassTableCell } from "@/components/ui/glass-table";
import { IOSBadge } from "@/components/ui/ios-badge";
import { IOSButton } from "@/components/ui/ios-button";
import {
  GitBranch, Mail, Phone, MoreHorizontal,
  UserPlus, Search, TrendingUp, DollarSign, Users, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { useCrmPipelines, useCrmStages, useCrmDeals, getStageColor } from "@/lib/use-crm";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatCurrency(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
}

type Campaign = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  sent_count: number;
  opened_count?: number;
  clicked_count?: number;
  conversion_count?: number;
  created_at: string;
};

export function CrmPage() {
  const { data: store } = useMyStore();
  const currency = store?.currency || "USD";
  const storeId = store?.id;

  const [activeTab, setActiveTab] = useState<"pipeline" | "campaigns">("pipeline");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: pipelines = [], isLoading: pipelinesLoading } = useCrmPipelines();
  const activePipeline = pipelines[0];
  const { data: stages = [], isLoading: stagesLoading } = useCrmStages(activePipeline?.id);
  const { data: deals = [], isLoading: dealsLoading } = useCrmDeals(activePipeline?.id);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<Campaign[]> => {
      const res = await api.get(`/campaigns/${storeId}`);
      return res.data.data;
    },
  });

  const isPipelineLoading = pipelinesLoading || stagesLoading || dealsLoading;

  const stageMap = useMemo(() => {
    const map = new Map<string, { label: string; color: string; position: number }>();
    stages.forEach((s, i) => {
      map.set(s.id, { label: s.name, color: getStageColor(i), position: s.position });
    });
    return map;
  }, [stages]);

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const deal of deals) {
      counts.set(deal.stage_id, (counts.get(deal.stage_id) || 0) + 1);
    }
    return counts;
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchStage = selectedStage ? d.stage_id === selectedStage : true;
      const q = search.toLowerCase();
      const matchSearch = search
        ? d.title.toLowerCase().includes(q) || (d.customer_name || "").toLowerCase().includes(q)
        : true;
      return matchStage && matchSearch;
    });
  }, [deals, selectedStage, search]);

  const { totalValue, weightedValue, activeDeals, winRate } = useMemo(() => {
    const total = deals.reduce((s, d) => s + Number(d.value), 0);
    const active = deals.filter((d) => d.status === "open").length;
    const won = deals.filter((d) => d.status === "won").length;
    const closed = won + deals.filter((d) => d.status === "lost").length;

    // Weighted value: approximate probability by stage position (0% to 100%)
    const weighted = deals.reduce((s, d) => {
      const stage = stageMap.get(d.stage_id);
      const position = stage?.position ?? 0;
      const maxPosition = Math.max(stages.length - 1, 1);
      const probability = d.status === "won" ? 100 : d.status === "lost" ? 0 : Math.round((position / maxPosition) * 100);
      return s + Number(d.value) * (probability / 100);
    }, 0);

    return {
      totalValue: total,
      weightedValue: weighted,
      activeDeals: active,
      winRate: closed > 0 ? Math.round((won / closed) * 100) : 0,
    };
  }, [deals, stages.length, stageMap]);

  const kpiItems = [
    { label: "Pipeline Value", value: formatCurrency(totalValue, currency), icon: <DollarSign className="h-4 w-4" />, color: "#190E85" },
    { label: "Weighted Value", value: formatCurrency(weightedValue, currency), icon: <TrendingUp className="h-4 w-4" />, color: "#00E0FF" },
    { label: "Active Deals", value: activeDeals, icon: <GitBranch className="h-4 w-4" />, color: "#CF00FF" },
    { label: "Win Rate", value: `${winRate}%`, icon: <Users className="h-4 w-4" />, color: "#03CF94" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-sm text-muted-foreground">Manage your sales pipeline and email campaigns.</p>
        </div>
        <IOSButton variant="gradient" size="md" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Deal
        </IOSButton>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiItems.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold">
              {isPipelineLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["pipeline", "campaigns"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab === "pipeline" ? "Pipeline" : "Email Campaigns"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "pipeline" ? (
          <motion.div key="pipeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Stage Filter */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedStage(null)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  !selectedStage ? "bg-primary text-white border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/30")}>
                All Deals
              </button>
              {stages.map((stage, i) => {
                const color = getStageColor(i);
                const isSelected = selectedStage === stage.id;
                return (
                  <button key={stage.id} onClick={() => setSelectedStage(stage.id)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5",
                      isSelected ? "text-white border-transparent" : "bg-transparent text-muted-foreground border-border hover:border-primary/30")}
                    style={isSelected ? { backgroundColor: color, borderColor: color } : {}}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {stage.name}
                    <span className="text-[10px] opacity-70">({stageCounts.get(stage.id) || 0})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deals or contacts..."
                className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40" />
            </div>

            {/* Deals List */}
            {isPipelineLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No deals found.</p>
            ) : (
              <div className="space-y-2">
                {filteredDeals.map((deal, i) => {
                  const stage = stageMap.get(deal.stage_id);
                  const color = stage?.color || "#8B5CF6";
                  const probability = deal.status === "won" ? 100 : deal.status === "lost" ? 0 : Math.round(((stage?.position ?? 0) / Math.max(stages.length - 1, 1)) * 100);
                  return (
                    <GlassTableRow key={deal.id} delay={i * 0.03} className="grid-cols-[1fr_auto_auto_auto_auto_auto] sm:grid-cols-[1fr_120px_100px_100px_80px_auto]">
                      <GlassTableCell>
                        <div>
                          <p className="text-sm font-medium">{deal.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {deal.customer_name || "No contact"}
                          </p>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell className="hidden sm:block">
                        <span className="text-sm font-semibold">{formatCurrency(Number(deal.value), currency)}</span>
                      </GlassTableCell>
                      <GlassTableCell className="hidden sm:block">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-medium">{stage?.label || "Unknown"}</span>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell className="hidden sm:block">
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${probability}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{probability}%</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <IOSBadge variant="secondary" size="sm">{deal.expected_close_date ? timeAgo(deal.expected_close_date) : "No date"}</IOSBadge>
                      </GlassTableCell>
                      <GlassTableCell>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"><Phone className="h-3.5 w-3.5" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"><Mail className="h-3.5 w-3.5" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                        </div>
                      </GlassTableCell>
                    </GlassTableRow>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No campaigns yet.</p>
            ) : (
              campaigns.map((camp, i) => {
                const sent = camp.sent_count ?? 0;
                const opened = camp.opened_count ?? 0;
                const clicked = camp.clicked_count ?? 0;
                return (
                  <GlassTableRow key={camp.id} delay={i * 0.05} className="grid-cols-[1fr_auto]">
                    <GlassTableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{camp.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <IOSBadge variant={camp.status === "sending" || camp.status === "sent" ? "success" : camp.status === "scheduled" ? "warning" : "secondary"} size="sm">
                              {camp.status}
                            </IOSBadge>
                            <span className="text-[10px] text-muted-foreground">{sent.toLocaleString()} sent</span>
                          </div>
                        </div>
                      </div>
                    </GlassTableCell>
                    <GlassTableCell>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <p className="font-semibold">{sent > 0 ? Math.round((opened / sent) * 100) : 0}%</p>
                          <p className="text-[10px] text-muted-foreground">Open</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{sent > 0 ? Math.round((clicked / sent) * 100) : 0}%</p>
                          <p className="text-[10px] text-muted-foreground">Click</p>
                        </div>
                        <IOSButton variant="outline" size="sm">View</IOSButton>
                      </div>
                    </GlassTableCell>
                  </GlassTableRow>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
