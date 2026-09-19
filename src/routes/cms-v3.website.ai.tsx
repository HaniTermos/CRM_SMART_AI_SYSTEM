import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, History, ArrowRight, Loader2, Wand2 } from "lucide-react";

export const Route = createFileRoute("/cms-v3/website/ai")({
  component: CmsAiStudio,
});

function CmsAiStudio() {
  const [businessType, setBusinessType] = useState("Bakery & Café");
  const [storeName, setStoreName] = useState("Sunrise Bakery");
  const [category, setCategory] = useState("Artisanal Bakery");
  const [targetAudience, setTargetAudience] = useState("Local food lovers & coffee enthusiasts");
  const [goals, setGoals] = useState("Increase online order volume & table reservations");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [aiRuns, setAiRuns] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cms-v3/me/ai/runs")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setAiRuns(json.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleGenerateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch("/api/cms-v3/me/ai/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          storeName,
          category,
          targetAudience,
          goals,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setGenerationResult(json.data);
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" /> AI Website Builder & Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate complete site drafts, review proposal operations, and inspect AI run audit history
        </p>
      </div>

      {/* Onboarding Wizard Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Website Onboarding Questionnaire</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            Stage 3 Active
          </span>
        </div>

        {generationResult ? (
          <div className="p-6 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span>AI Website Draft Generated Successfully!</span>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Theme recommendation: <span className="font-bold">{generationResult.themeRecommendation?.name}</span>. Created sitemap: {generationResult.sitemap?.join(", ")}.
            </p>
            <div className="pt-2 flex gap-3">
              <Link
                to="/cms-v3/editor/$pageId"
                params={{ pageId: "sample-hero-page" }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2"
              >
                <span>Open in Visual Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setGenerationResult(null)}
                className="px-4 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-800 text-xs font-semibold"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateSite} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Business Type</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category / Specialty</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Main Business Goals</label>
              <textarea
                rows={2}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 resize-none"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Complete Website Draft</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* AI Audit Run History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">AI Operation Run History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{aiRuns.length} Runs Logged</span>
        </div>

        <div className="space-y-2">
          {aiRuns.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No AI operation runs recorded yet.</div>
          ) : (
            aiRuns.map((run) => (
              <div key={run.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{run.prompt}</span>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    Model: {run.model} • Tokens: {run.token_usage}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {run.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
