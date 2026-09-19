/**
 * SmartStore Website Studio (CMS V3) — Announcement Bar Component
 */

import React, { useState, useEffect } from "react";
import { PageNode, RenderContext, AnnouncementConfig } from "../../types/cms-v3";
import { Sparkles, Copy, Check, X, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementBarSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function AnnouncementBarSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: AnnouncementBarSectionProps) {
  const props = node.props || {};
  const config = (props.config as AnnouncementConfig) || {
    id: "ann-1",
    message: "🎉 Special Promo: Get 20% OFF on all bakery items today!",
    promoCode: "SAVE20",
    ctaText: "Order Now",
    ctaUrl: "/menu",
    dismissible: true,
    tickerMode: false,
    appearance: {},
  };

  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Store Timezone Scheduled Start/End Evaluation
  const isScheduledActive = () => {
    if (!config.startTime && !config.endTime) return true;
    const now = new Date();
    if (config.startTime && new Date(config.startTime) > now) return false;
    if (config.endTime && new Date(config.endTime) < now) return false;
    return true;
  };

  if (isDismissed || !isScheduledActive()) {
    return null; // Prevents layout shift when hidden/expired
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.promoCode) {
      navigator.clipboard.writeText(config.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="region"
      aria-label="Announcement Banner"
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-announcement-bar w-full bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs transition-all z-30",
        isSelected && "ring-2 ring-indigo-400 ring-offset-2"
      )}
    >
      <div className="max-w-7xl mx-auto flex-1 flex items-center justify-center gap-3">
        <Megaphone className="w-4 h-4 text-indigo-200 shrink-0" />
        <span className="truncate">{String(config.message || props.message || "Special Offer Announcement")}</span>

        {config.promoCode && (
          <button
            onClick={handleCopyCode}
            className="px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-800 text-indigo-100 font-mono text-[11px] flex items-center gap-1 transition"
            title="Copy Promo Code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{config.promoCode}</span>
          </button>
        )}

        {config.ctaText && (
          <a
            href={config.ctaUrl || "/menu"}
            className="underline hover:text-indigo-200 transition font-bold"
          >
            {config.ctaText}
          </a>
        )}
      </div>

      {config.dismissible !== false && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="p-1 rounded hover:bg-indigo-700 text-indigo-200 hover:text-white transition"
          aria-label="Dismiss Announcement"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
