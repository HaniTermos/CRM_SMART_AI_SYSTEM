"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { GlassTable, GlassTableRow, GlassTableCell } from "@/components/ui/glass-table";
import {
  Target, Sparkles, TrendingUp, AlertTriangle, Users, DollarSign,
  Lightbulb, ChevronRight, RotateCcw, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const HISTORY = [
  { id: 1, idea: "Truffle Mushroom Burger", score: 87, confidence: "High", price: 18, date: "2 days ago" },
  { id: 2, idea: "Vegan Falafel Wrap", score: 72, confidence: "Medium", price: 12, date: "5 days ago" },
  { id: 3, idea: "Spicy Tuna Poke Bowl", score: 91, confidence: "High", price: 22, date: "1 week ago" },
];

const SEGMENT_CHIPS = [
  "Gen Z foodies", "Health-conscious", "Office lunch crowd", "Date night couples", "Families with kids"
];

export function DemandPage() {
  const [idea, setIdea] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState<typeof HISTORY[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScore = () => {
    if (!idea.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const score = Math.floor(60 + Math.random() * 35);
      setResult({
        id: Date.now(),
        idea: idea,
        score,
        confidence: score > 80 ? "High" : score > 70 ? "Medium" : "Low",
        price: parseFloat(price) || 15,
        date: "Just now",
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demand Scoring</h1>
          <p className="text-sm text-muted-foreground">AI scores your menu ideas against customer data and trends.</p>
        </div>
      </div>

      {/* Input Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#CF00FF]/15 to-[#190E85]/15">
            <Lightbulb className="h-5 w-5 text-[#CF00FF]" />
          </div>
          <div>
            <h3 className="font-semibold">New Menu Idea</h3>
            <p className="text-xs text-muted-foreground">Describe a dish and we will predict its success.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Dish Description</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A Lebanese-style shawarma bowl with tahini dressing, pickled turnips, and grilled chicken..."
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40 resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Target Price (USD)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="15.00"
                type="number"
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40"
              />
            </div>
            <div className="flex items-end">
              <IOSButton variant="gradient" className="w-full gap-2" onClick={handleScore} isLoading={loading}>
                <Zap className="h-4 w-4" />
                Score Idea
              </IOSButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-6 border-l-4"
            style={{ borderLeftColor: result.score > 80 ? "#03CF94" : result.score > 70 ? "#F59E0B" : "#EF4444" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{result.idea}</h3>
                <p className="text-sm text-muted-foreground">Target price: ${result.price}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: result.score > 80 ? "#03CF94" : result.score > 70 ? "#F59E0B" : "#EF4444" }}>
                  {result.score}<span className="text-lg text-muted-foreground">/100</span>
                </div>
                <IOSBadge variant={result.score > 80 ? "success" : result.score > 70 ? "warning" : "destructive"} size="sm">
                  {result.confidence} Confidence
                </IOSBadge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Market Fit", value: `${Math.min(result.score + 5, 95)}%`, icon: <Target className="h-4 w-4" />, color: "#190E85" },
                { label: "Profit Margin", value: `${Math.round((result.price - 4) / result.price * 100)}%`, icon: <DollarSign className="h-4 w-4" />, color: "#00E0FF" },
                { label: "Customer Demand", value: `${result.score}%`, icon: <TrendingUp className="h-4 w-4" />, color: "#03CF94" },
              ].map((stat) => (
                <div key={stat.label} className="glass-row p-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Segments</p>
              <div className="flex flex-wrap gap-2">
                {SEGMENT_CHIPS.slice(0, 3).map((seg) => (
                  <span key={seg} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/20">
                    {seg}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Consider offering a smaller portion size at $10 to capture price-sensitive customers without cannibalizing the main offering.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div>
        <h3 className="font-semibold text-base mb-3">History</h3>
        <div className="space-y-2">
          {HISTORY.map((item, i) => (
            <GlassTableRow key={item.id} delay={i * 0.05} className="grid-cols-[1fr_auto_auto_auto_auto]">
              <GlassTableCell>
                <p className="text-sm font-medium">{item.idea}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </GlassTableCell>
              <GlassTableCell>
                <span className="text-sm font-bold">{item.score}/100</span>
              </GlassTableCell>
              <GlassTableCell>
                <IOSBadge variant={item.confidence === "High" ? "success" : "warning"} size="sm">{item.confidence}</IOSBadge>
              </GlassTableCell>
              <GlassTableCell>
                <span className="text-sm">${item.price}</span>
              </GlassTableCell>
              <GlassTableCell>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </GlassTableCell>
            </GlassTableRow>
          ))}
        </div>
      </div>
    </div>
  );
}
