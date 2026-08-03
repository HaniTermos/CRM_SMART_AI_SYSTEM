import { createFileRoute } from "@tanstack/react-router";
import { DemandPage } from "@/components/demand/demand-page";

export const Route = createFileRoute("/_admin/demand")({
  component: DemandRoute,
});

function DemandRoute() {
  return <DemandPage />;
}