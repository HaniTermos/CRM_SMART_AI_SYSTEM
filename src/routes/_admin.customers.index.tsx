import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_admin/customers/")({
  component: CustomersList,
});

const segmentVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "secondary",
  active: "default",
  vip: "default",
  at_risk: "outline",
  churned: "destructive",
};

function CustomersList() {
  const { data: store } = useMyStore();
  const [q, setQ] = useState("");

  type CustomerRow = { id: string; name: string | null; phone: string; email: string | null; segment: string; total_orders: number; total_spent: number; last_order_at: string | null };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/customers/${store!.id}`);
      return res.data.data as CustomerRow[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email].filter(Boolean).some((v) => v!.toString().toLowerCase().includes(s)),
    );
  }, [customers, q]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="mt-1 text-muted-foreground">
            {customers.length} total · {customers.filter((c) => c.total_orders === 0).length} never ordered
          </p>
        </div>
        <Input
          placeholder="Search name, phone, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xs"
        />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            {customers.length === 0 ? "No customers yet — share your shop link to get orders." : "No matches."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Segment</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Spent</th>
                  <th className="p-3">Last order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.id} className={`border-b last:border-0 hover:bg-accent/40 ${c.total_orders === 0 ? 'bg-amber-50/40' : ''}`}>
                    <td className="p-3">
                      <Link to="/customers/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">
                        {c.name ?? "Unnamed"}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.phone}</div>
                      {c.total_orders === 0 && (
                        <Badge variant="outline" className="mt-1 text-[10px] border-amber-300 text-amber-700">Never ordered</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={segmentVariant[c.segment] ?? "secondary"}>{c.segment}</Badge>
                    </td>
                    <td className="p-3">{c.total_orders}</td>
                    <td className="p-3">{store?.currency} {Number(c.total_spent).toFixed(2)}</td>
                    <td className="p-3 text-muted-foreground">
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
