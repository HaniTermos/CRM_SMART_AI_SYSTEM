import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/_admin/ai")({
  component: AiPage,
});

function AiPage() {
  const { data: store } = useMyStore();

  const { data: reengagement = [] } = useQuery({
    queryKey: ["ai-reengagement", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/ai/${store!.id}/reengagement`);
      return res.data.data;
    },
  });

  const { data: recentInsights = [] } = useQuery({
    queryKey: ["ai-recent-insights", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/ai/${store!.id}/recent-insights`);
      return res.data.data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <header>
        <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" /> AI assistant
        </h1>
        <p className="mt-1 text-muted-foreground">
          Surfaced candidates and recent insights. Open a customer to generate a follow-up email.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4" /> Re-engagement candidates
        </h2>
        <p className="text-sm text-muted-foreground">
          Customers who haven't ordered in 30+ days, sorted by lifetime value.
        </p>
        {reengagement.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No candidates yet.</CardContent></Card>
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
                  {reengagement.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="p-3">
                        <Link to="/customers/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">
                          {c.name ?? "Unnamed"}
                        </Link>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </td>
                      <td className="p-3"><Badge variant="secondary">{c.segment}</Badge></td>
                      <td className="p-3">{c.total_orders}</td>
                      <td className="p-3">{store?.currency} {Number(c.total_spent).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">
                        {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Recent insights</h2>
        {recentInsights.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No AI insights yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {recentInsights.map((i) => (
              <Card key={i.id}>
                <CardContent className="space-y-1 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <Link
                      to="/customers/$id"
                      params={{ id: i.customer_id ?? "" }}
                      className="text-primary hover:underline"
                    >
                      Open customer
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(i.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p>{i.summary}</p>
                  <p className="text-muted-foreground"><span className="font-medium text-foreground">Next:</span> {i.next_action}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
