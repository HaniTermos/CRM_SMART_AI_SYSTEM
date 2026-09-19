/**
 * SmartStore Website Studio (CMS V3) — Store-Scoped Newsletter Component
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function NewsletterSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: NewsletterSectionProps) {
  const props = node.props || {};
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/cms-v3/me/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentGiven: consent, storeId: context.storeId }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-newsletter max-w-4xl mx-auto py-12 px-6 my-6 bg-indigo-900 text-white rounded-3xl shadow-2xl text-center space-y-4",
        isSelected && "ring-2 ring-indigo-400 ring-offset-2"
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-800 text-indigo-200 flex items-center justify-center mx-auto">
        <Mail className="w-6 h-6" />
      </div>

      <h3 className="font-extrabold text-xl tracking-tight">{(props.title as string) || "Subscribe to Our Weekly Delights"}</h3>
      <p className="text-xs text-indigo-200 max-w-md mx-auto leading-relaxed">
        {(props.subtitle as string) || "Get exclusive offers, new product launches, and secret recipes delivered straight to your inbox."}
      </p>

      {submitted ? (
        <div className="p-4 rounded-2xl bg-indigo-950/60 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 max-w-md mx-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Thank you for subscribing to our updates!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-950 border border-indigo-700 text-white placeholder-indigo-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !consent}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : "Subscribe"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 text-[11px] text-indigo-300 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded border-indigo-700 text-indigo-500"
            />
            <span>I agree to receive promotional email updates and offer notifications.</span>
          </label>
        </form>
      )}
    </div>
  );
}
