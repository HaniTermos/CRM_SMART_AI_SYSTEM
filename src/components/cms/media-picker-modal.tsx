"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSButton } from "@/components/ui/ios-button";
import { Input } from "@/components/ui/input";
import { useCmsMedia, useUploadCmsMedia } from "@/lib/use-cms-v2";
import { Image, Upload, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
};

export function MediaPickerModal({ open, onClose, onSelect, title = "Select Image" }: MediaPickerModalProps) {
  const { data: media = [], isLoading } = useCmsMedia();
  const uploadMut = useUploadCmsMedia();
  const [search, setSearch] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = media.filter((m) =>
    !search || m.filename.toLowerCase().includes(search.toLowerCase()) || (m.alt_text && m.alt_text.toLowerCase().includes(search.toLowerCase()))
  );

  const handleManualSubmit = () => {
    if (!manualUrl.trim()) return;
    onSelect(manualUrl.trim());
    setManualUrl("");
  };

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt_text", file.name);
    try {
      const item = await uploadMut.mutateAsync(formData);
      onSelect(item.url);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Upload failed.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-background rounded-2xl border shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                {title}
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search media library…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Or paste an image URL…"
                  className="flex-1"
                />
                <IOSButton variant="default" size="pill" onClick={handleManualSubmit} disabled={!manualUrl.trim()}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> Use
                </IOSButton>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                className={cn(
                  "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40"
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium">Upload a new image</p>
                <p className="text-[10px] text-muted-foreground">JPEG, PNG, GIF, WebP, SVG up to 5 MB</p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <Image className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No media found.</p>
                  <p className="text-xs mt-1">Add images in Brand & Appearance → Media Library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item.url)}
                      className="group relative aspect-square rounded-xl overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary transition-all text-left"
                      title={item.filename}
                    >
                      <img
                        src={item.url}
                        alt={item.alt_text || item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.filename}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
