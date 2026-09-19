import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/products/")({
  component: ProductsList,
});

function ProductsList() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/products/${store!.id}`);
      return res.data.data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/products/${store!.id}/${id}`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["products", store?.id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Update failed"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-muted-foreground">Manage your catalog.</p>
        </div>
        <Link to="/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New product
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">No products yet.</p>
            <Link to="/products/new" className="mt-4 inline-block">
              <Button size="sm">Add your first product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: { id: string; name: string; price: number | string; image_url?: string; status?: string; is_available?: boolean; slug?: string; stock?: number }) => (
            <Card key={p.id} className="overflow-hidden">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </div>
                  <StatusBadge status={p.status ?? "active"} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {store?.currency} {Number(p.price).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">Stock: {p.stock}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const newStatus = p.status === "active" ? "draft" : "active";
                      toggleStatus.mutate({ id: p.id, status: newStatus });
                    }}
                    disabled={toggleStatus.isPending}
                  >
                    {p.status === "active" ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                    {p.status === "active" ? "Disable" : "Enable"}
                  </Button>
                  <Link to="/products/$id" params={{ id: p.id }} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, "default" | "secondary" | "outline"> = {
    active: "default",
    draft: "secondary",
    archived: "outline",
  };
  return <Badge variant={variant[status] ?? "secondary"}>{status}</Badge>;
}
