import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { CmsStudioSidebar } from "@/components/cms/cms-studio-sidebar";

export const Route = createFileRoute("/_admin/cms")({
  component: CmsLayout,
});

function CmsLayout() {
  const location = useLocation();
  const isEditorRoute = location.pathname.includes("/pages/") && location.pathname.endsWith("/edit");

  if (isEditorRoute) {
    return <Outlet />;
  }

  return (
    <div className="relative min-h-screen">
      <CmsStudioSidebar />
      <div className="lg:pl-64 min-h-[calc(100vh-4rem)] transition-all">
        <Outlet />
      </div>
    </div>
  );
}
