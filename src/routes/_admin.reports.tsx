import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/reports/reports-page";

export const Route = createFileRoute("/_admin/reports")({
  component: ReportsRoute,
});

function ReportsRoute() {
  return <ReportsPage />;
}
