import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export const Route = createFileRoute("/shop/$slug/")({
  component: ShopHome,
});

function ShopHome() {
  const { slug } = useParams({ from: "/shop/$slug/" });
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: store } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const res = await api.get(`/public/stores/${slug}`);
      return res.data.data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/public/stores/${store!.id}/products`);
      return res.data.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/public/stores/${store!.id}/categories`);
      return res.data.data;
    },
  });

  const usedCategoryIds = useMemo(
    () => new Set(products.map((p) => p.category_id).filter(Boolean) as string[]),
    [products],
  );
  const visibleCategories = categories.filter((c) => usedCategoryIds.has(c.id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, categoryId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="mt-1 text-muted-foreground">Cash on delivery. Order now, pay when it arrives.</p>
      </header>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
        {visibleCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <FilterChip active={categoryId === null} onClick={() => setCategoryId(null)}>
              All
            </FilterChip>
            {visibleCategories.map((c) => (
              <FilterChip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.name}
              </FilterChip>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            {products.length === 0 ? "No products available yet." : "No products match your search."}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} of {products.length} products</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <CardContent className="space-y-2 p-4">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="font-medium">
                    {store?.currency} {Number(p.price).toFixed(2)}
                  </p>
                  <Link to="/shop/$slug/p/$productSlug" params={{ slug, productSlug: p.slug }}>
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}>
      <Badge
        variant={active ? "default" : "secondary"}
        className="cursor-pointer hover:opacity-80"
      >
        {children}
      </Badge>
    </button>
  );
}
