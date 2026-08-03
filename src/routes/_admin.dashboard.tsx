import { createFileRoute } from "@tanstack/react-router";
import { RestaurantDashboard } from "@/components/dashboard/restaurant-dashboard";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return <RestaurantDashboard />;
}
