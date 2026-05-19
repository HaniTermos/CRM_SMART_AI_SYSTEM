import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Tag, ShoppingCart, Users } from "lucide-react";

export const Route = createFileRoute("/_admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: store } = useMyStore();

  const { data: counts } = useQuery({
    queryKey: ["dashboard-counts", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const [products, categories, orders, customers, revenueRows] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", store!.id),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", store!.id),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", store!.id),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", store!.id),
        supabase.from("orders").select("total").eq("store_id", store!.id).neq("status", "cancelled"),
      ]);
      const revenue = (revenueRows.data ?? []).reduce((s, r) => s + Number(r.total), 0);
      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
        customers: customers.count ?? 0,
        revenue,
      };
    },
  });

  const shopUrl = store ? `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${store.slug}` : "";

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          {store ? `Welcome back to ${store.name}.` : "Welcome."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Products" value={counts?.products ?? "—"} icon={<Package className="h-4 w-4" />} />
        <Kpi label="Categories" value={counts?.categories ?? "—"} icon={<Tag className="h-4 w-4" />} />
        <Kpi label="Orders" value={counts?.orders ?? "—"} icon={<ShoppingCart className="h-4 w-4" />} />
        <Kpi label="Customers" value={counts?.customers ?? "—"} icon={<Users className="h-4 w-4" />} />
      </div>

      {store ? (
        <Card>
          <CardHeader>
            <CardTitle>Your store link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Share this link with customers — they can browse and order with cash on delivery.</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-xs">{shopUrl}</code>
              <a href={`/shop/${store.slug}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">Open shop</Button>
              </a>
              <Link to="/products/new"><Button size="sm">Add product</Button></Link>
              <Link to="/orders"><Button size="sm" variant="outline">View orders</Button></Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-sm">{label}</span>
          {icon}
        </div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
