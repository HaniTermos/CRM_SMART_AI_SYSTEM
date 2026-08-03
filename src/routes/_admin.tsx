import { useEffect, useState } from "react";
import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useMyStore } from "@/lib/use-my-store";
// supabase import removed
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tag,
  Users,
  ShoppingCart,
  Sparkles,
  BarChart3,
  Lightbulb,
  TicketPercent,
  Star,
  Settings,
  LogOut,
  Kanban,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: store, isLoading: storeLoading } = useMyStore();

  // Auth gate
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Store gate: if signed in but no store, force onboarding
  useEffect(() => {
    if (!user || storeLoading) return;
    if (!store && location.pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
    }
  }, [user, store, storeLoading, location.pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Onboarding doesn't show the sidebar
  if (location.pathname === "/onboarding") {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="border-b px-5 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Mini AI CRM
          </Link>
          {store ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{store.name}</p>
          ) : null}
        </div>
        <nav className="flex-1 space-y-1 p-3 text-sm">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <NavItem to="/products" icon={<Package className="h-4 w-4" />} label="Products" />
          <NavItem to="/inventory" icon={<Boxes className="h-4 w-4" />} label="Inventory" />
          <NavItem to="/categories" icon={<Tag className="h-4 w-4" />} label="Categories" />
          <NavItem to="/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Orders" />
          <NavItem to="/customers" icon={<Users className="h-4 w-4" />} label="Customers" />
          <NavItem to="/reports" icon={<BarChart3 className="h-4 w-4" />} label="Reports" />
          <NavItem to="/ai" icon={<Sparkles className="h-4 w-4" />} label="AI assistant" />
          <NavItem to="/demand" icon={<Lightbulb className="h-4 w-4" />} label="Demand scoring" />
          <NavItem to="/discounts" icon={<TicketPercent className="h-4 w-4" />} label="Discounts" />
          <NavItem to="/reviews" icon={<Star className="h-4 w-4" />} label="Reviews" />
          <NavItem to="/crm" icon={<Kanban className="h-4 w-4" />} label="Pipeline CRM" />
          <NavItem to="/campaigns" icon={<Mail className="h-4 w-4" />} label="Email Campaign" />
          <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => {
              localStorage.removeItem('smartstore_token');
              window.location.href = "/login";
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  disabled,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground/60">
        {icon}
        <span>{label}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide">soon</span>
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-foreground transition-colors hover:bg-accent"
      activeProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2 bg-accent font-medium" }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}


