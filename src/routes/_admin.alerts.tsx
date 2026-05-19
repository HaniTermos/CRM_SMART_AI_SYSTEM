import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyStore } from "@/lib/use-my-store";
import { useAlerts, getReadIds, setReadIds, type Alert } from "@/lib/use-alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ShoppingCart, PackageX, UserRound, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_admin/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { data: store } = useMyStore();
  const { data: alerts = [], isLoading } = useAlerts();
  const [read, setRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (store?.id) setRead(getReadIds(store.id));
  }, [store?.id]);

  const grouped = useMemo(() => {
    const g: Record<Alert["kind"], Alert[]> = {
      pending_order: [],
      low_stock: [],
      reengage: [],
    };
    for (const a of alerts) g[a.kind].push(a);
    return g;
  }, [alerts]);

  const markAllRead = () => {
    if (!store?.id) return;
    const all = new Set(alerts.map((a) => a.id));
    setReadIds(store.id, all);
    setRead(all);
  };

  const toggleRead = (id: string) => {
    if (!store?.id) return;
    const next = new Set(read);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReadIds(store.id, next);
    setRead(next);
  };

  const unreadCount = alerts.filter((a) => !read.has(a.id)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Bell className="h-6 w-6 text-primary" /> Alerts
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Scanning…" : alerts.length === 0 ? "All clear." : `${alerts.length} item${alerts.length === 1 ? "" : "s"} · ${unreadCount} unread`}
          </p>
        </div>
        {alerts.length > 0 ? (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        ) : null}
      </header>

      <Section
        title="Pending orders (last 24h)"
        icon={<ShoppingCart className="h-4 w-4" />}
        items={grouped.pending_order}
        read={read}
        onToggle={toggleRead}
        emptyText="No new pending orders."
      />

      <Section
        title="Low stock"
        icon={<PackageX className="h-4 w-4" />}
        items={grouped.low_stock}
        read={read}
        onToggle={toggleRead}
        emptyText="No products running low."
      />

      <Section
        title="Re-engagement candidates"
        icon={<UserRound className="h-4 w-4" />}
        items={grouped.reengage}
        read={read}
        onToggle={toggleRead}
        emptyText="No customers needing follow-up."
      />
    </div>
  );
}

function Section({
  title,
  icon,
  items,
  read,
  onToggle,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Alert[];
  read: Set<string>;
  onToggle: (id: string) => void;
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 font-semibold">
        {icon} {title}
        <Badge variant="secondary" className="ml-1">{items.length}</Badge>
      </h2>
      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">{emptyText}</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {items.map((a) => {
            const isRead = read.has(a.id);
            return (
              <Card key={a.id} className={isRead ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <Link to={a.href} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!isRead ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                      <p className="truncate font-medium">{a.title}</p>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{a.detail}</p>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => onToggle(a.id)}>
                    {isRead ? "Unread" : "Read"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
