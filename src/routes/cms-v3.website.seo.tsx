import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Globe, Save, CheckCircle2, Share2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/seo")({
  component: CmsSeoStudio,
});

function CmsSeoStudio() {
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get("/cms-v3/me/pages")
      .then((res) => {
        const json = res.data;
        if (json.data && json.data.length > 0) {
          setPages(json.data);
          const first = json.data[0];
          setSelectedPage(first);
          setMetaTitle(first.seo_metadata?.metaTitle || first.title);
          setMetaDesc(first.seo_metadata?.metaDescription || "");
          setOgImageUrl(first.seo_metadata?.ogImage || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSelectPage = (page: any) => {
    setSelectedPage(page);
    setMetaTitle(page.seo_metadata?.metaTitle || page.title);
    setMetaDesc(page.seo_metadata?.metaDescription || "");
    setOgImageUrl(page.seo_metadata?.ogImage || "");
  };

  const handleSaveSeo = async () => {
    if (!selectedPage) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/cms-v3/me/pages/${selectedPage.id}`, {
        seo_metadata: {
          metaTitle,
          metaDescription: metaDesc,
          ogImage: ogImageUrl
        }
      });

      if (res.data?.success) {
        toast.success("SEO Metadata saved to database!");
      } else {
        toast.error("Failed to save SEO metadata");
      }
    } catch (err) {
      toast.error("Error saving SEO metadata");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" /> SEO & Social Sharing Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize search engine rankings, Google SERP snippets, and OpenGraph social cards per page
          </p>
        </div>
        <button
          onClick={handleSaveSeo}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save SEO Metadata"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Page Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Store Pages</h3>
          {pages.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelectPage(p)}
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

        {/* Right Editor & SERP Preview */}
        <div className="md:col-span-2 space-y-6">
          {/* Metadata Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Page SEO Settings: <span className="text-indigo-600 font-mono">/{selectedPage?.slug}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Meta Title Tag</label>
                  <span className="text-[10px] text-slate-400 font-mono">{metaTitle.length}/60 chars</span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                  placeholder="Brand | Page Title"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Meta Description</label>
                  <span className="text-[10px] text-slate-400 font-mono">{metaDesc.length}/160 chars</span>
                </div>
                <textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                  rows={3}
                  placeholder="Summary of page content for search engines..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">OpenGraph Social Share Image URL</label>
                <input
                  type="url"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900 focus:outline-indigo-600"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          </div>

          {/* Google SERP Live Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Google Search Result Preview
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-sans">
              <span className="text-[11px] text-slate-500 block truncate">https://mystore.smartstore.ai/{selectedPage?.slug}</span>
              <h3 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                {metaTitle || "Untitled Store Page"}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {metaDesc || "Discover exceptional food, craft drinks, and table reservations at our storefront."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
