/**
 * SmartStore Website Studio (CMS V3) — Accessible Popup Lead Capture Modal Component
 */

import React, { useState, useEffect, useRef } from "react";
import { PageNode, RenderContext, PopupConfig } from "../../types/cms-v3";
import { PopupTriggerEngine } from "../../shared/PopupTriggerEngine";
import { X, Sparkles, Copy, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface PopupModalSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function PopupModalSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: PopupModalSectionProps) {
  const props = node.props || {};
  const config: PopupConfig = (props.config as PopupConfig) || {
    id: node.id || "popup-1",
    title: "Unlock 15% OFF Your First Order!",
    bodyText: "Subscribe to our newsletter to receive exclusive daily offers and event invitations.",
    triggerType: "time_delay",
    delaySeconds: 5,
    scrollPercentage: 50,
    promoCode: "WELCOME15",
    ctaText: "Claim Discount",
    ctaUrl: "/menu",
    dismissible: true,
    appearance: {},
  };

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Attach Trigger Engine listeners outside editor mode
  useEffect(() => {
    return PopupTriggerEngine.listenForTrigger(config, context, () => {
      setIsOpen(true);
    });
  }, [config, context]);

  // Focus Trap & Escape Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        PopupTriggerEngine.setDismissed(config.id);
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, config.id]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.promoCode) {
      navigator.clipboard.writeText(config.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Visual Editor Control Banner
  if (context.mode === "editor") {
    return (
      <div
        onClick={(e) => {
          if (onSelectNode) {
            e.stopPropagation();
            onSelectNode(node.id);
          }
        }}
        className={cn(
          "p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between my-4",
          isSelected && "ring-2 ring-indigo-500"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Popup Lead Modal Configuration: <strong>{config.title}</strong></span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
        >
          <Eye className="w-3.5 h-3.5" /> Preview Modal
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Promotional Popup Modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        setIsOpen(false);
        PopupTriggerEngine.setDismissed(config.id);
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-slate-900 space-y-4 relative animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={() => {
            setIsOpen(false);
            PopupTriggerEngine.setDismissed(config.id);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          aria-label="Close Popup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
          <Sparkles className="w-5 h-5" />
        </div>

        <h3 className="font-extrabold text-lg tracking-tight text-slate-900">{config.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{config.bodyText}</p>

        {config.promoCode && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-indigo-700">{config.promoCode}</span>
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
        )}

        {config.ctaText && (
          <a
            href={config.ctaUrl || "/menu"}
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center block shadow-md transition"
          >
            {config.ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
