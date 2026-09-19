import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/orders/")({
  component: OrdersList,
});

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

function OrdersList() {
  const { data: store } = useMyStore();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/orders/${store!.id}`);
      return res.data.data.map((o: any) => ({
        ...o,
        customers: { name: o.customer_name, phone: o.customer_phone },
      }));
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-muted-foreground">Cash on delivery — confirm, ship, deliver.</p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No orders yet. Share your store link to start selling.
            {store ? (
              <div className="mt-2 font-mono text-sm">
                /shop/{store.slug}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: { id: string; order_number: string; status: string; total: number | string; created_at: string; customers?: unknown }) => {
                  const cust = Array.isArray(o.customers) ? o.customers[0] : (o.customers as { name: string | null; phone: string } | null);
                  return (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="p-3 font-mono">
                        <Link to="/orders/$id" params={{ id: o.id }} className="text-primary hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="p-3">
                        <div>{cust?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{cust?.phone}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant[o.status] ?? "secondary"}>{o.status}</Badge>
                      </td>
                      <td className="p-3">{store?.currency} {Number(o.total).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
