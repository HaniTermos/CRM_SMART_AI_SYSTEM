"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReportHourlyDensity } from "@/lib/use-reports";

const HOURS = ["11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function intensityColor(value: number, max: number, isDark: boolean) {
  if (max === 0) return isDark ? "bg-slate-800" : "bg-slate-100";
  const ratio = value / max;
  if (ratio < 0.2) return isDark ? "bg-slate-800" : "bg-slate-100";
  if (ratio < 0.4) return isDark ? "bg-[#190E85]/30" : "bg-[#190E85]/8";
  if (ratio < 0.6) return isDark ? "bg-[#190E85]/45" : "bg-[#190E85]/18";
  if (ratio < 0.8) return isDark ? "bg-[#190E85]/60" : "bg-[#190E85]/35";
  return isDark ? "bg-[#00E0FF]/50" : "bg-[#190E85]";
}

export function HourlyHeatmap({ isDark = false }: { isDark?: boolean }) {
  const { data: density = [], isLoading } = useReportHourlyDensity(4);

  const { data, max, peak } = useMemo(() => {
    const grid = DAYS.map(() => HOURS.map(() => 0));
    let maxVal = 0;
    let peakLabel = "—";

    for (const d of density) {
      // PostgreSQL EXTRACT(DOW) returns 0=Sunday, 1=Monday... map to Mon=0..Sun=6
      const pgDay = Number(d.day_of_week);
      const dayIndex = pgDay === 0 ? 6 : pgDay - 1;
      const hourIndex = Number(d.hour) - 11;
      if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 12) {
        grid[dayIndex][hourIndex] = Number(d.orders);
        if (d.orders > maxVal) {
          maxVal = d.orders;
          peakLabel = `${DAYS[dayIndex]} ${HOURS[hourIndex]} (${d.orders} orders)`;
        }
      }
    }
    return { data: grid, max: maxVal, peak: peakLabel };
  }, [density]);

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

        {isLoading ? (
          <div className="flex items-center justify-center h-[260px]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
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
                  {HOURS.map((h, hi) => (
                    <motion.div
                      key={hi}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: (di * 12 + hi) * 0.004, type: "spring", damping: 20 }}
                      className={cn(
                        "flex-1 aspect-square rounded-[3px] transition-colors hover:ring-2 hover:ring-primary/30 cursor-pointer",
                        intensityColor(data[di][hi], max, isDark)
                      )}
                      title={`${day} ${HOURS[hi]}: ${data[di][hi]} orders`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-muted-foreground font-medium">
                Peak: {peak}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Low</span>
                <div className="flex gap-[2px]">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                    <div key={v} className={cn("w-3 h-3 rounded-[2px]", intensityColor(v * max, max || 1, isDark))} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
            </div>
          </>
        )}
      </IOSCard>
    </motion.div>
  );
}
