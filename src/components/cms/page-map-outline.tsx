"use client";

import { useState } from "react";
import { CmsPageSectionItem, CmsSectionType } from "@/lib/use-cms-v2";
import { cn } from "@/lib/utils";
import { Layers, ChevronRight, ChevronLeft, GripVertical, Eye, EyeOff } from "lucide-react";

const SECTION_TYPE_SHORT_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  featured_menu: "Featured Menu",
  about: "Brand Story",
  gallery: "Photo Gallery",
  testimonials: "Testimonials",
  faq: "FAQ",
  contact_form: "Contact Form",
  appointment: "Table Booking",
  map: "Location Map",
  opening_hours: "Opening Hours",
  rich_text: "Rich Text",
  cta: "Call to Action",
  social_links: "Social Links",
  divider: "Divider",
};

interface PageMapOutlineProps {
  sections: CmsPageSectionItem[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  className?: string;
}

export function PageMapOutline({
  sections,
  selectedSectionId,
  onSelectSection,
  className,
}: PageMapOutlineProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (sections.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 bg-background/90 backdrop-blur-md border rounded-2xl shadow-xl transition-all select-none",
        collapsed ? "w-12 h-12 p-0 flex items-center justify-center" : "w-56 p-3 space-y-2",
        className
      )}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full h-full flex items-center justify-center text-primary hover:bg-muted/50 rounded-2xl"
          title="Open Page Map"
        >
          <Layers className="h-5 w-5" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Page Map ({sections.length})
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {sections.map((s, idx) => {
              const isSelected = s.id === selectedSectionId;
              const label =
                (s.content as any)?.title ||
                SECTION_TYPE_SHORT_LABELS[s.type] ||
                `Section ${idx + 1}`;

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSection(s.id)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between group",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span className="truncate max-w-[140px] text-[11px]">
                    {idx + 1}. {label}
                  </span>
                  {!s.is_visible && (
                    <EyeOff className={cn("h-3 w-3 shrink-0 opacity-60", isSelected ? "text-primary-foreground" : "text-amber-500")} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
