import { createFileRoute } from "@tanstack/react-router";
import { CmsThemeMarketplace } from "@/components/cms/cms-theme-marketplace";
import { CmsPage } from "@/components/cms/cms-page";

export const Route = createFileRoute("/_admin/cms/brand")({
  component: CmsBrandRoute,
});

function CmsBrandRoute() {
  return (
    <div className="space-y-10 p-6 max-w-7xl mx-auto">
      <CmsThemeMarketplace />
      <div className="border-t pt-8">
        <CmsPage />
      </div>
    </div>
  );
}
