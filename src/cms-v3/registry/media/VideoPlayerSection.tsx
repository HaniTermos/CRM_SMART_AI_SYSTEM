/**
 * SmartStore Website Studio (CMS V3) — Video Player Component
 */

import React, { useState } from "react";
import { PageNode, RenderContext, VideoConfig } from "../../types/cms-v3";
import { resolveMediaUrl } from "../../shared/MediaResolver";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function VideoPlayerSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: VideoPlayerSectionProps) {
  const props = node.props || {};
  const config: VideoConfig = (props.config as VideoConfig) || {
    provider: "youtube",
    videoUrl: (props.url as string) || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    posterImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    autoplay: false,
    muted: true,
    loop: false,
    aspectRatio: "16/9",
    modalLightbox: true,
  };

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const media = resolveMediaUrl(config.videoUrl, config.posterImageUrl);

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-video-player max-w-7xl mx-auto py-8 px-4 sm:px-6 relative",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 rounded-2xl"
      )}
    >
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-950 group">
        {/* Cover Poster with Play Trigger */}
        {config.modalLightbox || !config.autoplay ? (
          <div className="relative w-full h-full">
            <img
              src={media.posterUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"}
              alt="Video Poster"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/30 transition flex items-center justify-center">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transform transition hover:scale-110"
                aria-label="Play Video"
              >
                <Play className="w-7 h-7 fill-current ml-1" />
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={`${media.embedUrl}${config.autoplay ? "?autoplay=1&muted=1" : ""}`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title="Video Player"
          />
        )}
      </div>

      {/* Lightbox Dialog */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Video Lightbox"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white transition"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`${media.embedUrl}?autoplay=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Lightbox Player"
            />
          </div>
        </div>
      )}
    </div>
  );
}
