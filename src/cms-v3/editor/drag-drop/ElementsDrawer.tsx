/**
 * SmartStore Website Studio (CMS V3) — Components Catalog Drawer
 * Unified icon-grid catalog grouped by category (no search/filter tabs).
 */

import React from "react";
import {
  Layout,
  Type,
  Image as ImageIcon,
  Square,
  Columns,
  Grid,
  ShoppingBag,
  Sparkles,
  Clock,
  Mail,
  Star,
  Minus,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { useDragDrop } from "./dragContext";
import { cn } from "@/lib/utils";

export interface ComponentItem {
  key: string;
  label: string;
  category: "Layout" | "Basic" | "Content" | "Commerce";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  initialProps?: Record<string, unknown>;
  initialStyles?: Record<string, unknown>;
}

export const COMPONENT_CATALOG: ComponentItem[] = [
  { key: "flex-container", label: "Div block", category: "Layout", icon: Square, description: "Generic container", initialStyles: { display: "flex", flexDirection: "column", padding: "1.5rem" } },
  { key: "flex-container", label: "Flexbox", category: "Layout", icon: Columns, description: "Flex layout", initialStyles: { display: "flex", flexDirection: "row", gap: "1rem", padding: "1.5rem" } },
  { key: "grid-container", label: "Grid", category: "Layout", icon: Grid, description: "CSS Grid", initialStyles: { display: "grid", columns: 3, gap: "1.5rem", padding: "1.5rem" } },
  { key: "hero", label: "Hero Section", category: "Layout", icon: Layout, description: "Banner with heading, CTA, media", initialProps: { title: "Welcome", primaryCtaText: "Shop Now", primaryCtaLink: "/menu" } },
  { key: "header", label: "Header", category: "Layout", icon: Layout, description: "Site header bar" },
  { key: "footer", label: "Footer", category: "Layout", icon: Layout, description: "Site footer" },
  { key: "text", label: "Heading", category: "Basic", icon: Type, description: "H1–H6 heading", initialProps: { tag: "h2", title: "Heading" }, initialStyles: { fontSize: "2.25rem", fontWeight: 700 } },
  { key: "text", label: "Paragraph", category: "Basic", icon: Minus, description: "Body text", initialProps: { tag: "p", content: "Your paragraph text here." }, initialStyles: { fontSize: "1rem", lineHeight: "1.6" } },
  { key: "button", label: "Button", category: "Basic", icon: Square, description: "CTA button", initialProps: { label: "Click Here", url: "/menu" } },
  { key: "image", label: "Image", category: "Basic", icon: ImageIcon, description: "Responsive image", initialProps: { url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", alt: "Image" } },
  { key: "icon", label: "Icon", category: "Basic", icon: Sparkles, description: "Lucide icon", initialProps: { name: "Sparkles" } },
  { key: "divider", label: "Divider", category: "Basic", icon: Minus, description: "Horizontal rule" },
  { key: "spacer", label: "Spacer", category: "Basic", icon: ArrowUpDown, description: "Vertical space", initialStyles: { height: "3rem" } },
  { key: "faq-accordion", label: "Accordion", category: "Content", icon: Layers, description: "FAQ / tabs" },
  { key: "story-about", label: "About", category: "Content", icon: Sparkles, description: "About section" },
  { key: "testimonials", label: "Testimonials", category: "Content", icon: Star, description: "Review cards" },
  { key: "contact-form", label: "Contact Form", category: "Content", icon: Mail, description: "Inquiry form" },
  { key: "newsletter", label: "Newsletter", category: "Content", icon: Mail, description: "Email signup" },
  { key: "product-grid", label: "Product Grid", category: "Commerce", icon: ShoppingBag, description: "Product showcase" },
  { key: "countdown", label: "Countdown", category: "Commerce", icon: Clock, description: "Sale timer" },
];

const CATEGORIES: ComponentItem["category"][] = ["Layout", "Basic", "Content", "Commerce"];

interface ElementsDrawerProps {
  onInsertElement: (componentKey: string, initialProps?: any, initialStyles?: any) => void;
}

export function ElementsDrawer({ onInsertElement }: ElementsDrawerProps) {
  const { startDrag, endDrag } = useDragDrop();

  return (
    <div className="flex flex-col h-full bg-[#1e2024]/95 backdrop-blur-xl text-slate-200">
      <div className="px-4 py-3 border-b border-slate-800/80 shrink-0 bg-slate-950/60">
        <h3 className="text-sm font-bold text-white">Components</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Drag or click to insert</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5 min-h-0">
        {CATEGORIES.map((cat) => {
          const items = COMPONENT_CATALOG.filter((i) => i.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">{cat}</p>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`${cat}-${item.label}-${item.key}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", item.key);
                        startDrag({
                          type: "new_component",
                          componentKey: item.key,
                          title: item.label,
                          initialProps: item.initialProps,
                          initialStyles: item.initialStyles,
                        });
                      }}
                      onDragEnd={() => endDrag()}
                      onClick={() => onInsertElement(item.key, item.initialProps, item.initialStyles)}
                      className={cn(
                        "group flex flex-col items-center justify-center p-3 rounded-xl",
                        "bg-slate-900/60 hover:bg-slate-850/90 border border-slate-750/70",
                        "hover:border-indigo-500/50 cursor-grab active:cursor-grabbing transition-all text-center"
                      )}
                      title={item.description}
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-950/80 flex items-center justify-center text-slate-300 group-hover:text-indigo-300 border border-slate-800 mb-1.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 group-hover:text-white line-clamp-2 leading-tight">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
