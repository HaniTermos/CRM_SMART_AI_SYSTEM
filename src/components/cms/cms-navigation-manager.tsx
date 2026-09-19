"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  useCmsNavigation, useCreateCmsNavItem, useUpdateCmsNavBatch, useDeleteCmsNavItem, useCmsPages
} from "@/lib/use-cms-v2";
import { useMyStore } from "@/lib/use-my-store";
import {
  ChevronLeft, Plus, Trash2, ExternalLink, GripVertical, Check, X, Navigation, Globe,
  ChevronUp, ChevronDown, Star
} from "lucide-react";

const LOCATIONS = ["header", "footer", "mobile"] as const;

export function CmsNavigationManager() {
  const { data: headerItems = [] } = useCmsNavigation("header");
  const { data: footerItems = [] } = useCmsNavigation("footer");
  const { data: mobileItems = [] } = useCmsNavigation("mobile");
  const { data: pages = [] } = useCmsPages();
  const { data: myStore } = useMyStore();
  const createMut = useCreateCmsNavItem();
  const deleteMut = useDeleteCmsNavItem();
  const updateBatchMut = useUpdateCmsNavBatch();

  const [addTo, setAddTo] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [newExternal, setNewExternal] = useState(false);
  const [newHighlighted, setNewHighlighted] = useState(false);

  const groupedItems = { header: headerItems, footer: footerItems, mobile: mobileItems };

  const handleAdd = () => {
    if (!newLabel.trim() || !addTo) return;
    const storeSlug = myStore?.slug || "";
    const pageSlug = newPageId ? pages.find((p) => p.id === newPageId)?.slug : "";
    const url = newPageId
      ? `/shop/${storeSlug}/pages/${pageSlug || ""}`
      : newUrl;
    createMut.mutate(
      { location: addTo as any, label: newLabel, url, page_id: newPageId || undefined, is_external: newExternal, is_highlighted: newHighlighted, position: groupedItems[addTo as keyof typeof groupedItems].length },
      { onSuccess: () => { setAddTo(null); setNewLabel(""); setNewUrl(""); setNewPageId(""); setNewExternal(false); setNewHighlighted(false); } }
    );
  };

  const moveItem = (loc: string, index: number, direction: "up" | "down") => {
    const list = [...groupedItems[loc as keyof typeof groupedItems]];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    updateBatchMut.mutate(list.map((item, i) => ({ ...item, position: i })));
  };

  const toggleHighlight = (item: any) => {
    updateBatchMut.mutate([{ ...item, is_highlighted: !item.is_highlighted }]);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link to="/cms" className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6 text-primary" />
            Navigation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage header, footer, and mobile navigation links.</p>
        </div>
      </div>

      {LOCATIONS.map((loc) => {
        const items = groupedItems[loc];
        return (
          <IOSCard key={loc} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {loc} Navigation
                <IOSBadge variant="secondary" size="sm">{items.length}</IOSBadge>
              </h3>
              <IOSButton variant="subtle" size="pill" className="h-7 text-xs" onClick={() => setAddTo(addTo === loc ? null : loc)}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </IOSButton>
            </div>

            {items.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center">No {loc} links configured.</p>
            )}

            <div className="space-y-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm flex-1 truncate">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">{item.url}</span>
                  {item.is_external && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />}
                  {item.is_highlighted && <IOSBadge variant="warning" size="sm">CTA</IOSBadge>}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleHighlight(item)}
                      className={cn("p-1 rounded hover:bg-muted", item.is_highlighted ? "text-amber-500" : "text-muted-foreground")}
                      title={item.is_highlighted ? "Remove CTA highlight" : "Mark as CTA"}
                    >
                      <Star className={cn("h-3 w-3", item.is_highlighted && "fill-current")} />
                    </button>
                    <button
                      onClick={() => moveItem(loc, idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveItem(loc, idx, "down")}
                      disabled={idx === items.length - 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this link?")) deleteMut.mutate(item.id); }}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {addTo === loc && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-2 border-t space-y-2">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div className="space-y-1"><Label className="text-xs">Label</Label><Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="h-8 text-xs" placeholder="Menu link text" autoFocus /></div>
                      <div className="space-y-1">
                        <Label className="text-xs">Link to page or URL</Label>
                        <select value={newPageId} onChange={(e) => setNewPageId(e.target.value)} className="w-full h-8 rounded-lg border bg-background px-2 text-xs">
                          <option value="">Custom URL</option>
                          {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </div>
                    </div>
                    {!newPageId && (
                      <div className="space-y-1"><Label className="text-xs">Custom URL</Label><Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="h-8 text-xs" placeholder="https://..." /></div>
                    )}
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newExternal} onChange={(e) => setNewExternal(e.target.checked)} /> Opens in new tab</label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newHighlighted} onChange={(e) => setNewHighlighted(e.target.checked)} /> Highlight as CTA</label>
                    <div className="flex gap-2">
                      <IOSButton variant="default" size="pill" className="h-7 text-xs" onClick={handleAdd} disabled={!newLabel.trim() || createMut.isPending}><Check className="h-3 w-3 mr-1" /> Add</IOSButton>
                      <IOSButton variant="subtle" size="pill" className="h-7 text-xs" onClick={() => setAddTo(null)}><X className="h-3 w-3 mr-1" /> Cancel</IOSButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </IOSCard>
        );
      })}
    </div>
  );
}
