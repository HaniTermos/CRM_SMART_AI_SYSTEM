import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings/settings-page";

export const Route = createFileRoute("/_admin/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return <SettingsPage />;
}