import { useState, useEffect } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { AiInsightCard } from "@/components/admin/AiInsightCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/customers/$id")({
  component: CustomerDetail,
});

const SEGMENTS = ["new", "active", "vip", "at_risk", "churned"] as const;

function CustomerDetail() {
  const { id } = useParams({ from: "/_admin/customers/$id" });
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!store) return null;
      const res = await api.get(`/customers/${store.id}/${id}`);
      return res.data.data;
    },
    enabled: !!store,
  });

  useEffect(() => {
    if (customer && !notesDirty) setNotes(customer.notes ?? "");
  }, [customer, notesDirty]);

  const { data: orders = [] } = useQuery({
    queryKey: ["customer-orders", id],
    queryFn: async () => {
      if (!store) return [];
      const res = await api.get(`/orders/${store.id}`);
      return res.data.data.filter((o: any) => o.customer_id === id);
    },
    enabled: !!store,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["customer-activities", id],
    queryFn: async () => {
      if (!store) return [];
      const res = await api.get(`/customers/${store.id}/${id}/history`);
      return res.data.data;
    },
    enabled: !!store,
  });

  const saveSegment = useMutation({
    mutationFn: async (segment: (typeof SEGMENTS)[number]) => {
      if (!store) throw new Error("No store");
      await api.put(`/customers/${store.id}/${id}`, { segment });
    },
    onSuccess: () => {
      toast.success("Segment updated");
      qc.invalidateQueries({ queryKey: ["customer", id] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No store");
      await api.put(`/customers/${store.id}/${id}`, { notes });
      await api.post(`/customers/${store.id}/${id}/activity`, {
        type: "note_added",
        payload: { length: notes.length },
      });
    },
    onSuccess: () => {
      toast.success("Notes saved");
      setNotesDirty(false);
      qc.invalidateQueries({ queryKey: ["customer", id] });
      qc.invalidateQueries({ queryKey: ["customer-activities", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!customer) return <div className="p-10">Customer not found.</div>;

  const avgOrder =
    customer.total_orders > 0 ? Number(customer.total_spent) / customer.total_orders : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <Link to="/customers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to customers
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name ?? "Unnamed"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" />{customer.phone}
            </a>
            {customer.email ? (
              <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Mail className="h-3.5 w-3.5" />{customer.email}
              </a>
            ) : null}
            <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{customer.segment}</Badge>
          <Select value={customer.segment} onValueChange={(v) => saveSegment.mutate(v as (typeof SEGMENTS)[number])}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Orders" value={customer.total_orders} />
        <Kpi label="Lifetime spend" value={`${store?.currency ?? ""} ${Number(customer.total_spent).toFixed(2)}`} />
        <Kpi label="Avg order" value={`${store?.currency ?? ""} ${avgOrder.toFixed(2)}`} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section>
            <h2 className="mb-3 font-semibold">Orders</h2>
            {orders.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">No orders.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                      <tr>
                        <th className="p-3">Order</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0 hover:bg-accent/40">
                          <td className="p-3 font-mono">
                            <Link to="/orders/$id" params={{ id: o.id }} className="text-primary hover:underline">
                              {o.order_number}
                            </Link>
                          </td>
                          <td className="p-3"><Badge variant="secondary">{o.status}</Badge></td>
                          <td className="p-3">{store?.currency} {Number(o.total).toFixed(2)}</td>
                          <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Activity</h2>
            <Card>
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="divide-y">
                    {activities.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 p-4 text-sm">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{formatActivity(a.type, a.payload)}</div>
                          <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="space-y-4">
          <AiInsightCard customerId={customer.id} storeId={store!.id} customerEmail={customer.email ?? null} />
          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="font-semibold">Internal notes</h3>
              <Textarea
                rows={8}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="Preferences, delivery quirks, follow-up ideas…"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!notesDirty || saveNotes.isPending}
                onClick={() => saveNotes.mutate()}
              >
                {saveNotes.isPending ? "Saving…" : "Save notes"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatActivity(type: string, payload: unknown) {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (type) {
    case "order_placed":
      return `Order placed — ${p.order_number ?? ""}`;
    case "order_status_changed":
      return `Order status changed to ${p.status ?? ""}`;
    case "note_added":
      return "Note updated";
    default:
      return type;
  }
}
