/**
 * CMS V3 — Compact media picker for Image inspector (upload + library)
 */

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type MediaAsset = {
  id: string;
  url: string;
  filename: string;
  mime_type?: string;
  file_size?: number;
  alt_text?: string;
};

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: { url: string; alt?: string }) => void;
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/cms-v3/me/media")
      .then((res) => {
        if (res.data?.success) setMediaList(res.data.data || []);
      })
      .catch(() => toast.error("Failed to load media library"))
      .finally(() => setLoading(false));
  }, [open]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", file.name.replace(/\.[^/.]+$/, ""));
      const res = await api.post("/cms-v3/me/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        const asset = res.data.data as MediaAsset;
        setMediaList((prev) => [asset, ...prev]);
        onSelect({ url: asset.url, alt: asset.alt_text || asset.filename });
        onClose();
        toast.success("Image uploaded");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" /> Choose Image
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={cn(
            "mx-4 mt-4 mb-2 border-2 border-dashed rounded-xl p-6 text-center transition",
            dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-600"
          )}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadFile(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
          <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <p className="text-xs text-slate-400 mb-2">Drag & drop or click to upload</p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Upload from device"}
          </button>
        </div>

        <div className="px-4 pb-4 max-h-64 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Media Library</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : mediaList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No images yet — upload one above.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect({ url: item.url, alt: item.alt_text || item.filename });
                    onClose();
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition"
                >
                  <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/30 flex items-center justify-center transition">
                    <Check className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
