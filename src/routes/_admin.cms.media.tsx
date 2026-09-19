import { createFileRoute } from "@tanstack/react-router";
import { CmsMediaManager } from "@/components/cms/cms-media-manager";

export const Route = createFileRoute("/_admin/cms/media")({
  component: CmsMediaManager,
});
