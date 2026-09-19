/**
 * SmartStore Website Studio (CMS V3) — Breadcrumbs Component with JSON-LD Metadata
 */

import React from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbTrailItem {
  label: string;
  url?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsSectionProps {
  node: PageNode;
  context: RenderContext;
  items?: BreadcrumbTrailItem[];
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function BreadcrumbsSection({
  node,
  context,
  items = [
    { label: "Home", url: "/" },
    { label: "Menu Catalog", url: "/menu" },
    { label: "Artisanal Pastries", isCurrent: true },
  ],
  onSelectNode,
  isSelected,
}: BreadcrumbsSectionProps) {
  // Generate Schema.org BreadcrumbList JSON-LD metadata
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.url ? `${window.location.origin}${item.url}` : undefined,
    })),
  };

  return (
    <nav
      aria-label="Breadcrumb Navigation"
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-breadcrumbs py-3 px-4 sm:px-6 max-w-7xl mx-auto text-xs text-slate-500 flex items-center gap-2 overflow-x-auto",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 rounded-lg"
      )}
    >
      {/* Embedded Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}

          {item.isCurrent ? (
            <span aria-current="page" className="font-bold text-slate-900 truncate">
              {item.label}
            </span>
          ) : (
            <a
              href={item.url || "#"}
              className="hover:text-indigo-600 font-medium transition flex items-center gap-1 shrink-0"
            >
              {index === 0 && <Home className="w-3.5 h-3.5" />}
              <span>{item.label}</span>
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
