import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FormInput, Plus, Inbox, CheckCircle2, MessageSquare, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/forms")({
  component: CmsFormsStudio,
});

function CmsFormsStudio() {
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cms-v3/me/forms");
      if (res.data?.success) {
        setForms(res.data.data || []);
        if (res.data.data?.length > 0 && !selectedForm) {
          setSelectedForm(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load forms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      api.get(`/cms-v3/me/forms/${selectedForm.id}/submissions`)
        .then((res) => {
          if (res.data?.data) setSubmissions(res.data.data);
        })
        .catch((err) => console.error(err));
    }
  }, [selectedForm]);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/cms-v3/me/forms", {
        name: formName,
        slug: formSlug
      });

      if (res.data?.success) {
        toast.success("Form created successfully!");
        setCreateModalOpen(false);
        setFormName("");
        setFormSlug("");
        loadForms();
      } else {
        toast.error("Failed to create form");
      }
    } catch (err) {
      toast.error("Error creating form");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FormInput className="w-5 h-5 text-indigo-600" /> Forms & Submissions Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Design contact and inquiry forms and manage inbound customer submissions
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Form</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Forms List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Store Forms</h3>
          {forms.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedForm(f)}
              className={`p-3 rounded-xl cursor-pointer text-xs transition flex items-center justify-between ${
                selectedForm?.id === f.id
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span>{f.name}</span>
              <span className="text-[10px] font-mono text-slate-400">/{f.form_slug}</span>
            </div>
          ))}
          {forms.length === 0 && !isLoading && (
            <p className="text-xs text-slate-400 p-2">No forms created yet.</p>
          )}
        </div>

        {/* Right Submissions Inbox */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-600" />
                <span>{selectedForm ? `${selectedForm.name} — Submissions Inbox` : "Select a Form"}</span>
              </h3>
              <p className="text-xs text-slate-500">Inbound customer inquiries and messages</p>
            </div>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{sub.payload?.name || sub.payload?.email || "Anonymous Inquiry"}</span>
                  <span className="text-[11px] text-slate-400">{new Date(sub.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {sub.payload?.message || JSON.stringify(sub.payload)}
                </p>
              </div>
            ))}
            {submissions.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400 space-y-1">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">No Submissions Yet</p>
                <p>Incoming submissions from this form component will appear in this inbox.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Form Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Create New Storefront Form</h3>
            <form onSubmit={handleCreateForm} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Form Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Catering Inquiry Form"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Form Identifier (Slug)</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                >
                  Create Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
