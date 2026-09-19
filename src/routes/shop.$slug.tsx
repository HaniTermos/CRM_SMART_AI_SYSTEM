import { createFileRoute, Outlet, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CartProvider, useCart } from "@/lib/cart-context";
import { ShoppingBag, ShoppingCart, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { TableBanner } from "@/components/shop/TableBanner";

export const Route = createFileRoute("/shop/$slug")({
  component: ShopLayout,
});

type SnapshotData = {
  store: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  };
  appearance: {
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    accent_color: string;
    font_family: string;
    button_style: string;
    border_radius: string;
    theme_mode: string;
    seo_title: string | null;
    seo_description: string | null;
  };
  announcement: {
    id: string;
    title: string;
    message: string;
    cta_text: string | null;
    cta_link: string | null;
  } | null;
  navigation: {
    header: Array<{
      id: string;
      label: string;
      url: string;
      is_external: boolean;
      is_highlighted: boolean;
    }>;
    footer: Array<{
      id: string;
      label: string;
      url: string;
      is_external: boolean;
    }>;
  };
};

function ShopLayout() {
  const { slug } = useParams({ from: "/shop/$slug" });
  return (
    <CartProvider storeSlug={slug}>
      <ShopShell slug={slug} />
    </CartProvider>
  );
}

function ShopShell({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["public-storefront-snapshot", slug],
    queryFn: async (): Promise<SnapshotData> => {
      const res = await api.get(`/public/stores/${slug}/cms/v2/snapshot`);
      return res.data.data;
    },
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [slug]);

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-2xl font-bold">Store not found</h1>
        <p className="mt-2 text-muted-foreground">No store at /{slug}.</p>
      </div>
    );
  }

  const { store, appearance, announcement, navigation } = data;
  const brandRadius = appearance.border_radius || "0.75rem";

  return (
    <div
      className={cn("min-h-screen bg-background", appearance.theme_mode === "dark" && "dark")}
      style={{
        ["--primary" as string]: appearance.primary_color || "#190E85",
        ["--accent" as string]: appearance.accent_color || "#00E0FF",
        ["--radius" as string]: brandRadius,
        fontFamily: appearance.font_family || "Inter",
      }}
    >
      <TableBanner />

      {announcement && (
        <div
          className="relative px-4 py-2 text-center text-sm font-medium"
          style={{
            backgroundColor: appearance.accent_color || "#00E0FF",
            color: "#0F172A",
          }}
        >
          <span>{announcement.message}</span>
          {announcement.cta_text && announcement.cta_link && (
            <a
              href={announcement.cta_link}
              className="ml-2 underline underline-offset-2"
              target={announcement.cta_link.startsWith("http") ? "_blank" : undefined}
              rel={announcement.cta_link.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {announcement.cta_text}
            </a>
          )}
        </div>
      )}

      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/shop/$slug" params={{ slug }} className="flex items-center gap-2 font-semibold">
            {appearance.logo_url ? (
              <img src={appearance.logo_url} alt={store.name} className="h-8 w-auto object-contain" />
            ) : (
              <ShoppingBag className="h-5 w-5" style={{ color: appearance.primary_color || "#190E85" }} />
            )}
            <span className="truncate">{store.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.header.map((item) => (
              <NavLink key={item.id} item={item} slug={slug} appearance={appearance} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartLink slug={slug} appearance={appearance} />
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1">
            {navigation.header.map((item) => (
              <NavLink key={item.id} item={item} slug={slug} appearance={appearance} mobile />
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <Outlet />
      </main>

      {navigation.footer.length > 0 && (
        <footer className="border-t mt-12 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              {navigation.footer.map((item) => (
                <FooterLink key={item.id} item={item} slug={slug} />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} {store.name}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

function NavLink({
  item,
  slug,
  appearance,
  mobile = false,
}: {
  item: SnapshotData["navigation"]["header"][number];
  slug: string;
  appearance: SnapshotData["appearance"];
  mobile?: boolean;
}) {
  const isExternal = item.is_external || item.url.startsWith("http");
  const baseClasses = cn(
    "rounded-lg text-sm font-medium transition-colors",
    mobile ? "block px-3 py-2 hover:bg-muted" : "px-3 py-2 hover:bg-muted"
  );

  const style = item.is_highlighted
    ? {
        backgroundColor: appearance.accent_color || "#00E0FF",
        color: "#0F172A",
      }
    : undefined;

  if (isExternal) {
    return (
      <a href={item.url} className={baseClasses} style={style} target="_blank" rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }

  // Resolve relative CMS page URLs like /shop/:slug/pages/:pageSlug
  const resolvedTo = resolveNavUrl(item.url, slug);
  if (resolvedTo) {
    return (
      <Link to={resolvedTo.to} params={resolvedTo.params} className={baseClasses} style={style}>
        {item.label}
      </Link>
    );
  }

  return (
    <a href={item.url} className={baseClasses} style={style}>
      {item.label}
    </a>
  );
}

function FooterLink({ item, slug }: { item: SnapshotData["navigation"]["footer"][number]; slug: string }) {
  const isExternal = item.is_external || item.url.startsWith("http");
  if (isExternal) {
    return (
      <a href={item.url} className="hover:text-foreground hover:underline" target="_blank" rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }
  const resolvedTo = resolveNavUrl(item.url, slug);
  if (resolvedTo) {
    return (
      <Link to={resolvedTo.to} params={resolvedTo.params} className="hover:text-foreground hover:underline">
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.url} className="hover:text-foreground hover:underline">
      {item.label}
    </a>
  );
}

function resolveNavUrl(
  url: string,
  slug: string
): { to: string; params: Record<string, string> } | null {
  if (url === `/shop/${slug}` || url === "/" || url === "") {
    return { to: "/shop/$slug", params: { slug } };
  }
  const pagesMatch = url.match(new RegExp(`^/shop/${slug}/pages/([^/]+)$`));
  if (pagesMatch) {
    return { to: "/shop/$slug/pages/$pageSlug", params: { slug, pageSlug: pagesMatch[1] } };
  }
  const simpleMatch = url.match(new RegExp(`^/shop/${slug}(/.*)$`));
  if (simpleMatch) {
    const path = simpleMatch[1];
    if (path === "/cart") return { to: "/shop/$slug/cart", params: { slug } };
    if (path === "/deals") return { to: "/shop/$slug/deals", params: { slug } };
    if (path === "/track") return { to: "/shop/$slug/track", params: { slug } };
  }
  return null;
}

function CartLink({ slug, appearance }: { slug: string; appearance: SnapshotData["appearance"] }) {
  const { count } = useCart();
  return (
    <Link
      to="/shop/$slug/cart"
      params={{ slug }}
      className="relative inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 ? (
        <span
          className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium text-primary-foreground"
          style={{ backgroundColor: appearance.primary_color || "#190E85" }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
