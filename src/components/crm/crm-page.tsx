"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassTable, GlassTableRow, GlassTableCell } from "@/components/ui/glass-table";
import { IOSBadge } from "@/components/ui/ios-badge";
import { IOSButton } from "@/components/ui/ios-button";
import {
  GitBranch, Mail, Phone, Calendar, MoreHorizontal, ChevronDown,
  ArrowRight, UserPlus, Filter, Search, TrendingUp, DollarSign, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", color: "#8B5CF6", count: 4 },
  { id: "contacted", label: "Contacted", color: "#3B82F6", count: 3 },
  { id: "qualified", label: "Qualified", color: "#00E0FF", count: 2 },
  { id: "proposal", label: "Proposal", color: "#F59E0B", count: 2 },
  { id: "negotiation", label: "Negotiation", color: "#EF4444", count: 1 },
  { id: "closed", label: "Closed Won", color: "#03CF94", count: 5 },
];

const DEALS = [
  { id: 1, name: "Ahmad K. - Corporate Lunch", contact: "Ahmad Khoury", value: 2400, stage: "proposal", source: "Referral", lastContact: "2h ago", probability: 70 },
  { id: 2, name: "Sarah M. - Event Catering", contact: "Sarah M.", value: 1800, stage: "qualified", source: "Website", lastContact: "1d ago", probability: 50 },
  { id: 3, name: "The Georges - Wedding", contact: "George T.", value: 5600, stage: "negotiation", source: "Instagram", lastContact: "3h ago", probability: 85 },
  { id: 4, name: "Layla H. - Weekly Order", contact: "Layla H.", value: 450, stage: "closed", source: "Walk-in", lastContact: "5h ago", probability: 100 },
  { id: 5, name: "Beirut Tech - Team Lunch", contact: "Rami S.", value: 1200, stage: "contacted", source: "Cold Call", lastContact: "2d ago", probability: 30 },
  { id: 6, name: "Maya K. - Birthday Party", contact: "Maya K.", value: 900, stage: "lead", source: "Facebook", lastContact: "4h ago", probability: 20 },
];

const CAMPAIGNS = [
  { id: 1, name: "Summer Menu Launch", status: "running", sent: 1240, opened: 680, clicked: 240, conversions: 45 },
  { id: 2, name: "VIP Re-engagement", status: "scheduled", sent: 0, opened: 0, clicked: 0, conversions: 0 },
  { id: 3, name: "Ramadan Special", status: "completed", sent: 3200, opened: 2100, clicked: 890, conversions: 120 },
];

export function CrmPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "campaigns">("pipeline");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredDeals = DEALS.filter(d =>
    (selectedStage ? d.stage === selectedStage : true) &&
    (search ? d.name.toLowerCase().includes(search.toLowerCase()) || d.contact.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const totalValue = DEALS.reduce((s, d) => s + d.value, 0);
  const weightedValue = DEALS.reduce((s, d) => s + d.value * (d.probability / 100), 0);

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
        {[
          { label: "Pipeline Value", value: `$${totalValue.toLocaleString()}`, icon: <DollarSign className="h-4 w-4" />, color: "#190E85" },
          { label: "Weighted Value", value: `$${Math.round(weightedValue).toLocaleString()}`, icon: <TrendingUp className="h-4 w-4" />, color: "#00E0FF" },
          { label: "Active Deals", value: DEALS.filter(d => d.stage !== "closed").length, icon: <GitBranch className="h-4 w-4" />, color: "#CF00FF" },
          { label: "Win Rate", value: "68%", icon: <Users className="h-4 w-4" />, color: "#03CF94" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold">{kpi.value}</p>
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
              {PIPELINE_STAGES.map(stage => (
                <button key={stage.id} onClick={() => setSelectedStage(stage.id)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5",
                    selectedStage === stage.id ? "text-white border-transparent" : "bg-transparent text-muted-foreground border-border hover:border-primary/30")}
                  style={selectedStage === stage.id ? { backgroundColor: stage.color, borderColor: stage.color } : {}}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  {stage.label}
                  <span className="text-[10px] opacity-70">({stage.count})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deals or contacts..."
                className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40" />
            </div>

            {/* Deals List */}
            <div className="space-y-2">
              {filteredDeals.map((deal, i) => {
                const stage = PIPELINE_STAGES.find(s => s.id === deal.stage);
                return (
                  <GlassTableRow key={deal.id} delay={i * 0.03} className="grid-cols-[1fr_auto_auto_auto_auto_auto] sm:grid-cols-[1fr_120px_100px_100px_80px_auto]">
                    <GlassTableCell>
                      <div>
                        <p className="text-sm font-medium">{deal.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {deal.contact}
                        </p>
                      </div>
                    </GlassTableCell>
                    <GlassTableCell className="hidden sm:block">
                      <span className="text-sm font-semibold">${deal.value.toLocaleString()}</span>
                    </GlassTableCell>
                    <GlassTableCell className="hidden sm:block">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage?.color }} />
                        <span className="text-xs font-medium">{stage?.label}</span>
                      </div>
                    </GlassTableCell>
                    <GlassTableCell className="hidden sm:block">
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${deal.probability}%`, backgroundColor: stage?.color }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
                    </GlassTableCell>
                    <GlassTableCell>
                      <IOSBadge variant="secondary" size="sm">{deal.lastContact}</IOSBadge>
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
          </motion.div>
        ) : (
          <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            {CAMPAIGNS.map((camp, i) => (
              <GlassTableRow key={camp.id} delay={i * 0.05} className="grid-cols-[1fr_auto]">
                <GlassTableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{camp.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <IOSBadge variant={camp.status === "running" ? "success" : camp.status === "scheduled" ? "warning" : "secondary"} size="sm">
                          {camp.status}
                        </IOSBadge>
                        <span className="text-[10px] text-muted-foreground">{camp.sent.toLocaleString()} sent</span>
                      </div>
                    </div>
                  </div>
                </GlassTableCell>
                <GlassTableCell>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-semibold">{camp.opened > 0 ? Math.round((camp.opened / camp.sent) * 100) : 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Open</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{camp.clicked > 0 ? Math.round((camp.clicked / camp.sent) * 100) : 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Click</p>
                    </div>
                    <IOSButton variant="outline" size="sm">View</IOSButton>
                  </div>
                </GlassTableCell>
              </GlassTableRow>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
