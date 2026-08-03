"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const DATA_7D = [
  { day: "Mon", revenue: 420, orders: 12, prev: 380 },
  { day: "Tue", revenue: 680, orders: 19, prev: 550 },
  { day: "Wed", revenue: 550, orders: 15, prev: 600 },
  { day: "Thu", revenue: 890, orders: 24, prev: 720 },
  { day: "Fri", revenue: 1200, orders: 32, prev: 980 },
  { day: "Sat", revenue: 1450, orders: 41, prev: 1100 },
  { day: "Sun", revenue: 980, orders: 28, prev: 850 },
];

const DATA_30D = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  revenue: 300 + Math.random() * 1200,
  orders: Math.floor(8 + Math.random() * 35),
  prev: 250 + Math.random() * 1000,
}));

export function RevenueChart() {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("7D");
  const data = range === "7D" ? DATA_7D : range === "30D" ? DATA_30D : DATA_30D;
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const prevTotal = data.reduce((s, d) => s + d.prev, 0);
  const growth = ((total - prevTotal) / prevTotal) * 100;

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
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                +{growth.toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ${total.toFixed(0)} this period · ${(total / data.length).toFixed(0)} avg/day
            </p>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["7D", "30D", "90D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  range === r
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

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
              dataKey="day"
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
                `$${value.toFixed(0)}`,
                name === "revenue" ? "Revenue" : "Previous",
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
      </IOSCard>
    </motion.div>
  );
}
