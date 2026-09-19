import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/cms/")({
  component: CmsOverviewRoute,
});

function CmsOverviewRoute() {
  return <Navigate to="/cms-v3" replace />;
}
