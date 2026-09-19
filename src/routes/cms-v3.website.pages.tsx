import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutTemplate,
  Search,
  MoreVertical,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/pages")({
  component: CmsPagesManager,
});

function CmsPagesManager() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageType, setNewPageType] = useState("custom");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Rename Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPageType, setEditPageType] = useState("custom");

  const loadPagesAndTemplates = async () => {
    setIsLoading(true);
    try {
      const [pagesRes, templatesRes] = await Promise.all([
        api.get("/cms-v3/me/pages").catch(() => ({ data: { data: [] } })),
        api.get("/cms-v3/me/templates").catch(() => ({ data: { data: [] } }))
      ]);

      if (pagesRes.data?.data) {
        setPages(pagesRes.data.data);
      }

      if (templatesRes.data?.data) {
        setTemplates(templatesRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load pages/templates:", err);
      toast.error("Failed to load pages data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPagesAndTemplates();
  }, []);

  const handleTitleChange = (val: string) => {
    setNewPageTitle(val);
    setNewPageSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle || !newPageSlug) {
      toast.error("Title and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/cms-v3/me/pages", {
        title: newPageTitle,
        slug: newPageSlug,
        page_type: newPageType,
        template_slug: selectedTemplate?.slug || null
      });

      if (res.data?.success && res.data.data?.page) {
        toast.success("Page created successfully!");
        setCreateModalOpen(false);
        setNewPageTitle("");
        setNewPageSlug("");
        setSelectedTemplate(null);
        // Automatically open fullscreen editor for the new page
        navigate({
          to: "/cms-v3/editor/$pageId",
          params: { pageId: res.data.data.page.id }
        });
      } else {
        toast.error(res.data?.error || "Failed to create page");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error connecting to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (page: any) => {
    try {
      const res = await api.post(`/cms-v3/me/pages/${page.id}/duplicate`, {
        newTitle: `${page.title} (Copy)`,
        newSlug: `${page.slug}-copy-${Date.now().toString().slice(-4)}`
      });

      if (res.data?.success) {
        toast.success("Page duplicated successfully!");
        loadPagesAndTemplates();
      } else {
        toast.error(res.data?.error || "Failed to duplicate page");
      }
    } catch (err) {
      toast.error("Error duplicating page");
    }
  };

  const handleDelete = async (page: any) => {
    if (page.page_type === "home") {
      toast.error("Home page cannot be deleted");
      return;
    }

    if (!confirm(`Are you sure you want to delete '${page.title}'? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/cms-v3/me/pages/${page.id}`);

      if (res.data?.success) {
        toast.success("Page deleted successfully");
        loadPagesAndTemplates();
      } else {
        toast.error(res.data?.error || "Failed to delete page");
      }
    } catch (err) {
      toast.error("Error deleting page");
    }
  };

  const handleOpenEdit = (page: any) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditSlug(page.slug);
    setEditPageType(page.page_type);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;

    try {
      const res = await api.put(`/cms-v3/me/pages/${editingPage.id}`, {
        title: editTitle,
        slug: editSlug,
        page_type: editPageType
      });

      if (res.data?.success) {
        toast.success("Page settings updated!");
        setEditModalOpen(false);
        loadPagesAndTemplates();
      } else {
        toast.error(res.data?.error || "Failed to update page");
      }
    } catch (err) {
      toast.error("Error updating page");
    }
  };

  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Visual Page Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, duplicate, customize, and publish storefront page documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/cms-v3/website/templates"
            className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <LayoutTemplate className="w-4 h-4 text-slate-500" />
            <span>Template Gallery</span>
          </Link>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setNewPageTitle("");
              setNewPageSlug("");
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Page</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search pages by title or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none"
        />
        <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
          {filteredPages.length} {filteredPages.length === 1 ? "page" : "pages"}
        </span>
      </div>

      {/* Page List Table / Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Pages Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating a blank page or instantiating one from our curated commercial templates.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Page</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {page.page_type === "home" ? "Home" : page.slug.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{page.title}</h3>
                    {page.page_type === "home" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        System Home
                      </span>
                    )}
                    {page.is_published ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published v{page.published_version || 1}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Draft v{page.draft_version || 1}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>Path: <code className="text-slate-600 font-mono">/{page.slug}</code></span>
                    <span>•</span>
                    <span>Updated {new Date(page.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/cms-v3/editor/$pageId"
                  params={{ pageId: page.id }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Open Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => handleOpenEdit(page)}
                  title="Edit Page Settings"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(page)}
                  title="Duplicate Page"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {page.page_type !== "home" && (
                  <button
                    onClick={() => handleDelete(page)}
                    title="Delete Page"
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Page Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New Storefront Page</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Seasonal Menu"
                  value={newPageTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Slug</label>
                <div className="flex items-center rounded-lg border border-slate-200 px-3 bg-slate-50">
                  <span className="text-slate-400 font-mono">/</span>
                  <input
                    type="text"
                    required
                    placeholder="summer-seasonal-menu"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    className="w-full py-2 bg-transparent text-slate-900 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Starter Template (Optional)</label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-lg">
                  <div
                    onClick={() => setSelectedTemplate(null)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition text-center ${
                      selectedTemplate === null
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span className="block text-xs font-semibold">Blank Page</span>
                    <span className="text-[10px] text-slate-400">Empty canvas</span>
                  </div>
                  {templates.map((tmpl) => (
                    <div
                      key={tmpl.slug}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition text-left ${
                        selectedTemplate?.slug === tmpl.slug
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <span className="block text-xs font-semibold truncate">{tmpl.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{tmpl.category} template</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                >
                  {isSubmitting ? "Creating..." : "Create & Open Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Page Settings Modal */}
      {editModalOpen && editingPage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Page Settings</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  disabled={editingPage.page_type === "home"}
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
