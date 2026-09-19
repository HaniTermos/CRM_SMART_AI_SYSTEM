"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Search, Globe, Image as ImageIcon, Save, X, Sparkles, CheckCircle2 } from "lucide-react";

interface CmsSeoModalProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  initialSeoTitle?: string;
  initialSeoDescription?: string;
  initialSocialImage?: string;
  pageSlug: string;
}

export function CmsSeoModal({
  open,
  onClose,
  pageId,
  initialSeoTitle = "",
  initialSeoDescription = "",
  initialSocialImage = "",
  pageSlug,
}: CmsSeoModalProps) {
  const queryClient = useQueryClient();
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle);
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription);
  const [socialImage, setSocialImage] = useState(initialSocialImage);

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/stores/me/cms/pages/${pageId}`, {
        seo_title: seoTitle,
        seo_description: seoDescription,
        social_image_url: socialImage,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("SEO settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["cms-page-v2", pageId] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to save SEO settings");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 select-none">
      <div className="bg-background rounded-2xl border shadow-2xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base text-foreground">Search Engine Optimization (SEO)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">SEO Title</label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="e.g. Sunrise Bakery | Fresh Artisanal Croissants & Coffee"
              className="mt-1 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{seoTitle.length}/60 recommended characters</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Meta Description</label>
            <Textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="e.g. Discover Sunrise Bakery in downtown. Artisanal sourdough, pain au chocolat, specialty espresso, and online pickup ordering."
              rows={3}
              className="mt-1 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{seoDescription.length}/160 recommended characters</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Social Preview Image URL</label>
            <Input
              value={socialImage}
              onChange={(e) => setSocialImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="mt-1 text-xs"
            />
          </div>

          {/* Google Search Card Preview */}
          <div className="p-3.5 rounded-xl border bg-card space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3 text-emerald-500" /> Google Search Preview
            </p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
              {seoTitle || "Page Title"}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-500 truncate">
              https://yourstore.smartstore.ai/pages/{pageSlug}
            </p>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              {seoDescription || "No meta description provided yet. Search engines will display an excerpt from your page."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <IOSButton variant="subtle" size="sm" onClick={onClose}>
            Cancel
          </IOSButton>
          <IOSButton
            variant="default"
            size="sm"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saveMut.isPending ? "Saving..." : "Save SEO Settings"}
          </IOSButton>
        </div>
      </div>
    </div>
  );
}
