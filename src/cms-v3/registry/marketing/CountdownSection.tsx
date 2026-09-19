/**
 * SmartStore Website Studio (CMS V3) — Live Countdown Timer Component
 */

import React, { useState, useEffect } from "react";
import { PageNode, RenderContext, CountdownConfig } from "../../types/cms-v3";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function CountdownSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: CountdownSectionProps) {
  const props = node.props || {};
  const config: CountdownConfig = (props.config as CountdownConfig) || {
    targetDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days in future
    title: "Flash Offer Ends In:",
    expiredMessage: "This offer has expired.",
    ctaText: "Shop Deal Now",
    ctaUrl: "/menu",
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(config.targetDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setIsExpired(false);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [config.targetDate]);

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-countdown max-w-5xl mx-auto py-8 px-4 sm:px-6 my-4 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2"
      )}
    >
      <div className="space-y-1 text-center md:text-left">
        <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
          <Clock className="w-4 h-4 text-indigo-400" /> {config.title}
        </h3>
      </div>

      {isExpired ? (
        <span className="text-amber-400 font-bold text-sm">{config.expiredMessage}</span>
      ) : (
        <div className="flex items-center gap-3 font-mono">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="font-extrabold text-xl text-indigo-400 block">{timeLeft.days}</span>
            <span className="text-[10px] text-slate-500 uppercase">Days</span>
          </div>
          <span className="text-indigo-400 font-bold">:</span>
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="font-extrabold text-xl text-indigo-400 block">{timeLeft.hours}</span>
            <span className="text-[10px] text-slate-500 uppercase">Hours</span>
          </div>
          <span className="text-indigo-400 font-bold">:</span>
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="font-extrabold text-xl text-indigo-400 block">{timeLeft.minutes}</span>
            <span className="text-[10px] text-slate-500 uppercase">Mins</span>
          </div>
          <span className="text-indigo-400 font-bold">:</span>
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="font-extrabold text-xl text-indigo-400 block">{timeLeft.seconds}</span>
            <span className="text-[10px] text-slate-500 uppercase">Secs</span>
          </div>
        </div>
      )}

      {config.ctaText && (
        <a
          href={config.ctaUrl || "/menu"}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <span>{config.ctaText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
