/**
 * V3 Visual Editor — Fullscreen page editor shell.
 * Route: /cms-v3/editor/$pageId
 * Wrapped by the pathless _editor layout (no sidebar, no topbar).
 */
import { createFileRoute } from "@tanstack/react-router";
import { EditorShell } from "@/cms-v3/editor/EditorShell";

export const Route = createFileRoute("/_editor/cms-v3/editor/$pageId")({
  component: EditorShell,
});
