import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug/p/$productSlug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug, productSlug } = useParams({ from: "/shop/$slug/p/$productSlug" });
  const navigate = useNavigate();
  const cart = useCart();
  const [qty, setQty] = useState(1);

  const { data: store } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const { data } = await supabase.from("stores").select("id, currency").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["public-product", store?.id, productSlug],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, description, stock")
        .eq("store_id", store!.id)
        .eq("slug", productSlug)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!product) {
    return (
      <div>
        <p>Product not found.</p>
        <Link to="/shop/$slug" params={{ slug }} className="text-sm text-primary underline">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-lg border bg-card">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="text-2xl font-semibold">
          {store?.currency} {Number(product.price).toFixed(2)}
        </p>
        {product.description ? (
          <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <label className="text-sm">Qty</label>
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-20"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => {
              cart.add(
                {
                  product_id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  image_url: product.image_url,
                },
                qty,
              );
              toast.success("Added to cart");
            }}
          >
            Add to cart
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              cart.add(
                {
                  product_id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  image_url: product.image_url,
                },
                qty,
              );
              navigate({ to: "/shop/$slug/checkout", params: { slug } });
            }}
          >
            Buy now
          </Button>
        </div>
      </div>
    </div>
    <ProductReviews storeSlug={slug} productId={product.id} />
    </div>
  );
}
