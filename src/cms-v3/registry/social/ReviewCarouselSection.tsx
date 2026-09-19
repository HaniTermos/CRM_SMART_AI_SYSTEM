/**
 * SmartStore Website Studio (CMS V3) — Review Carousel Component
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { Star, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  text: string;
  verified?: boolean;
}

interface ReviewCarouselSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function ReviewCarouselSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: ReviewCarouselSectionProps) {
  const props = node.props || {};
  const reviews: ReviewItem[] = (props.reviews as ReviewItem[]) || [
    { id: "r1", author: "Sarah Mitchell", rating: 5, text: "The best sourdough and pastries in town! Fresh every morning.", verified: true },
    { id: "r2", author: "David Vance", rating: 5, text: "Exceptional dining experience and friendly staff. Highly recommended!", verified: true },
    { id: "r3", author: "Elena Rostova", rating: 5, text: "Online ordering is seamless and delivery was fast and warm.", verified: true },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const currentReview = reviews[currentIndex] || reviews[0];

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-review-carousel max-w-4xl mx-auto py-12 px-6 my-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-6 text-center relative",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2"
      )}
    >
      <div className="flex justify-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-5 h-5",
              i < (currentReview?.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-700"
            )}
          />
        ))}
      </div>

      <blockquote className="text-base sm:text-lg font-medium text-slate-200 italic max-w-2xl mx-auto leading-relaxed">
        "{currentReview?.text}"
      </blockquote>

      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="font-bold text-white">{currentReview?.author}</span>
        {currentReview?.verified && (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Customer
          </span>
        )}
      </div>

      {/* Navigation Arrow Controls */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          aria-label="Previous Review"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-500">
          {currentIndex + 1} / {reviews.length}
        </span>
        <button
          onClick={nextSlide}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          aria-label="Next Review"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
