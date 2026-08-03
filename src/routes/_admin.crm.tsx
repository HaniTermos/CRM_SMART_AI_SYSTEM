import { createFileRoute } from "@tanstack/react-router";
import { CrmPage } from "@/components/crm/crm-page";

export const Route = createFileRoute("/_admin/crm")({
  component: CrmRoute,
});

function CrmRoute() {
  return <CrmPage />;
}