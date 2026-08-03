"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { Sparkles, Zap, Users, TrendingUp, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const INSIGHTS = [
  {
    id: 1,
    icon: <Zap className="h-4 w-4 text-amber-500" />,
    bg: "bg-amber-500/10",
    text: "Coffee beans critically low. 3 orders pending. Restock 50 units.",
    action: "Restock",
    confidence: 94,
    type: "inventory",
  },
  {
    id: 2,
    icon: <Users className="h-4 w-4 text-sky-500" />,
    bg: "bg-sky-500/10",
    text: "Saturday rush predicted 2.3x volume. Add 2 servers 7-10 PM.",
    action: "Schedule",
    confidence: 87,
    type: "staffing",
  },
  {
    id: 3,
    icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    bg: "bg-emerald-500/10",
    text: "8 at-risk customers haven\'t ordered in 14+ days. Send 10% discount?",
    action: "Campaign",
    confidence: 82,
    type: "marketing",
  },
];

export function AiBriefing() {
  const [insights, setInsights] = useState(INSIGHTS);

  const dismiss = (id: number) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-[#00E0FF]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-base">AI Daily Briefing</h3>
          </div>
          <span className="text-xs text-muted-foreground">{insights.length} insights</span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 group hover:bg-muted transition-colors"
              >
                <div className={cn("p-2 rounded-lg shrink-0", insight.bg)}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <IOSButton variant="default" size="pill" className="h-7 text-[11px]">
                      {insight.action}
                      <ChevronRight className="h-3 w-3" />
                    </IOSButton>
                    <span className="text-[10px] text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(insight.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted-foreground/10"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </IOSCard>
    </motion.div>
  );
}
