"use client";

import { useState } from "react";
import { CmsPageSectionItem } from "@/lib/use-cms-v2";
import { IOSBadge } from "@/components/ui/ios-badge";
import { AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletenessCheckerProps {
  sections: CmsPageSectionItem[];
  pageTitle: string;
  seoTitle?: string;
  seoDescription?: string;
}

export function CompletenessChecker({
  sections,
  pageTitle,
  seoTitle,
  seoDescription,
}: CompletenessCheckerProps) {
  const [expanded, setExpanded] = useState(false);

  const checks = [
    {
      id: "hero",
      label: "Hero Banner",
      passed: sections.some((s) => s.type === "hero"),
      tip: "Add a Hero section to capture customer attention with high-impact visuals and CTAs.",
    },
    {
      id: "menu",
      label: "Featured Menu / Products",
      passed: sections.some((s) => s.type === "featured_menu"),
      tip: "Include a Featured Menu section so customers can immediately browse your best offerings.",
    },
    {
      id: "story",
      label: "Brand Story / About",
      passed: sections.some((s) => s.type === "about"),
      tip: "Share your unique culinary or craft story to build trust and brand identity.",
    },
    {
      id: "contact",
      label: "Contact or Location Map",
      passed: sections.some((s) => s.type === "contact_form" || s.type === "map" || s.type === "opening_hours" || s.type === "appointment"),
      tip: "Ensure customers can easily find your store address, operating hours, or contact form.",
    },
    {
      id: "seo",
      label: "SEO Metadata",
      passed: Boolean(seoTitle && seoDescription),
      tip: "Fill out your page SEO title and meta description to rank higher on search engines.",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="bg-background/95 backdrop-blur-md border rounded-2xl p-3 shadow-md space-y-2 select-none">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("h-4 w-4", score === 100 ? "text-emerald-500" : "text-amber-500")} />
          <span className="text-xs font-bold text-foreground">Content Audit Score: {score}%</span>
          <IOSBadge variant={score === 100 ? "success" : "warning"} size="sm">
            {passedCount}/{checks.length} Passed
          </IOSBadge>
        </div>
        <button className="p-1 text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-2 border-t space-y-2 text-xs">
          {checks.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-muted/30">
              {c.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-foreground text-[11px]">{c.label}</p>
                {!c.passed && <p className="text-[10px] text-muted-foreground mt-0.5">{c.tip}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
