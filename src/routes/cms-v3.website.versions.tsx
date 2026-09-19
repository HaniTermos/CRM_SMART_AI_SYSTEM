import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History, Clock, User, RotateCcw, CheckCircle2, FileText, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/versions")({
  component: CmsVersionsStudio,
});

function CmsVersionsStudio() {
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    api.get("/cms-v3/me/pages")
      .then((res) => {
        const json = res.data;
        if (json.data && json.data.length > 0) {
          setPages(json.data);
          setSelectedPage(json.data[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPage) {
      api.get(`/cms-v3/me/pages/${selectedPage.id}/versions`)
        .then((res) => {
          if (res.data.data) setVersions(res.data.data);
        })
        .catch((err) => console.error(err));
    }
  }, [selectedPage]);

  const handleRollback = async (version: any) => {
    if (!confirm(`Are you sure you want to rollback to Version #${version.version_number}? A new safe snapshot will be created.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await api.post(`/cms-v3/me/pages/${selectedPage.id}/rollback`, {
        versionId: version.id
      });

      if (res.data?.success) {
        toast.success(`Successfully rolled back to v#${version.version_number}!`);
        const verRes = await api.get(`/cms-v3/me/pages/${selectedPage.id}/versions`);
        if (verRes.data.data) setVersions(verRes.data.data);
      } else {
        toast.error("Failed to rollback version");
      }
    } catch (err) {
      toast.error("Error during rollback");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" /> Version History & Safe Rollback
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspect immutable PageDocument snapshots, audit change authors, and restore past versions with zero data loss
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Page Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Store Pages</h3>
          {pages.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPage(p)}
              className={`p-3 rounded-xl cursor-pointer text-xs transition flex items-center justify-between ${
                selectedPage?.id === p.id
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span>{p.title}</span>
              <span className="text-[10px] font-mono text-slate-400">/{p.slug}</span>
            </div>
          ))}
        </div>

        {/* Right Version Timeline */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Version Timeline: <span className="text-indigo-600 font-mono">/{selectedPage?.slug}</span>
              </h3>
              <p className="text-xs text-slate-500">Immutable JSON AST snapshots</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{versions.length} Snapshots</span>
          </div>

          <div className="space-y-3">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Version #{ver.version_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ver.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {ver.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{ver.change_summary || "Automated draft snapshot"}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ver.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <User className="w-3 h-3" />
                    <span>{ver.author_name || ver.author_email || "System"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRollback(ver)}
                  disabled={isRestoring}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Snapshot</span>
                </button>
              </div>
            ))}

            {versions.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                No versions recorded yet for this page.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
