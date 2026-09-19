import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/cms/pages/")({
  component: LegacyPagesRedirect,
});

function LegacyPagesRedirect() {
  return <Navigate to="/cms-v3/website/pages" replace />;
}
