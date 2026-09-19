/**
 * SmartStore Website Studio (CMS V3) — Hero Component Section Renderer
 * Universal component used by Visual Editor Canvas and Public Storefront
 * Supports dynamic nested child AST nodes (childrenNodes) for full Elementor/Shopify parity.
 */

import React from "react";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { resolveComponentNode } from "../../renderer/contracts";
import { buildNodeStyleObject } from "../../renderer/styleResolver";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  node: PageNode;
  context: RenderContext;
  childrenNodes?: React.ReactNode;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function HeroSection({ node, context, childrenNodes, onSelectNode, isSelected }: HeroSectionProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const s = resolution.resolvedStyles;
  const b = resolution.activeBehaviors;
  const customCss = buildNodeStyleObject(s);

  const variant = node.variant || "split";
  const eyebrow = (p.eyebrow as string) || "";
  const title = (p.title as string) || "Welcome to Our Store";
  const subtitle = (p.subtitle as string) || (p.description as string) || "";
  const primaryCtaText = (p.primaryCtaText as string) || "";
  const primaryCtaLink = (p.primaryCtaLink as string) || "#";
  const secondaryCtaText = (p.secondaryCtaText as string) || "";
  const secondaryCtaLink = (p.secondaryCtaLink as string) || "#";
  const imageUrl = (p.imageUrl as string) || "";
  const overlayOpacity = typeof p.overlayOpacity === "number" ? p.overlayOpacity : 0;
  const contentAlign = (p.contentAlign as string) || "left";
  const mobileStackOrder = (p.mobileStackOrder as string) || "image_first";
  const textColorScheme = (p.textColorScheme as string) || "dark";

  // Animation inline styles & keyframes setup
  const entranceAnim = b?.entrance;
  const isReducedMotion = context.reducedMotion || b?.reducedMotion === "disable";

  const entranceStyle: React.CSSProperties = entranceAnim && !isReducedMotion ? {
    animationDuration: `${entranceAnim.durationMs || 600}ms`,
    animationDelay: `${entranceAnim.delayMs || 0}ms`,
    animationTimingFunction: entranceAnim.easing || "ease-out",
    animationFillMode: "both"
  } : {};

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "relative overflow-hidden transition-all duration-200 w-full",
        textColorScheme === "light" ? "text-white" : "text-slate-900"
      )}
      style={{
        paddingTop: (s.paddingY as string) || (s.padding as string) || "4rem",
        paddingBottom: (s.paddingY as string) || (s.padding as string) || "4rem",
        backgroundColor: (s.backgroundColor as string) || "var(--color-background)",
        ...customCss,
      }}
    >
      {/* Background Overlay */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 z-0 bg-slate-950"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Main Grid Layout */}
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid gap-8 items-center",
          variant === "centered-overlay" || contentAlign === "center"
            ? "grid-cols-1 text-center"
            : variant === "split-image-left"
            ? "grid-cols-1 lg:grid-cols-2 lg:direction-rtl"
            : "grid-cols-1 lg:grid-cols-2",
          mobileStackOrder === "image_first" && "flex flex-col-reverse lg:grid"
        )}
      >
        {/* Content Column */}
        <div
          className={cn(
            "space-y-4",
            entranceAnim?.type === "slide-up" && "animate-in fade-in slide-in-from-bottom-4",
            entranceAnim?.type === "fade-in" && "animate-in fade-in",
            entranceAnim?.type === "zoom-in" && "animate-in zoom-in-95"
          )}
          style={entranceStyle}
        >
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{eyebrow}</span>
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* CTA Group */}
          {(primaryCtaText || secondaryCtaText) && (
            <div className={cn(
              "pt-2 flex flex-wrap items-center gap-3",
              contentAlign === "center" ? "justify-center" : "justify-start"
            )}>
              {primaryCtaText && (
                <a
                  href={context.mode === "editor" ? undefined : primaryCtaLink}
                  onClick={(e) => {
                    if (context.mode === "editor") e.preventDefault();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span>{primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}

              {secondaryCtaText && (
                <a
                  href={context.mode === "editor" ? undefined : secondaryCtaLink}
                  onClick={(e) => {
                    if (context.mode === "editor") e.preventDefault();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all"
                >
                  <span>{secondaryCtaText}</span>
                </a>
              )}
            </div>
          )}

          {/* Dynamic Child AST Slot: Allows nested Text, Buttons, Images, Spacers inside Section */}
          {childrenNodes && (
            <div className="pt-4 flex flex-col gap-3 w-full">
              {childrenNodes}
            </div>
          )}
        </div>

        {/* Media Column (if split variant) */}
        {variant !== "centered-overlay" && imageUrl && (
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 group">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}
      </div>
    </section>
  );
}
