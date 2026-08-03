"use client";

import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const HOURS = ["11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DATA = DAYS.map(() => HOURS.map(() => Math.floor(Math.random() * 100)));

function intensityColor(value: number, isDark: boolean) {
  if (value < 20) return isDark ? "bg-slate-800" : "bg-slate-100";
  if (value < 40) return isDark ? "bg-[#190E85]/30" : "bg-[#190E85]/8";
  if (value < 60) return isDark ? "bg-[#190E85]/45" : "bg-[#190E85]/18";
  if (value < 80) return isDark ? "bg-[#190E85]/60" : "bg-[#190E85]/35";
  return isDark ? "bg-[#00E0FF]/50" : "bg-[#190E85]";
}

export function HourlyHeatmap({ isDark = false }: { isDark?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Hourly Density</h3>
        </div>

        <div className="space-y-1.5">
          <div className="flex gap-1">
            <div className="w-7" />
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-[9px] text-center text-muted-foreground font-medium">
                {h}
              </div>
            ))}
          </div>
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1">
              <div className="w-7 text-[9px] text-muted-foreground text-right pr-1 font-medium">
                {day}
              </div>
              {HOURS.map((_, hi) => (
                <motion.div
                  key={hi}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (di * 12 + hi) * 0.004, type: "spring", damping: 20 }}
                  className={cn(
                    "flex-1 aspect-square rounded-[3px] transition-colors hover:ring-2 hover:ring-primary/30 cursor-pointer",
                    intensityColor(DATA[di][hi], isDark)
                  )}
                  title={`${day} ${HOURS[hi]}: ${DATA[di][hi]} orders`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] text-muted-foreground font-medium">
            Peak: Fri 8PM (98 orders)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <div className="flex gap-[2px]">
              {[10, 30, 50, 70, 90].map((v) => (
                <div key={v} className={cn("w-3 h-3 rounded-[2px]", intensityColor(v, isDark))} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      </IOSCard>
    </motion.div>
  );
}
