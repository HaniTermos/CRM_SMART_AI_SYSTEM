import { createFileRoute } from "@tanstack/react-router";
import { CmsAnnouncementsManager } from "@/components/cms/cms-announcements-manager";

export const Route = createFileRoute("/_admin/cms/announcements")({
  component: CmsAnnouncementsManager,
});
