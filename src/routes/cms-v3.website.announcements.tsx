import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/cms-v3/website/announcements")({
  component: CmsAnnouncements,
});

function CmsAnnouncements() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Announcements & Popups</h1>
        <p className="text-xs text-slate-500 mt-0.5">Global promotional banners and scheduled popups</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Megaphone className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Announcements Shell Ready</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Scheduled global banner management will activate in subsequent component integration phases.
        </p>
      </div>
    </div>
  );
}
