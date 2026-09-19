import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/cms/navigation")({
  component: LegacyNavRedirect,
});

function LegacyNavRedirect() {
  return <Navigate to="/cms-v3/website/navigation" replace />;
}
