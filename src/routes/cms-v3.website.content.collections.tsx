import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Database, Plus, Table, Edit, Trash2, CheckCircle2, Sparkles, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/content/collections")({
  component: CmsCollectionsStudio,
});

function CmsCollectionsStudio() {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [createCollectionModal, setCreateCollectionModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColSlug, setNewColSlug] = useState("");
  const [newColDesc, setNewColDesc] = useState("");

  const [createItemModal, setCreateItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemSlug, setNewItemSlug] = useState("");

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cms-v3/me/collections");
      if (res.data?.success) {
        setCollections(res.data.data || []);
        if (res.data.data?.length > 0 && !selectedCollection) {
          setSelectedCollection(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load collections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      api.get(`/cms-v3/me/collections/${selectedCollection.id}/items`)
        .then((res) => {
          if (res.data?.data) setItems(res.data.data);
        })
        .catch((err) => console.error(err));
    }
  }, [selectedCollection]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/cms-v3/me/collections", {
        name: newColName,
        slug: newColSlug,
        description: newColDesc
      });

      if (res.data?.success) {
        toast.success("Collection created!");
        setCreateCollectionModal(false);
        setNewColName("");
        setNewColSlug("");
        setNewColDesc("");
        loadCollections();
      } else {
        toast.error(res.data?.error || "Failed to create collection");
      }
    } catch (err) {
      toast.error("Error creating collection");
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollection) return;

    try {
      const res = await api.post(`/cms-v3/me/collections/${selectedCollection.id}/items`, {
        title: newItemTitle,
        slug: newItemSlug,
        field_data: { title: newItemTitle }
      });

      if (res.data?.success) {
        toast.success("Item added to collection!");
        setCreateItemModal(false);
        setNewItemTitle("");
        setNewItemSlug("");
        const itemsRes = await api.get(`/cms-v3/me/collections/${selectedCollection.id}/items`);
        if (itemsRes.data?.data) setItems(itemsRes.data.data);
      } else {
        toast.error(res.data?.error || "Failed to create item");
      }
    } catch (err) {
      toast.error("Error adding item");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" /> Dynamic CMS Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage custom structured data models and bind items dynamically to AST Collection components
          </p>
        </div>
        <button
          onClick={() => setCreateCollectionModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Collections List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Collections</h3>
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => setSelectedCollection(col)}
              className={`p-3 rounded-xl cursor-pointer text-xs transition flex items-center justify-between ${
                selectedCollection?.id === col.id
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span>{col.name}</span>
              <span className="text-[10px] font-mono text-slate-400">{col.slug}</span>
            </div>
          ))}
          {collections.length === 0 && !isLoading && (
            <p className="text-xs text-slate-400 p-2">No collections yet.</p>
          )}
        </div>

        {/* Right Items Table */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedCollection ? selectedCollection.name : "Select a Collection"}
              </h3>
              <p className="text-xs text-slate-500">{selectedCollection?.description || "Structured schema items"}</p>
            </div>
            {selectedCollection && (
              <button
                onClick={() => setCreateItemModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <span className="text-slate-400 font-mono text-[11px]">/{item.slug}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Published
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No items added to this collection yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Collection Modal */}
      {createCollectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Create New CMS Collection</h3>
            <form onSubmit={handleCreateCollection} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Collection Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blog Articles"
                  value={newColName}
                  onChange={(e) => {
                    setNewColName(e.target.value);
                    setNewColSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Slug Identifier</label>
                <input
                  type="text"
                  required
                  value={newColSlug}
                  onChange={(e) => setNewColSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                  rows={2}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateCollectionModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {createItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add Item to {selectedCollection?.name}</h3>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => {
                    setNewItemTitle(e.target.value);
                    setNewItemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={newItemSlug}
                  onChange={(e) => setNewItemSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateItemModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
