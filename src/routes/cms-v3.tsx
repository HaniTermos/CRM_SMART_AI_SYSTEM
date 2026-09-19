import { createFileRoute } from "@tanstack/react-router";
import { CmsStudioShell } from "@/cms-v3/shell/CmsStudioShell";

export const Route = createFileRoute("/cms-v3")({
  component: CmsStudioShell,
});
