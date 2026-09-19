import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardThemeProvider, useTheme } from "@/components/theme-provider";
import { NavLayoutProvider, useNavLayout } from "@/lib/nav-layout-context";
import { AdminSidebar } from "@/components/admin-sidebar";
import { BottomDock } from "@/components/bottom-dock";
import { TopNavbar } from "@/components/top-navbar";
import { FloatingAIV3 } from "@/components/floating-ai";
import { AnimatedBackground } from "@/components/backgrounds/animated-background";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export type LayoutMode = 'app' | 'cms' | 'editor';

export function getLayoutMode(pathname: string): LayoutMode {
  if (/^\/cms\/pages\/[^/]+\/(edit|preview)$/.test(pathname)) {
    return 'editor';
  }
  if (pathname === '/cms' || pathname.startsWith('/cms/')) {
    return 'cms';
  }
  return 'app';
}

export const Route = createFileRoute("/_admin")({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  return (
    <DashboardThemeProvider>
      <NavLayoutProvider>
        <AdminLayout />
      </NavLayoutProvider>
    </DashboardThemeProvider>
  );
}

function AdminLayout() {
  const { user, loading } = useAuth();
  const { navMode } = useNavLayout();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const safePath = location.pathname.startsWith('/') && !location.pathname.startsWith('//')
        ? location.pathname
        : '/dashboard';

      navigate({
        to: '/login',
        search: { redirect: safePath },
        replace: true,
      });
    }
  }, [loading, user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Authenticating…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const layoutMode = getLayoutMode(location.pathname);

  // Editor Shell Mode — Fullscreen Zero-Chrome Layout
  if (layoutMode === "editor") {
    return (
      <div
        data-app-scope="cms-editor"
        data-dashboard-theme={isDark ? "dark" : "light"}
        className={cn(
          "h-screen w-screen overflow-hidden transition-colors select-none",
          isDark ? "dark bg-[#0a0a1a]" : "bg-[#F9FAFB]"
        )}
      >
        <Outlet />
      </div>
    );
  }

  // CMS Studio Shell Mode — Dedicated CMS Workspace (AppShell Chrome Completely Unmounted)
  if (layoutMode === "cms") {
    return (
      <div
        data-app-scope="cms-studio"
        data-dashboard-theme={isDark ? "dark" : "light"}
        className={cn(
          "min-h-screen w-full transition-colors",
          isDark ? "dark bg-[#0a0a1a]" : "bg-[#F9FAFB]"
        )}
      >
        <Outlet />
      </div>
    );
  }

  // Operations App Shell Mode (Dashboard, Orders, Menu, Customers, CRM, Reports, Settings)
  const sidebarVisible = navMode === "sidebar";

  return (
    <div
      data-app-scope="dashboard"
      data-dashboard-theme={isDark ? "dark" : "light"}
      className={cn(
        "min-h-screen w-full overflow-x-hidden transition-colors",
        isDark ? "dark bg-[#0a0a1a]" : "bg-[#F9FAFB]"
      )}
    >
      <AnimatedBackground variant="strands" />

      {/* Top Navbar */}
      <TopNavbar onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)} />

      {/* Desktop Sidebar */}
      {sidebarVisible && <AdminSidebar />}

      {/* Mobile Drawer Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main
        className={cn(
          "relative z-10 min-h-screen transition-all",
          sidebarVisible
            ? "lg:pl-64 pt-16"
            : "pt-16",
          navMode === "dock" ? "pb-28 md:pb-8" : "pb-8"
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      <BottomDock />
      <FloatingAIV3 />
    </div>
  );
}
