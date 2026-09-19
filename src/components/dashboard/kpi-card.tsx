"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

function CircularProgress({
  value, max = 100, size = 40, strokeWidth = 3.5, color = "#190E85"
}: {
  value: number; max?: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(value / max, 1);
  const offset = circumference - percentage * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeOpacity={0.1} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
      />
    </svg>
  );
}

export function KpiCard({
  label, value, previousValue, prefix = "", suffix = "", delay = 0,
  icon, progress, progressColor = "#190E85", sparklineData, onClick,
}: any) {
  const numeric = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  const display = useCountUp(numeric);
  const trend = previousValue ? ((numeric - previousValue) / previousValue) * 100 : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="h-full"
      onClick={onClick}
    >
      <div className={cn(
        "glass-card h-full flex flex-col p-4 sm:p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      )}>
        <div className="flex items-start justify-between flex-1">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {icon && <div className="p-1.5 rounded-lg bg-primary/8 text-primary">{icon}</div>}
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {label}
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight">
              {prefix}{display.toLocaleString()}{suffix}
            </p>
            {previousValue !== undefined && (
              <div className={cn("flex items-center gap-1 text-[10px] sm:text-xs font-medium", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>{trend > 0 ? "+" : ""}{trend.toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal">vs last week</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
            {progress && (
              <div className="relative">
                <CircularProgress value={progress.current} max={progress.max} size={44} color={progressColor} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                  {Math.round((progress.current / progress.max) * 100)}%
                </span>
              </div>
            )}
            {sparklineData && !progress && (
              <svg width="64" height="24" className="opacity-40">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  points={sparklineData.map((v: number, i: number) =>
                    `${(i / (sparklineData.length - 1)) * 64},${24 - ((v - Math.min(...sparklineData)) / (Math.max(...sparklineData) - Math.min(...sparklineData) || 1)) * 24}`
                  ).join(" ")}
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
