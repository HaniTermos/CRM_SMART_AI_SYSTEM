"use client";

import { CmsPageSectionItem } from "@/lib/use-cms-v2";
import { getMotionCssClasses } from "./section-schema";
import { cn } from "@/lib/utils";
import { Calendar, Utensils, ArrowRight, Star, Sparkles } from "lucide-react";

export function HeroSection({ section }: { section: CmsPageSectionItem }) {
  const content = section.content || {};
  const appearance = section.appearance || {};
  const layout = section.layout || {};
  const motionCss = getMotionCssClasses(appearance.motion);

  const variant = content.variant || "centered";
  const eyebrow = content.eyebrow || "Welcome to Our Store";
  const title = content.title || "Artisanal Taste Crafted Daily";
  const subtitle = content.subtitle || "Experience handcrafted culinary creations using fresh local ingredients.";
  const ctaPrimary = content.cta_primary_text || "Explore Menu";
  const ctaSecondary = content.cta_secondary_text || "Book Table";
  const imageUrl = content.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80";

  if (variant === "split_left" || variant === "split_right") {
    const isImageLeft = variant === "split_left";
    return (
      <div className={cn("py-12 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center", motionCss)}>
        <div className={cn("space-y-4", !isImageLeft && "md:order-1")}>
          <div className="w-full aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border relative group">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
        <div className={cn("space-y-5", !isImageLeft && "md:order-0")}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3 w-3" /> {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-foreground">{title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">{subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2">
              {ctaPrimary} <ArrowRight className="h-4 w-4" />
            </button>
            {ctaSecondary && (
              <button className="px-6 py-3 rounded-2xl border bg-background hover:bg-muted font-bold text-sm text-foreground transition-all">
                {ctaSecondary}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("py-20 px-6 max-w-4xl mx-auto text-center space-y-6", motionCss)}>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-tight">{title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
        <div className="flex justify-center gap-4 pt-2">
          <button className="px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all">
            {ctaPrimary}
          </button>
        </div>
      </div>
    );
  }

  // Default: Centered Hero Banner with Background Image Overlay
  return (
    <div className={cn("relative min-h-[480px] sm:min-h-[560px] flex items-center justify-center text-center p-8 overflow-hidden rounded-3xl my-4 mx-4 shadow-2xl border", motionCss)}>
      <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="relative z-10 max-w-3xl space-y-6 text-white">
        <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30">
          {eyebrow}
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight drop-shadow-md">{title}</h1>
        <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">{subtitle}</p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button className="px-8 py-4 rounded-2xl bg-white text-black font-extrabold text-sm shadow-2xl hover:bg-white/90 hover:scale-105 transition-all flex items-center gap-2">
            {ctaPrimary} <ArrowRight className="h-4 w-4 text-black" />
          </button>
          {ctaSecondary && (
            <button className="px-8 py-4 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/40 font-bold text-sm hover:bg-white/30 transition-all">
              {ctaSecondary}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
