"use client";

import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSBadge } from "@/components/ui/ios-badge";
import { CalendarCheck, Clock, Users, ChevronRight, Loader2 } from "lucide-react";
import { useReservations } from "@/lib/use-reservations";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(time: string) {
  // time is stored as HH:MM; convert to 12-hour display
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function ReservationsWidget() {
  const today = new Date().toISOString().split("T")[0];
  const { data: reservations = [], isLoading, isError } = useReservations(today);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Unable to load reservations.
          </p>
        ) : reservations.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No reservations for today.
          </p>
        ) : (
          <div className="space-y-2">
            {reservations.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#00E0FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(r.customer_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{r.customer_name}</p>
                    {r.notes && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-medium">
                        {r.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(r.time)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {r.guests}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.table_label ? `Table ${r.table_label}` : r.floor_id ? "Table TBD" : ""}
                    </span>
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
        )}
      </IOSCard>
    </motion.div>
  );
}
