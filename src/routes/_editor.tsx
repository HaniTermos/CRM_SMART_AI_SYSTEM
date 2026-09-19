/**
 * Pathless layout route for the V3 Visual Editor.
 * Renders ONLY an <Outlet /> with no sidebar, topbar, or CMS shell.
 * All routes nested under _editor.* get a completely blank canvas.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_editor")({
  component: EditorLayout,
});

function EditorLayout() {
  // Pure blank layout — the EditorShell builds its own fullscreen chrome
  return <Outlet />;
}
