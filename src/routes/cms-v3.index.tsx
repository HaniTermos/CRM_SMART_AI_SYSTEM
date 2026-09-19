import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, FileText, Palette, Layers, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cms-v3/")({
  component: CmsV3Overview,
});

function CmsV3Overview() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Workspace Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> SmartStore Website Studio V3
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Design, Publish & Scale Storefronts
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to the new Website Studio. Build visual pages, manage design tokens, customize menu presentation, and generate reviewable AI drafts.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/cms-v3/website/pages"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md"
            >
              <span>Manage Pages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/cms-v3/editor/$pageId"
              params={{ pageId: "sample-page" }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
            >
              Open Visual Editor
            </Link>
          </div>
        </div>
      </div>

      {/* Honest Empty States Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">V3 Page Management</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No V3 pages have been migrated yet. Legacy V1/V2 pages remain untouched and live on existing public routes.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Theme Engine</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            8 system default themes have been seeded in database schema migration 026. Custom store theme drafts will appear here.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Store Isolation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">cms_v3_enabled</code> is set to <span className="font-semibold text-slate-700">false</span> by default. Legacy storefront public routes fall back safely.
          </p>
        </div>
      </div>
    </div>
  );
}
