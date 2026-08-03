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