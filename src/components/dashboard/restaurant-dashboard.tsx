"use client";

import { motion } from "framer-motion";
import { KpiCard } from "./kpi-card";
import { AiBriefing } from "./ai-briefing";
import { LiveActivity } from "./live-activity";
import { RevenueChart } from "./revenue-chart";
import { HourlyHeatmap } from "./hourly-heatmap";
import { ReservationsWidget } from "./reservations-widget";
import { OnboardingWidget } from "./onboarding-widget";
import { IOSBadge } from "@/components/ui/ios-badge";
import { IOSButton } from "@/components/ui/ios-button";
import { useTheme } from "@/components/theme-provider";
import {
  DollarSign, ShoppingBag, Users, Clock, CalendarCheck,
  ExternalLink, Copy, Check, Sun, Moon, Zap, QrCode,
  ArrowUpRight, TrendingUp, ChefHat
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function StoreHeader() {
  const [copied, setCopied] = useState(false);
  const { isDark, toggleDark } = useTheme();
  const storeSlug = "lumina-bistro";
  const url = `localhost:8080/shop/${storeSlug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(`http://${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <div className="glass-card p-5 overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#190E85] via-[#2D1B9E] to-[#00E0FF] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
                L
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-card flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight">Lumina Bistro</h2>
                <IOSBadge variant="success" size="sm">Open</IOSBadge>
              </div>
              <button onClick={copyUrl} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group mt-1">
                <ExternalLink className="h-3 w-3" />
                <span className="font-mono">{url}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <IOSButton variant="subtle" size="pill" className="gap-1.5">
              <QrCode className="h-3.5 w-3.5" /> QR Codes
            </IOSButton>
            <IOSButton variant="subtle" size="pill" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Quick Order
            </IOSButton>
            <a href={`http://${url}`} target="_blank" rel="noopener noreferrer">
              <IOSButton variant="gradient" size="pill" className="gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5" /> Preview Site
              </IOSButton>
            </a>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleDark} className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-border/50 flex-wrap">
          {[
            { label: "Today's Revenue", value: "$1,240", change: "+12%", positive: true },
            { label: "Active Orders", value: "8", change: "3 pending", positive: true },
            { label: "Table Turnover", value: "4.2x", change: "+0.3", positive: true },
            { label: "Avg Rating", value: "4.8", change: "128 reviews", positive: true },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-sm font-bold">{stat.value}</span>
              <span className={cn("text-[10px] font-medium", stat.positive ? "text-emerald-500" : "text-red-500")}>{stat.change}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function RestaurantDashboard() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <StoreHeader />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Revenue" value={5260} prefix="$" previousValue={4700} delay={0} icon={<DollarSign className="h-4 w-4" />} progress={{ current: 5260, max: 8000 }} progressColor="#190E85" />
        <KpiCard label="Orders" value={19} previousValue={18} delay={1} icon={<ShoppingBag className="h-4 w-4" />} progress={{ current: 19, max: 30 }} progressColor="#00E0FF" />
        <KpiCard label="Avg Order" value={276} prefix="$" previousValue={268} delay={2} icon={<DollarSign className="h-4 w-4" />} sparklineData={[40,60,45,80,65,90,70]} />
        <KpiCard label="Customers" value={14} previousValue={12} delay={3} icon={<Users className="h-4 w-4" />} progress={{ current: 14, max: 25 }} progressColor="#03CF94" />
        <KpiCard label="Prep Time" value={18} suffix="min" previousValue={22} delay={4} icon={<Clock className="h-4 w-4" />} progress={{ current: 18, max: 30 }} progressColor="#F59E0B" />
        <KpiCard label="Reservations" value={7} previousValue={4} delay={5} icon={<CalendarCheck className="h-4 w-4" />} progress={{ current: 7, max: 12 }} progressColor="#CF00FF" />
      </div>
      <AiBriefing />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <div><HourlyHeatmap isDark={isDark} /></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <LiveActivity />
        <ReservationsWidget />
        <OnboardingWidget />
      </div>
    </div>
  );
}
