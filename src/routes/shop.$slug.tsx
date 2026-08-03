import { createFileRoute, Outlet, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CartProvider, useCart } from "@/lib/cart-context";
import { ShoppingBag, ShoppingCart, PackageSearch, Tag } from "lucide-react";

export const Route = createFileRoute("/shop/$slug")({
  component: ShopLayout,
});

function ShopLayout() {
  const { slug } = useParams({ from: "/shop/$slug" });
  return (
    <CartProvider storeSlug={slug}>
      <ShopShell slug={slug} />
    </CartProvider>
  );
}

function ShopShell({ slug }: { slug: string }) {
  const { data: store, isLoading } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const res = await api.get(`/public/stores/${slug}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!store) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-2xl font-bold">Store not found</h1>
        <p className="mt-2 text-muted-foreground">No store at /{slug}.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/shop/$slug" params={{ slug }} className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {store.name}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/shop/$slug/deals"
              params={{ slug }}
              className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <Tag className="h-4 w-4" />
              My Deals
            </Link>
            <Link
              to="/shop/$slug/track"
              params={{ slug }}
              className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <PackageSearch className="h-4 w-4" />
              Track order
            </Link>
            <CartLink slug={slug} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function CartLink({ slug }: { slug: string }) {
  const { count } = useCart();
  return (
    <Link
      to="/shop/$slug/cart"
      params={{ slug }}
      className="relative inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
    >
      <ShoppingCart className="h-4 w-4" />
      Cart
      {count > 0 ? (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
