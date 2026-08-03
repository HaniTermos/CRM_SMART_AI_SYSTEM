"use client";

import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSBadge } from "@/components/ui/ios-badge";
import { CalendarCheck, Clock, Users, ChevronRight } from "lucide-react";

const RESERVATIONS = [
  { id: 1, name: "Ahmad K.", guests: 4, time: "7:00 PM", table: "Table 5", status: "confirmed" as const, note: "Birthday" },
  { id: 2, name: "Sarah M.", guests: 2, time: "7:30 PM", table: "Table 2", status: "seated" as const, note: "" },
  { id: 3, name: "The Georges", guests: 6, time: "8:00 PM", table: "Table 8", status: "confirmed" as const, note: "Window seat" },
  { id: 4, name: "Layla H.", guests: 3, time: "8:30 PM", table: "Table 3", status: "pending" as const, note: "" },
];

export function ReservationsWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">Tonight's Reservations</h3>
          </div>
          <button className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-2">
          {RESERVATIONS.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#00E0FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {r.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.note && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-medium">
                      {r.note}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.time}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {r.guests}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.table}</span>
                </div>
              </div>
              <IOSBadge
                variant={
                  r.status === "confirmed"
                    ? "success"
                    : r.status === "seated"
                    ? "aqua"
                    : "warning"
                }
                size="sm"
              >
                {r.status}
              </IOSBadge>
            </motion.div>
          ))}
        </div>
      </IOSCard>
    </motion.div>
  );
}
