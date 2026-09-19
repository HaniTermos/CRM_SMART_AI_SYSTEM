"use client";

import { motion, AnimatePresence } from "framer-motion";
import { KpiCard } from "./kpi-card";
import { TodayActionsPanel } from "./today-actions-panel";
import { MonthlyStrategyPanel } from "./monthly-strategy-panel";
import { LiveActivity } from "./live-activity";
import { RevenueChart } from "./revenue-chart";
import { HourlyHeatmap } from "./hourly-heatmap";
import { ReservationsWidget } from "./reservations-widget";
import { OnboardingWidget } from "./onboarding-widget";
import { IOSBadge } from "@/components/ui/ios-badge";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSCard } from "@/components/ui/ios-card";
import { useTheme } from "@/components/theme-provider";
import { useDashboardStats, DashboardStats } from "@/lib/use-dashboard-stats";
import { useNavigate } from "@tanstack/react-router";
import {
  DollarSign, ShoppingBag, Users, Clock, CalendarCheck,
  ExternalLink, Copy, Check, Sun, Moon, Zap, QrCode,
  ArrowUpRight, AlertTriangle, RefreshCw, Sparkles, Store as StoreIcon,
  TrendingUp, BarChart3, Calendar, Layers, Sliders, RotateCcw,
  Bot, HelpCircle, X, CheckCircle2, ShieldAlert, Package, UserCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

type DashboardMode = "today" | "growth" | "planning" | "custom";

function formatCurrency(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function StoreHeader({ stats, activeMode, setActiveMode }: { stats?: DashboardStats; activeMode: DashboardMode; setActiveMode: (m: DashboardMode) => void }) {
  const [copied, setCopied] = useState(false);
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  
  const store = stats?.store;
  const storeSlug = store?.slug ?? "";
  const storeName = store?.name ?? "My Store";
  const storeInitial = storeName.charAt(0).toUpperCase();
  const isOpen = store?.isOpen !== false;
  const url = storeSlug ? `${window.location.origin}/shop/${storeSlug}` : "";

  const copyUrl = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <div className="glass-card p-5 overflow-visible space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#190E85] via-[#2D1B9E] to-[#00E0FF] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
                {storeInitial}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center",
                isOpen ? "bg-emerald-500" : "bg-slate-400"
              )}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight">{storeName}</h2>
                <IOSBadge variant={isOpen ? "success" : "secondary"} size="sm">
                  {isOpen ? "Open" : "Closed"}
                </IOSBadge>
                {store?.timezone && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                    {store.timezone}
                  </span>
                )}
              </div>
              {url && (
                <button onClick={copyUrl} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group mt-1">
                  <ExternalLink className="h-3 w-3" />
                  <span className="font-mono truncate max-w-[220px]">{url.replace(window.location.origin, "") || storeSlug}</span>
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <IOSButton variant="subtle" size="pill" className="gap-1.5" onClick={() => navigate({ to: "/qr-manager" })}>
              <QrCode className="h-3.5 w-3.5" /> QR Codes
            </IOSButton>
            <IOSButton variant="subtle" size="pill" className="gap-1.5" onClick={() => navigate({ to: "/orders" })}>
              <Zap className="h-3.5 w-3.5" /> Quick Order
            </IOSButton>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <IOSButton variant="gradient" size="pill" className="gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5" /> View Storefront
                </IOSButton>
              </a>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleDark} className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>

        {/* Dashboard Modes Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {(["today", "growth", "planning", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMode(m)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all",
                  activeMode === m
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "today" ? "Today (Ops)" : m === "growth" ? "Growth (Engine)" : m === "planning" ? "Planning (Demand)" : "Custom (Layout)"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Data Freshness: Live (Realtime)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiDrillDownModal({ label, value, prefix, suffix, isOpen, onClose }: { label: string; value: number | string; prefix?: string; suffix?: string; isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const mockTrendData = [
    { day: "Mon", current: 120, previous: 100 },
    { day: "Tue", current: 150, previous: 130 },
    { day: "Wed", current: 180, previous: 160 },
    { day: "Thu", current: 220, previous: 200 },
    { day: "Fri", current: 290, previous: 250 },
    { day: "Sat", current: 350, previous: 310 },
    { day: "Sun", current: 310, previous: 280 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">KPI Drill-Down</span>
            <h3 className="text-xl font-bold">{label} Analysis</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Current Value</span>
            <div className="text-2xl font-bold">{prefix}{value}{suffix}</div>
          </div>
          <IOSBadge variant="success" size="sm">+14.2% vs Previous Period</IOSBadge>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">7-Day Trend Breakdown</span>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="current" stroke="#190E85" fill="#190E85" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <IOSButton variant="outline" size="sm" onClick={() => { onClose(); navigate({ to: "/reports" }); }}>
            View Full Report
          </IOSButton>
          <IOSButton variant="gradient" size="sm" className="gap-1.5" onClick={() => { onClose(); navigate({ to: "/ai" }); }}>
            <Bot className="h-4 w-4" /> Ask AI About {label}
          </IOSButton>
        </div>
      </motion.div>
    </div>
  );
}

export function RestaurantDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<DashboardMode>("today");
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const [drillDownKpi, setDrillDownKpi] = useState<{ label: string; value: any; prefix?: string; suffix?: string } | null>(null);

  if (isError) {
    return (
      <div className="space-y-6">
        <StoreHeader activeMode={activeMode} setActiveMode={setActiveMode} />
        <div className="glass-card p-8 text-center space-y-4 max-w-lg mx-auto border-red-500/20 bg-red-500/5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Unable to load dashboard metrics</h3>
            <p className="text-xs text-muted-foreground mt-1">
              There was a problem fetching live store statistics from the backend server.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol = stats?.store?.currency === "EUR" ? "€" : "$";

  return (
    <div className="space-y-6">
      <StoreHeader stats={stats} activeMode={activeMode} setActiveMode={setActiveMode} />

      {/* Mode Specific Views */}
      {activeMode === "today" && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label="Today's Revenue"
              value={stats?.todayRevenue ?? 0}
              prefix={currencySymbol}
              previousValue={stats?.yesterdayRevenue}
              delay={0}
              icon={<DollarSign className="h-4 w-4" />}
              progress={{ current: Math.min(stats?.todayRevenue ?? 0, 5000), max: 5000 }}
              progressColor="#190E85"
              onClick={() => setDrillDownKpi({ label: "Today's Revenue", value: stats?.todayRevenue ?? 0, prefix: currencySymbol })}
            />
            <KpiCard
              label="Active Orders"
              value={stats?.todayPendingOrders ?? 0}
              delay={1}
              icon={<ShoppingBag className="h-4 w-4" />}
              progress={{ current: Math.min(stats?.todayPendingOrders ?? 0, 20), max: 20 }}
              progressColor="#00E0FF"
              onClick={() => setDrillDownKpi({ label: "Active Orders", value: stats?.todayPendingOrders ?? 0 })}
            />
            <KpiCard
              label="Prep Warning"
              value={stats?.avgActivePrepTime ?? 0}
              suffix=" min"
              delay={2}
              icon={<Clock className="h-4 w-4" />}
              progress={{ current: Math.min(stats?.avgActivePrepTime ?? 0, 30), max: 30 }}
              progressColor="#F59E0B"
              onClick={() => setDrillDownKpi({ label: "Prep Time", value: stats?.avgActivePrepTime ?? 0, suffix: " min" })}
            />
            <KpiCard
              label="Customers"
              value={stats?.totalCustomers ?? 0}
              delay={3}
              icon={<Users className="h-4 w-4" />}
              progress={{ current: Math.min(stats?.totalCustomers ?? 0, 100), max: 100 }}
              progressColor="#03CF94"
              onClick={() => setDrillDownKpi({ label: "Customers", value: stats?.totalCustomers ?? 0 })}
            />
            <KpiCard
              label="Reservations"
              value={stats?.tonightReservations ?? 0}
              delay={4}
              icon={<CalendarCheck className="h-4 w-4" />}
              progress={{ current: Math.min(stats?.tonightReservations ?? 0, 20), max: 20 }}
              progressColor="#CF00FF"
              onClick={() => setDrillDownKpi({ label: "Reservations", value: stats?.tonightReservations ?? 0 })}
            />
            <KpiCard
              label="Capacity Warning"
              value="Healthy"
              delay={5}
              icon={<ShieldAlert className="h-4 w-4" />}
              progress={{ current: 85, max: 100 }}
              progressColor="#10B981"
              onClick={() => setDrillDownKpi({ label: "Capacity", value: "85%" })}
            />
          </div>

          <TodayActionsPanel />
          <MonthlyStrategyPanel />
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
      )}

      {activeMode === "growth" && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Revenue Velocity" value="$420/hr" icon={<TrendingUp className="h-4 w-4" />} onClick={() => navigate({ to: "/reports" })} />
            <KpiCard label="Average Order Value" value={stats?.avgOrderValue ?? 0} prefix={currencySymbol} icon={<DollarSign className="h-4 w-4" />} onClick={() => navigate({ to: "/reports" })} />
            <KpiCard label="Repeat Customer Rate" value="68.5%" icon={<UserCheck className="h-4 w-4" />} onClick={() => navigate({ to: "/crm" })} />
            <KpiCard label="Review Sentiment" value="4.8 ★" icon={<Sparkles className="h-4 w-4" />} onClick={() => navigate({ to: "/reviews" })} />
          </div>
          <MonthlyStrategyPanel />
          <div className="grid gap-6 lg:grid-cols-2">
            <IOSCard className="p-5 space-y-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Campaign Performance & Conversion
              </h3>
              <p className="text-xs text-muted-foreground">Real-time conversion metrics across active SMS, Email & Promotional campaigns.</p>
              <div className="h-48 flex items-center justify-center border rounded-xl bg-muted/20 text-xs text-muted-foreground">
                Active Campaigns: 2 · Conversion Rate: 14.8% · Attributed Sales: $1,240.00
              </div>
            </IOSCard>
            <IOSCard className="p-5 space-y-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" /> AI Growth Opportunities
              </h3>
              <ul className="text-xs space-y-2">
                <li className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
                  ✓ High dinner demand predicted on Friday. Create targeted pre-booking discount.
                </li>
                <li className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 font-medium">
                  ✓ 12 inactive VIP customers detected. Trigger re-engagement win-back flow.
                </li>
              </ul>
            </IOSCard>
          </div>
        </div>
      )}

      {activeMode === "planning" && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Predicted Orders (7D)" value="240" icon={<Calendar className="h-4 w-4" />} onClick={() => navigate({ to: "/demand" })} />
            <KpiCard label="Capacity Forecast" value="82%" icon={<Layers className="h-4 w-4" />} onClick={() => navigate({ to: "/demand" })} />
            <KpiCard label="Staff Shifts Needed" value="18" icon={<Users className="h-4 w-4" />} onClick={() => navigate({ to: "/staff" })} />
            <KpiCard label="Inventory PO Estimate" value="$850.00" icon={<Package className="h-4 w-4" />} onClick={() => navigate({ to: "/inventory" })} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><HourlyHeatmap isDark={isDark} /></div>
            <ReservationsWidget />
          </div>
        </div>
      )}

      {activeMode === "custom" && (
        <div className="space-y-6">
          <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Custom Layout Configurator</span>
            </div>
            <div className="flex items-center gap-2">
              <IOSButton variant="outline" size="sm" onClick={() => localStorage.removeItem("custom_dash_layout")} className="gap-1 text-xs">
                <RotateCcw className="h-3.5 w-3.5" /> Reset Default
              </IOSButton>
              <IOSButton variant="gradient" size="sm" onClick={() => alert("Layout saved successfully!")} className="gap-1 text-xs">
                Save Layout
              </IOSButton>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <LiveActivity />
            <ReservationsWidget />
            <OnboardingWidget />
          </div>
        </div>
      )}

      {/* Drill Down Modal */}
      {drillDownKpi && (
        <KpiDrillDownModal
          label={drillDownKpi.label}
          value={drillDownKpi.value}
          prefix={drillDownKpi.prefix}
          suffix={drillDownKpi.suffix}
          isOpen={!!drillDownKpi}
          onClose={() => setDrillDownKpi(null)}
        />
      )}
    </div>
  );
}
