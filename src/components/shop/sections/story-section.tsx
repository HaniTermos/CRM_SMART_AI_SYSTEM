"use client";

import { CmsPageSectionItem } from "@/lib/use-cms-v2";
import { getMotionCssClasses } from "./section-schema";
import { cn } from "@/lib/utils";
import { Quote, Award, Heart, ShieldCheck } from "lucide-react";

export function StorySection({ section }: { section: CmsPageSectionItem }) {
  const content = section.content || {};
  const appearance = section.appearance || {};
  const motionCss = getMotionCssClasses(appearance.motion);

  const variant = content.variant || "image_left";
  const title = content.title || "Our Culinary Journey";
  const subtitle = content.subtitle || "Handcrafted passion in every recipe";
  const description = content.description || "Founded with a vision for organic ingredients, traditional craftsmanship, and warm hospitality.";
  const imageUrl = content.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80";

  if (variant === "quote_centered") {
    return (
      <div className={cn("py-16 px-6 max-w-5xl mx-auto text-center space-y-6", motionCss)}>
        <Quote className="h-10 w-10 text-primary/40 mx-auto" />
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground italic leading-relaxed max-w-3xl mx-auto">
          "{description}"
        </h2>
        <p className="text-sm font-bold uppercase tracking-wider text-primary">— {title}</p>
      </div>
    );
  }

  const isImageRight = variant === "image_right";

  return (
    <div className={cn("py-16 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center", motionCss)}>
      <div className={cn("space-y-5", isImageRight && "md:order-1")}>
        <div className="w-full aspect-4/3 rounded-3xl overflow-hidden shadow-xl border relative">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className={cn("space-y-4", isImageRight && "md:order-0")}>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">{subtitle}</span>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">{title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-semibold">Artisanal Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-xs font-semibold">Locally Sourced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
