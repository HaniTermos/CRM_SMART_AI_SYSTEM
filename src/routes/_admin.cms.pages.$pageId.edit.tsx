import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/cms/pages/$pageId/edit")({
  component: LegacyEditorRedirect,
});

function LegacyEditorRedirect() {
  const { pageId } = Route.useParams();
  return <Navigate to="/cms-v3/editor/$pageId" params={{ pageId }} replace />;
}
