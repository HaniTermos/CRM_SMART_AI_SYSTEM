<<<<<<< HEAD
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { db, type Order, type Customer } from "@/lib/db";
import { menuDb } from "@/lib/menu-db";

export const Route = createFileRoute("/_admin/reports")({
  component: ReportsRoute,
});

function ReportsRoute() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d">("7d");

  useEffect(() => {
    setOrders(db.orders.getAll());
    setCustomers(db.customers.getAll());
    setLoaded(true);
  }, []);

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const ms = {
      today: 86400000,
      "7d": 7 * 86400000,
      "30d": 30 * 86400000,
      "90d": 90 * 86400000,
    };
    const cutoff = now - ms[range];
    return orders.filter(
      (o) => new Date(o.createdAt).getTime() > cutoff && o.status !== "cancelled"
    );
  }, [orders, range]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((a, o) => a + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    const newCustomers = customers.filter((c) => c.segment === "new").length;

    // Top category by quantity sold
    const catMap: Record<string, number> = {};
    filteredOrders.forEach((o) =>
      o.items.forEach((i) => {
        const cat =
          menuDb.products.getAll().find((p) => p.name === i.name)?.categoryId ||
          "Other";
        catMap[cat] = (catMap[cat] || 0) + i.qty;
      })
    );
    const topCatEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCatEntry
      ? menuDb.categories.getAll().find((c) => c.id === topCatEntry[0])?.name ||
      "Other"
      : "N/A";

    // Hourly distribution (0-23)
    const hourly = Array(24).fill(0);
    filteredOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hourly[h] += o.total;
    });

    // Sales by type
    const typeMap: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      typeMap[o.type] = (typeMap[o.type] || 0) + o.total;
    });

    // Top products
    const prodMap: Record<string, { qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) =>
      o.items.forEach((i) => {
        if (!prodMap[i.name]) prodMap[i.name] = { qty: 0, revenue: 0 };
        prodMap[i.name].qty += i.qty;
        prodMap[i.name].revenue += i.qty * i.price;
      })
    );
    const topProducts = Object.entries(prodMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      avgOrder,
      newCustomers,
      topCategory,
      hourly,
      typeMap,
      topProducts,
    };
  }, [filteredOrders, customers]);

  const exportCSV = () => {
    const headers = "ID,Customer,Type,Status,Total,Date\n";
    const rows = filteredOrders
      .map(
        (o) =>
          `${o.id},${o.customer},${o.type},${o.status},${o.total},${o.createdAt}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${range}.csv`;
    a.click();
  };

  if (!loaded)
    return (
      <div className="h-96 flex items-center justify-center text-adaptive-muted">
        Loading reports...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-adaptive">
            Reports
          </h1>
          <p className="text-sm text-adaptive-muted">
            Real-time analytics for the last {range === "today" ? "24 hours" : range}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl glass-input p-1">
            {(["today", "7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${range === r
                    ? "bg-[#190E85] text-white shadow-md"
                    : "text-adaptive-muted hover:text-adaptive"
                  }`}
              >
                {r === "today" ? "Today" : r}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-adaptive text-adaptive text-sm font-medium hover:shadow-lg transition-shadow"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Revenue",
            value: `$${stats.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Orders",
            value: stats.totalOrders,
            icon: ShoppingCart,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Avg Order",
            value: `$${stats.avgOrder.toFixed(2)}`,
            icon: TrendingUp,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "New Guests",
            value: stats.newCustomers,
            icon: Users,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            className="p-4 rounded-2xl glass-adaptive flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-adaptive">{stat.value}</p>
              <p className="text-[11px] text-adaptive-muted">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Heatmap */}
        <div className="lg:col-span-2 rounded-3xl glass-adaptive p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-adaptive">
              Revenue by Hour
            </h3>
            <Calendar className="h-4 w-4 text-adaptive-muted" />
          </div>
          <div className="flex items-end gap-1 h-32">
            {stats.hourly.map((val, i) => {
              const max = Math.max(...stats.hourly, 1);
              const h = Math.round((val / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-[#190E85] to-[#00E0FF] opacity-80 group-hover:opacity-100 transition-opacity relative" style={{ height: `${h}%` }}>
                    {h > 30 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-adaptive font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${val.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-adaptive-muted">
                    {i.toString().padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Type Breakdown */}
        <div className="rounded-3xl glass-adaptive p-6 space-y-4">
          <h3 className="text-sm font-semibold text-adaptive">Sales by Type</h3>
          <div className="space-y-3">
            {Object.entries(stats.typeMap).map(([type, val]) => {
              const total = Object.values(stats.typeMap).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-adaptive capitalize">{type}</span>
                    <span className="text-adaptive-muted">${val.toFixed(0)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#190E85] to-[#CF00FF]"
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.typeMap).length === 0 && (
              <p className="text-xs text-adaptive-muted text-center py-4">
                No data for this period
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl glass-adaptive p-6 space-y-4">
          <h3 className="text-sm font-semibold text-adaptive">Top Products</h3>
          <div className="space-y-2">
            {stats.topProducts.map(([name, data], i) => (
              <div
                key={name}
                className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center text-white text-[10px] font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-adaptive truncate">
                    {name}
                  </p>
                  <p className="text-[10px] text-adaptive-muted">
                    {data.qty} sold
                  </p>
                </div>
                <span className="text-sm font-bold text-adaptive">
                  ${data.revenue.toFixed(2)}
                </span>
              </div>
            ))}
            {stats.topProducts.length === 0 && (
              <p className="text-xs text-adaptive-muted text-center py-4">
                No product data
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl glass-adaptive p-6 space-y-4">
          <h3 className="text-sm font-semibold text-adaptive">
            Category Insights
          </h3>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#190E85]/20 to-[#00E0FF]/20 flex items-center justify-center border-4 border-[#190E85]/10">
              <div className="text-center">
                <p className="text-2xl font-black text-adaptive">
                  {stats.topCategory}
                </p>
                <p className="text-[10px] text-adaptive-muted uppercase tracking-wider">
                  Top Category
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                <p className="text-lg font-bold text-adaptive">
                  {stats.totalOrders}
                </p>
                <p className="text-[10px] text-adaptive-muted">Orders</p>
              </div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                <p className="text-lg font-bold text-adaptive">
                  {customers.length}
                </p>
                <p className="text-[10px] text-adaptive-muted">Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
=======
import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_admin/reports")({
  component: ReportsPage,
});

type OrderRow = {
  id: string;
  total: number | string;
  status: string;
  created_at: string;
  order_items: Array<{ product_name: string; quantity: number; unit_price: number | string }> | null;
};

function ReportsPage() {
  const { data: store } = useMyStore();

  const { data: orders = [] } = useQuery({
    queryKey: ["reports-orders", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/reports/${store!.id}/orders-with-items`);
      return res.data.data;
    },
  });

  const { data: segs = [] } = useQuery({
    queryKey: ["reports-segments", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/reports/${store!.id}/segments`);
      return res.data.data;
    },
  });

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status !== "cancelled");
    const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
    const aov = paid.length ? revenue / paid.length : 0;

    // Daily revenue (last 30 days)
    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: toLocalDateStr(d), revenue: 0, orders: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i] as const));
    for (const o of paid) {
      const key = toLocalDateStr(new Date(o.created_at));
      const i = idx.get(key);
      if (i != null) {
        days[i].revenue += Number(o.total);
        days[i].orders += 1;
      }
    }

    // Top products
    const tally = new Map<string, { qty: number; revenue: number }>();
    for (const o of paid) {
      for (const it of o.order_items ?? []) {
        const cur = tally.get(it.product_name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.quantity * Number(it.unit_price);
        tally.set(it.product_name, cur);
      }
    }
    const topProducts = [...tally.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Status breakdown
    const statusMap = new Map<string, number>();
    for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);

    return { revenue, aov, paidCount: paid.length, days, topProducts, statusMap };
  }, [orders]);

  const segmentMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of segs) m.set(s.segment, (m.get(s.segment) ?? 0) + 1);
    return m;
  }, [segs]);

  const maxDayRev = Math.max(1, ...stats.days.map((d) => d.revenue));
  const cur = store?.currency ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <header>
        <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BarChart3 className="h-6 w-6 text-primary" /> Reports
        </h1>
        <p className="mt-1 text-muted-foreground">Last 90 days of sales activity.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Revenue (90d)" value={`${cur} ${stats.revenue.toFixed(2)}`} />
        <Kpi label="Paid orders" value={stats.paidCount} />
        <Kpi label="Avg order value" value={`${cur} ${stats.aov.toFixed(2)}`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Daily revenue (last 30 days)</CardTitle></CardHeader>
        <CardContent>
          {stats.paidCount === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No orders in the last 30 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Y-axis labels + chart area */}
              <div className="relative flex h-52 gap-1">
                {/* Y-axis */}
                <div className="flex w-10 flex-col justify-between py-1 text-right text-[10px] text-muted-foreground">
                  <span>{cur} {maxDayRev.toFixed(0)}</span>
                  <span>{cur} {(maxDayRev / 2).toFixed(0)}</span>
                  <span>0</span>
                </div>

                {/* Grid lines + bars */}
                <div className="relative flex flex-1 gap-[2px]">
                  {/* Horizontal grid lines */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    <div className="border-t border-dashed border-border/60" />
                    <div className="border-t border-dashed border-border/60" />
                    <div className="border-t border-border/60" />
                  </div>

                  {stats.days.map((d) => {
                    const heightPct = Math.min(100, (d.revenue / maxDayRev) * 100);
                    return (
                      <div
                        key={d.date}
                        className="group relative flex flex-1 flex-col justify-end"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ring-1 ring-border group-hover:block">
                          {d.date} · {cur} {d.revenue.toFixed(2)} · {d.orders} order{d.orders !== 1 ? "s" : ""}
                        </div>

                        {/* Bar track */}
                        <div className="relative flex h-full w-full flex-col justify-end rounded-sm bg-muted/40">
                          {/* Actual bar */}
                          <div
                            className="w-full rounded-sm bg-primary/80 transition-all group-hover:bg-primary"
                            style={{ height: `${heightPct}%`, minHeight: d.revenue > 0 ? 3 : 0 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex gap-[2px] pl-10">
                {stats.days.map((d, i) => {
                  const day = new Date(d.date + "T00:00:00").getDate();
                  const showLabel = i === 0 || i === stats.days.length - 1 || day === 1 || i % 5 === 0;
                  return (
                    <div key={d.date + "-x"} className="flex-1 text-center text-[10px] text-muted-foreground">
                      {showLabel ? day : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top products</CardTitle></CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr><th className="py-2">Product</th><th>Qty</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((p) => (
                    <tr key={p.name} className="border-b last:border-0">
                      <td className="py-2">{p.name}</td>
                      <td>{p.qty}</td>
                      <td>{cur} {p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customer segments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {segmentMap.size === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No customers yet.</p>
            ) : (
              [...segmentMap.entries()].map(([seg, n]) => (
                <div key={seg} className="flex items-center justify-between text-sm">
                  <Badge variant="secondary">{seg}</Badge>
                  <span className="font-medium">{n}</span>
                </div>
              ))
            )}
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Order status</p>
              <div className="flex flex-wrap gap-1.5">
                {[...stats.statusMap.entries()].map(([s, n]) => (
                  <Badge key={s} variant="outline">{s}: {n}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function toLocalDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
>>>>>>> ebf8e96b94724af6123191fffecb645770df3e69
