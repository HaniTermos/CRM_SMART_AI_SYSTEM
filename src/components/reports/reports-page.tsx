"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSBadge } from "@/components/ui/ios-badge";
import { GlassTable, GlassTableRow, GlassTableCell } from "@/components/ui/glass-table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Calendar,
  Download, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const REVENUE_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  revenue: 200 + Math.random() * 800,
  orders: Math.floor(5 + Math.random() * 20),
}));

const CATEGORY_DATA = [
  { name: "Main Dishes", value: 4200, color: "#190E85" },
  { name: "Appetizers", value: 1800, color: "#00E0FF" },
  { name: "Desserts", value: 1200, color: "#CF00FF" },
  { name: "Beverages", value: 900, color: "#03CF94" },
  { name: "Sides", value: 600, color: "#F59E0B" },
];

const TOP_PRODUCTS = [
  { name: "Shawarma Plate", qty: 89, revenue: 1780, trend: "+12%" },
  { name: "Mixed Grill", qty: 56, revenue: 1680, trend: "+8%" },
  { name: "Fattoush Salad", qty: 72, revenue: 720, trend: "+15%" },
  { name: "Kunafa", qty: 45, revenue: 540, trend: "+22%" },
  { name: "Lentil Soup", qty: 38, revenue: 304, trend: "-3%" },
];

const CHANNEL_DATA = [
  { name: "Dine-in", value: 65 },
  { name: "Takeaway", value: 25 },
  { name: "Delivery", value: 10 },
];

export function ReportsPage() {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("30D");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Last 90 days of sales activity.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["7D", "30D", "90D"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  range === r ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {r}
              </button>
            ))}
          </div>
          <button className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (90d)", value: "$5,260", change: "+11.9%", icon: <DollarSign className="h-4 w-4" />, positive: true },
          { label: "Paid Orders", value: "19", change: "+5.6%", icon: <ShoppingBag className="h-4 w-4" />, positive: true },
          { label: "Avg Order Value", value: "$276.84", change: "+3.0%", icon: <TrendingUp className="h-4 w-4" />, positive: true },
          { label: "Unique Customers", value: "14", change: "+16.7%", icon: <Users className="h-4 w-4" />, positive: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/8 text-primary">{kpi.icon}</div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold">{kpi.value}</p>
            <span className={cn("text-[10px] font-medium", kpi.positive ? "text-emerald-500" : "text-red-500")}>
              {kpi.change} vs last period
            </span>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-card p-5">
          <h3 className="font-semibold text-base mb-4">Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#190E85" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#190E85" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid var(--border)", background: "var(--card-solid)", boxShadow: "var(--shadow-lg)" }}
                formatter={(v: number) => [`$${v.toFixed(0)}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#190E85" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Two Column: Category + Channel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="glass-card p-5">
            <h3 className="font-semibold text-base mb-4">Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid var(--border)", background: "var(--card-solid)", boxShadow: "var(--shadow-lg)" }}
                  formatter={(v: number) => [`$${v}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {CATEGORY_DATA.map((cat) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[10px] text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="glass-card p-5">
            <h3 className="font-semibold text-base mb-4">Sales by Channel</h3>
            <div className="space-y-4">
              {CHANNEL_DATA.map((ch) => (
                <div key={ch.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{ch.name}</span>
                    <span className="text-sm font-bold">{ch.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ch.value}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[#190E85] to-[#00E0FF]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Products Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="glass-card p-5">
          <h3 className="font-semibold text-base mb-4">Top Products</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_100px_80px] gap-4 px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Product</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">Trend</span>
            </div>
            {TOP_PRODUCTS.map((p, i) => (
              <GlassTableRow key={p.name} delay={i * 0.05} className="grid-cols-[1fr_80px_100px_80px]">
                <GlassTableCell>
                  <span className="text-sm font-medium">{p.name}</span>
                </GlassTableCell>
                <GlassTableCell>
                  <span className="text-sm text-right block">{p.qty}</span>
                </GlassTableCell>
                <GlassTableCell>
                  <span className="text-sm font-semibold text-right block">${p.revenue}</span>
                </GlassTableCell>
                <GlassTableCell>
                  <span className={cn("text-xs font-medium text-right block", p.trend.startsWith("+") ? "text-emerald-500" : "text-red-500")}>
                    {p.trend}
                  </span>
                </GlassTableCell>
              </GlassTableRow>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
