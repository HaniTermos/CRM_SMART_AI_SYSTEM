import { createFileRoute } from "@tanstack/react-router";
import { Settings, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/cms-v3/website/settings")({
  component: CmsSettings,
});

function CmsSettings() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">CMS Global Settings & Feature Flags</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage V3 storefront cutover settings and motion preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-900">cms_v3_enabled Feature Flag</span>
              <p className="text-amber-700 mt-0.5">
                Currently set to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">FALSE</code> for this store. Public storefront routes seamlessly render legacy V2 pages.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-200 text-amber-900 font-bold text-[11px]">DISABLED</span>
        </div>
      </div>
    </div>
  );
}
