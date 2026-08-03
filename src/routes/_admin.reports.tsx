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
