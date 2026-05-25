import { createFileRoute } from "@tanstack/react-router";
import { CampaignsManager } from "@/components/admin/CampaignsManager";

export const Route = createFileRoute("/_admin/campaigns")({
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
        <p className="text-muted-foreground">Create and send email campaigns to your customers.</p>
      </div>
      <CampaignsManager />
    </div>
  );
}
