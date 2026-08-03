import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomDock } from "@/components/bottom-dock";
import { TopNavbar } from "@/components/top-navbar";
import { FloatingAIV3 } from "@/components/floating-ai";
import { AnimatedBackground } from "@/components/backgrounds/animated-background";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
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