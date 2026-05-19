import { useState } from "react";
import { createFileRoute, Link, useParams, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { lookupOrder } from "@/lib/order-lookup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, CheckCircle2, Circle, Truck, XCircle, Clock } from "lucide-react";

const searchSchema = z.object({
  o: z.string().optional(),
  p: z.string().optional(),
});

export const Route = createFileRoute("/shop/$slug/track")({
  validateSearch: searchSchema,
  component: TrackPage,
});

type LookupResult = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof lookupOrder>>>>;

function TrackPage() {
  const { slug } = useParams({ from: "/shop/$slug/track" });
  const navigate = useNavigate();
  const search = useSearch({ from: "/shop/$slug/track" });
  const lookupFn = useServerFn(lookupOrder);

  const [orderNumber, setOrderNumber] = useState(search.o ?? "");
  const [phone, setPhone] = useState(search.p ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      const res = await lookupFn({
        data: { storeSlug: slug, orderNumber, phone },
      });
      setResult(res);
      navigate({
        to: "/shop/$slug/track",
        params: { slug },
        search: { o: orderNumber, p: phone },
        replace: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-2 text-2xl font-bold">Track your order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your order number and the phone number you used at checkout.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-lg border bg-card p-5">
        <div className="grid gap-2">
          <Label>Order number</Label>
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="ORD-XXXX-XXXX"
            maxLength={80}
          />
        </div>
        <div className="grid gap-2">
          <Label>Phone number</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            maxLength={40}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Looking up…" : "Track order"}
        </Button>
      </form>

      {result && !result.ok ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error}
        </div>
      ) : null}

      {result && result.ok ? <OrderDetails result={result} /> : null}

      <div className="text-center">
        <Link to="/shop/$slug" params={{ slug }} className="text-sm text-muted-foreground underline">
          Back to shop
        </Link>
      </div>
    </div>
  );
}

function OrderDetails({ result }: { result: Extract<LookupResult, { ok: true }> }) {
  const { order, items, store, customer } = result;
  const addr = order.shipping_address as Record<string, string> | null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="font-mono">{order.order_number}</span>
          <StatusBadge status={order.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <StatusTimeline status={order.status} />

        <div className="text-sm">
          <p className="text-muted-foreground">Placed on</p>
          <p>{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Items
          </h3>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between gap-2">
              <span className="truncate">
                {i.product_name} × {i.quantity}
              </span>
              <span>
                {store.currency} {Number(i.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="space-y-1 border-t pt-2">
            <Row label="Subtotal" value={`${store.currency} ${order.subtotal.toFixed(2)}`} />
            {order.discount_amount > 0 ? (
              <Row
                label={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`}
                value={`−${store.currency} ${order.discount_amount.toFixed(2)}`}
                tone="positive"
              />
            ) : null}
            <Row label="Shipping" value={`${store.currency} ${order.shipping_fee.toFixed(2)}`} />
            <Row
              label="Total"
              value={`${store.currency} ${order.total.toFixed(2)}`}
              bold
            />
          </div>
        </div>

        {addr ? (
          <div className="text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Delivering to
            </h3>
            <p className="mt-1">{customer.name}</p>
            <p className="text-muted-foreground">
              {[addr.line1, addr.line2, addr.city, addr.region, addr.postal_code, addr.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        ) : null}

        {order.notes ? (
          <div className="text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <p className="mt-1 text-muted-foreground">{order.notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "positive";
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "border-t pt-2 text-base font-semibold" : ""} ${
        tone === "positive" ? "text-green-600" : ""
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    confirmed: { label: "Confirmed", variant: "default" },
    shipped: { label: "Shipped", variant: "default" },
    delivered: { label: "Delivered", variant: "default" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        <XCircle className="h-4 w-4" />
        <span>This order was cancelled.</span>
      </div>
    );
  }
  const steps = [
    { key: "pending", label: "Placed", icon: Clock },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];
  const currentIdx = Math.max(0, steps.findIndex((s) => s.key === status));
  return (
    <ol className="flex items-center justify-between gap-2">
      {steps.map((s, idx) => {
        const active = idx <= currentIdx;
        const Icon = active ? s.icon : Circle;
        return (
          <li key={s.key} className="flex flex-1 flex-col items-center gap-1 text-center">
            <Icon
              className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground/40"}`}
            />
            <span
              className={`text-[11px] ${
                active ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
