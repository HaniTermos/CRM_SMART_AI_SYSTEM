"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrders, type AdminOrder } from "@/lib/use-orders";
import { useMyStore } from "@/lib/use-my-store";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function aggregateRevenue(orders: AdminOrder[], days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const buckets = new Map<string, { label: string; revenue: number; orders: number; prev: number }>();
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const label = days === 7 ? DAY_NAMES[d.getDay()] : `${d.getDate()}`;
    buckets.set(key, { label, revenue: 0, orders: 0, prev: 0 });
  }

  for (const order of orders) {
    if (!order.created_at || order.status === "cancelled") continue;
    const d = new Date(order.created_at);
    const key = d.toISOString().split("T")[0];
    if (buckets.has(key)) {
      buckets.get(key)!.revenue += Number(order.total) || 0;
      buckets.get(key)!.orders += 1;
    }
  }

  // Previous period comparison: same number of days immediately before
  const prevBuckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(prevStart);
    d.setDate(d.getDate() + i);
    prevBuckets.set(d.toISOString().split("T")[0], 0);
  }
  for (const order of orders) {
    if (!order.created_at || order.status === "cancelled") continue;
    const d = new Date(order.created_at);
    const key = d.toISOString().split("T")[0];
    if (prevBuckets.has(key)) {
      prevBuckets.set(key, (prevBuckets.get(key) || 0) + Number(order.total));
    }
  }
  const prevAvg = Array.from(prevBuckets.values()).reduce((s, v) => s + v, 0) / days;

  const data = Array.from(buckets.values());
  // Smooth previous period line as a flat baseline approximation
  data.forEach((d) => {
    d.prev = Math.round(prevAvg);
  });
  return data;
}

export function RevenueChart() {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("7D");
  const { data: store } = useMyStore();
  const { data: orders = [], isLoading, isError } = useOrders();

  const currency = store?.currency || "USD";
  const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
  const data = useMemo(() => aggregateRevenue(orders, days), [orders, days]);
  const total = useMemo(() => data.reduce((s, d) => s + d.revenue, 0), [data]);
  const prevTotal = useMemo(() => data.reduce((s, d) => s + d.prev, 0), [data]);
  const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">Revenue</h3>
              {!isLoading && !isError && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                  growth >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                )}>
                  <TrendingUp className="h-3 w-3" />
                  {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : isError ? "Unable to load revenue data" : (
                <>
                  {formatCurrency(total, currency)} this period · {formatCurrency(total / (data.length || 1), currency)} avg/day
                </>
              )}
            </p>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["7D", "30D", "90D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                disabled={isLoading || isError}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  range === r
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  (isLoading || isError) && "opacity-50 cursor-not-allowed"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[260px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
            Could not load revenue data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#190E85" stopOpacity={0.12} />
                  <stop offset="50%" stopColor="#190E85" stopOpacity={0.04} />
                  <stop offset="95%" stopColor="#190E85" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E0FF" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#00E0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px 16px",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  name === "revenue" ? "Revenue" : "Previous period",
                ]}
                labelStyle={{ color: "var(--muted-foreground)", fontSize: 12, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="prev"
                stroke="#00E0FF"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                fill="url(#colorPrev)"
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#190E85"
                strokeWidth={2.5}
                fill="url(#colorRev)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </IOSCard>
    </motion.div>
  );
}
