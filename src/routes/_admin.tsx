import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomDock } from "@/components/bottom-dock";
import { TopNavbar } from "@/components/top-navbar";
import { FloatingAIV3 } from "@/components/floating-ai";
import { AnimatedBackground } from "@/components/backgrounds/animated-background";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "transparent" }}>
      <AnimatedBackground variant="strands" />
      <TopNavbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative z-10">
        <Outlet />
      </main>
      <BottomDock />
      <FloatingAIV3 />
    </div>
  );
}
