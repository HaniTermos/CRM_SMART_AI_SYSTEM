/**
 * SmartStore Website Studio (CMS V3) — Responsive Masonry Gallery Component
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

interface MasonryGallerySectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function MasonryGallerySection({
  node,
  context,
  onSelectNode,
  isSelected,
}: MasonryGallerySectionProps) {
  const props = node.props || {};
  const images: GalleryImage[] = (props.images as GalleryImage[]) || [
    { id: "g1", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", caption: "Artisanal Bread Selection" },
    { id: "g2", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff", caption: "Freshly Baked Croissants" },
    { id: "g3", url: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f", caption: "Specialty Coffee Bar" },
    { id: "g4", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", caption: "Gourmet Dessert Table" },
  ];

  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-masonry-gallery max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-6",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 rounded-2xl"
      )}
    >
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {images.map((img) => (
          <div
            key={img.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveImage(img);
            }}
            className="relative break-inside-avoid rounded-2xl overflow-hidden shadow-md group cursor-pointer bg-slate-900"
          >
            <img
              src={img.url}
              alt={img.caption || "Gallery Image"}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
              <div className="text-center text-white">
                <ZoomIn className="w-6 h-6 mx-auto mb-1 text-indigo-300" />
                {img.caption && <span className="font-bold text-xs block truncate">{img.caption}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery Lightbox"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-white transition"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImage.url}
              alt={activeImage.caption || "Full Image"}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            {activeImage.caption && (
              <div className="p-3 text-center text-xs font-bold text-slate-200">
                {activeImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
