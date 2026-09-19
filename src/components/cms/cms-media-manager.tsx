"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  useCmsMedia,
  useUploadCmsMedia,
  useUpdateCmsMedia,
  useDeleteCmsMedia,
} from "@/lib/use-cms-v2";
import {
  ChevronLeft,
  Image,
  Upload,
  X,
  Trash2,
  Save,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function CmsMediaManager() {
  const { data: media = [], isLoading } = useCmsMedia();
  const uploadMut = useUploadCmsMedia();
  const updateMut = useUpdateCmsMedia();
  const deleteMut = useDeleteCmsMedia();

  const [files, setFiles] = useState<File[]>([]);
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (valid.length < incoming.length) {
      toast.error("Only image files are allowed.");
    }
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0) return;
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", file.name);
      await uploadMut.mutateAsync(formData);
    }
    setFiles([]);
    toast.success(`${files.length} file${files.length === 1 ? "" : "s"} uploaded.`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this media asset?")) return;
    deleteMut.mutate(id, {
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to delete media.");
      },
    });
  };

  const saveAltText = (id: string) => {
    const text = altTexts[id];
    if (text === undefined) return;
    updateMut.mutate({ id, alt_text: text });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link to="/cms" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6 text-primary" />
            Media Library
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload images to use across pages, sections, and social cards.
          </p>
        </div>
      </div>

      <IOSCard className="p-5 space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Upload className="h-6 w-6" />
          </div>
          <p className="font-medium text-sm">Click or drag images here to upload</p>
          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF, WebP, SVG up to 5 MB</p>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileImage className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                    </div>
                    <button onClick={() => setFiles((p) => p.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-muted">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <IOSButton
                  variant="default"
                  size="pill"
                  className="w-full"
                  onClick={uploadFiles}
                  disabled={uploadMut.isPending}
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Upload {files.length} file{files.length === 1 ? "" : "s"}
                </IOSButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </IOSCard>

      <IOSCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            Assets
            <IOSBadge variant="secondary" size="sm">{media.length}</IOSBadge>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Image className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No media uploaded yet.</p>
            <p className="text-xs mt-1">Upload images to use in your storefront.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {media.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border bg-muted/30">
                <img
                  src={item.url}
                  alt={item.alt_text || item.filename}
                  className="aspect-square object-cover w-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-2 space-y-1.5">
                  <p className="text-[11px] text-muted-foreground truncate">{item.filename}</p>
                  <div className="flex gap-1">
                    <Input
                      defaultValue={item.alt_text || ""}
                      onChange={(e) => setAltTexts((p) => ({ ...p, [item.id]: e.target.value }))}
                      placeholder="Alt text"
                      className="h-6 text-[11px]"
                    />
                    <button
                      onClick={() => saveAltText(item.id)}
                      className="p-1 rounded-md border hover:bg-muted shrink-0"
                      title="Save alt text"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </IOSCard>
    </div>
  );
}
