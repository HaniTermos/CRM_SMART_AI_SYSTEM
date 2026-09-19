import React, { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Image, Upload, Search, Trash2, Tag, Copy, CheckCircle2, ExternalLink, Plus, HardDrive, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cms-v3/website/media")({
  component: CmsMediaLibrary,
});

function CmsMediaLibrary() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<"device" | "url">("device");

  // Device file upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // URL state
  const [newFilename, setNewFilename] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newAltText, setNewAltText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cms-v3/me/media");
      if (res.data?.success) {
        setMediaList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading media:", err);
      toast.error("Failed to load media assets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WebP, SVG, GIF)");
      return;
    }
    setSelectedFile(file);
    setNewFilename(file.name.replace(/\.[^/.]+$/, ""));
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (uploadTab === "device") {
        if (!selectedFile) {
          toast.error("Please select an image from your device");
          setIsSubmitting(false);
          return;
        }

        // Upload file via FormData
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (newAltText) formData.append("alt_text", newAltText);

        try {
          const res = await api.post("/cms-v3/me/media/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          if (res.data?.success) {
            toast.success("Image uploaded successfully from your device!");
            resetModal();
            loadMedia();
            return;
          }
        } catch {
          // If multipart upload fails, fallback to DataURL upload
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const res2 = await api.post("/cms-v3/me/media", {
              filename: newFilename || selectedFile.name,
              url: base64,
              alt_text: newAltText || selectedFile.name,
              mime_type: selectedFile.type,
              file_size: selectedFile.size
            });
            if (res2.data?.success) {
              toast.success("Image uploaded successfully!");
              resetModal();
              loadMedia();
            }
          };
          reader.readAsDataURL(selectedFile);
          return;
        }
      } else {
        // Link by URL
        if (!newUrl || !newFilename) {
          toast.error("Filename and Image URL are required");
          setIsSubmitting(false);
          return;
        }

        const res = await api.post("/cms-v3/me/media", {
          filename: newFilename,
          url: newUrl,
          alt_text: newAltText || newFilename,
          mime_type: "image/jpeg"
        });

        if (res.data?.success) {
          toast.success("Media asset saved!");
          resetModal();
          loadMedia();
        } else {
          toast.error(res.data?.error || "Failed to save media");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading media asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setNewFilename("");
    setNewUrl("");
    setNewAltText("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;

    try {
      const res = await api.delete(`/cms-v3/me/media/${id}`);
      if (res.data?.success) {
        toast.success("Asset deleted successfully");
        loadMedia();
      } else {
        toast.error("Failed to delete media");
      }
    } catch (err) {
      toast.error("Error deleting media");
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const filteredMedia = mediaList.filter((m) =>
    (m.filename || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.alt_text || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Image className="w-5 h-5 text-indigo-600" /> Media Library & Upload Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload images directly from your device or link URLs to use throughout your storefront pages
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assets by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-indigo-600 font-medium"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
          <span>{filteredMedia.length} assets total</span>
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs">Loading media assets...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">No media assets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Upload photos directly from your computer or link external high-resolution imagery.
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            Upload First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((media) => (
            <div
              key={media.id}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                <img
                  src={media.url}
                  alt={media.alt_text || media.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyToClipboard(media.url)}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-sm"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 space-y-1">
                <p className="font-bold text-xs text-slate-900 truncate" title={media.filename}>
                  {media.filename}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {media.alt_text || "No description"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (Device Upload & URL) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Media Asset</span>
              </h3>
              <button
                onClick={resetModal}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Upload Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadTab("device")}
                className={cn("flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5", uploadTab === "device" ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700")}
              >
                <HardDrive className="w-3.5 h-3.5" /> From Your Device
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("url")}
                className={cn("flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5", uploadTab === "url" ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700")}
              >
                <LinkIcon className="w-3.5 h-3.5" /> Link by URL
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
              {uploadTab === "device" ? (
                <div className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2",
                      dragActive ? "border-indigo-600 bg-indigo-50" : "border-slate-300 hover:border-indigo-500 bg-slate-50"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {filePreviewUrl ? (
                      <div className="space-y-2">
                        <img src={filePreviewUrl} alt="Preview" className="h-32 w-auto max-w-full rounded-lg object-contain mx-auto shadow-xs" />
                        <p className="font-bold text-xs text-indigo-600">{selectedFile?.name}</p>
                        <span className="text-[10px] text-slate-400">Click or drag another image to replace</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">Click to choose image or drag & drop</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP, SVG, GIF up to 10MB</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Asset Name / Title</label>
                    <input
                      type="text"
                      value={newFilename}
                      onChange={(e) => setNewFilename(e.target.value)}
                      placeholder="e.g. Sourdough Loaf Showcase"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Alt Description (SEO & Accessibility)</label>
                    <input
                      type="text"
                      value={newAltText}
                      onChange={(e) => setNewAltText(e.target.value)}
                      placeholder="e.g. Golden crust sourdough bread on wooden board"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Image URL (Unsplash, CDN, etc.)</label>
                    <input
                      type="url"
                      required
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Asset Name / Title</label>
                    <input
                      type="text"
                      required
                      value={newFilename}
                      onChange={(e) => setNewFilename(e.target.value)}
                      placeholder="e.g. Bistro Interior"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Alt Description</label>
                    <input
                      type="text"
                      value={newAltText}
                      onChange={(e) => setNewAltText(e.target.value)}
                      placeholder="e.g. Candlelit dining tables in evening bistro"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-indigo-600"
                    />
                  </div>

                  {newUrl && (
                    <div className="aspect-16/9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={newUrl} alt="Preview" className="w-full h-full object-cover" onError={() => toast.error("Failed to load image preview from URL")} />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? "Uploading..." : "Save to Media Library"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
