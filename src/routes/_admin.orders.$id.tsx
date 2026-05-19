import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/orders/$id")({
  component: OrderDetail,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function OrderDetail() {
  const { id } = useParams({ from: "/_admin/orders/$id" });
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, subtotal, shipping_fee, total, shipping_address, notes, created_at, store_id, customer_id, customers(id, name, phone, email)"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, unit_price, quantity, subtotal")
        .eq("order_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: (typeof STATUSES)[number]) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      // Activity log
      if (order?.customer_id && order?.store_id) {
        await supabase.from("customer_activities").insert({
          store_id: order.store_id,
          customer_id: order.customer_id,
          type: "order_status_changed",
          payload: { order_id: id, status },
        });
      }
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!order) return <div className="p-10">Order not found.</div>;

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const addr = (order.shipping_address ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div>
        <Link to="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to orders
        </Link>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{order.status}</Badge>
          <Select value={order.status} onValueChange={(v) => updateStatus.mutate(v as (typeof STATUSES)[number])}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="p-3">{i.product_name}</td>
                    <td className="p-3">{i.quantity}</td>
                    <td className="p-3">{store?.currency} {Number(i.unit_price).toFixed(2)}</td>
                    <td className="p-3">{store?.currency} {Number(i.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 border-t p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{store?.currency} {Number(order.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{store?.currency} {Number(order.shipping_fee).toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span><span>{store?.currency} {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-1 p-4 text-sm">
              <h3 className="mb-2 font-semibold">Customer</h3>
              <div>{customer?.name ?? "—"}</div>
              <div className="text-muted-foreground">{customer?.phone}</div>
              {customer?.email ? <div className="text-muted-foreground">{customer.email}</div> : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4 text-sm">
              <h3 className="mb-2 font-semibold">Shipping address</h3>
              <div>{addr.line1}</div>
              {addr.line2 ? <div>{addr.line2}</div> : null}
              <div>{[addr.city, addr.region, addr.postal_code].filter(Boolean).join(", ")}</div>
              {addr.country ? <div>{addr.country}</div> : null}
            </CardContent>
          </Card>
          {order.notes ? (
            <Card>
              <CardContent className="space-y-1 p-4 text-sm">
                <h3 className="mb-2 font-semibold">Notes</h3>
                <p className="whitespace-pre-line text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className="space-y-1 p-4 text-sm">
              <h3 className="mb-2 font-semibold">Payment</h3>
              <p className="text-muted-foreground">Cash on delivery</p>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full" asChild>
            <a href={`tel:${customer?.phone ?? ""}`}>Call customer</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
