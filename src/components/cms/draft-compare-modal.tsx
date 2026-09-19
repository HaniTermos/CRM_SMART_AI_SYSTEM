"use client";

import { useState } from "react";
import { CmsPageSectionItem } from "@/lib/use-cms-v2";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { SectionRenderer } from "@/components/shop/section-renderer";
import { Columns, Eye, Globe, X, ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftCompareModalProps {
  open: boolean;
  onClose: () => void;
  pageTitle: string;
  draftSections: CmsPageSectionItem[];
  publishedSections?: CmsPageSectionItem[];
  pageStatus: string;
}

export function DraftCompareModal({
  open,
  onClose,
  pageTitle,
  draftSections,
  publishedSections = [],
  pageStatus,
}: DraftCompareModalProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff-list">("side-by-side");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none">
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Columns className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground leading-tight">Visual Draft Comparison</h2>
              <p className="text-xs text-muted-foreground">Compare live published website vs. your working draft ({pageTitle})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-muted p-1 rounded-xl flex gap-1 border">
              <button
                onClick={() => setViewMode("side-by-side")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                  viewMode === "side-by-side" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode("diff-list")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                  viewMode === "diff-list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Section Diff List
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden p-4">
          {viewMode === "side-by-side" ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Published Live Panel */}
              <div className="border rounded-2xl flex flex-col overflow-hidden bg-muted/10">
                <div className="p-3 border-b bg-emerald-500/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Published Live Version ({publishedSections.length} Sections)
                  </span>
                  <IOSBadge variant="success" size="sm">Live</IOSBadge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {publishedSections.length === 0 ? (
                    <div className="py-20 text-center text-xs text-muted-foreground">No published version exists yet.</div>
                  ) : (
                    publishedSections.map((s) => (
                      <div key={s.id} className="border rounded-xl p-2 bg-background shadow-xs">
                        <SectionRenderer section={s} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Working Draft Panel */}
              <div className="border rounded-2xl flex flex-col overflow-hidden bg-primary/5 border-primary/30">
                <div className="p-3 border-b bg-primary/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Working Draft Version ({draftSections.length} Sections)
                  </span>
                  <IOSBadge variant="warning" size="sm">Draft</IOSBadge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {draftSections.map((s) => (
                    <div key={s.id} className="border rounded-xl p-2 bg-background shadow-xs">
                      <SectionRenderer section={s} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Diff List View */
            <div className="h-full overflow-y-auto space-y-3 p-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Draft Section Changes</h3>
              {draftSections.map((s, i) => {
                const publishedEquivalent = publishedSections.find((p) => p.id === s.id);
                const isNew = !publishedEquivalent;
                return (
                  <div key={s.id} className="p-4 rounded-xl border bg-background flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs">Section {i + 1}: {s.type.toUpperCase()}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Title: {(s.content as any)?.title || "Untitled"}</p>
                    </div>
                    {isNew ? (
                      <IOSBadge variant="success" size="sm">New Section Added</IOSBadge>
                    ) : (
                      <IOSBadge variant="secondary" size="sm">Updated Draft</IOSBadge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
