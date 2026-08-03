"use client";

import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Clock, ShoppingCart, CalendarCheck, Star, AlertTriangle, UserPlus, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVITIES = [
  { id: 1, icon: <ShoppingCart className="h-3.5 w-3.5" />, color: "text-emerald-500", bg: "bg-emerald-500/10", title: "New order #1024 — Table 3", subtitle: "$84.50", time: "2 min ago", type: "order" },
  { id: 2, icon: <CalendarCheck className="h-3.5 w-3.5" />, color: "text-sky-500", bg: "bg-sky-500/10", title: "Reservation — Table 5, 8 PM", subtitle: "4 guests", time: "5 min ago", type: "reservation" },
  { id: 3, icon: <Star className="h-3.5 w-3.5" />, color: "text-amber-500", bg: "bg-amber-500/10", title: "5-star review from Maya K.", subtitle: "\"Best shawarma in Beirut!\"", time: "12 min ago", type: "review" },
  { id: 4, icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-500", bg: "bg-red-500/10", title: "Coffee beans stock critically low", subtitle: "Only 3 bags remaining", time: "18 min ago", type: "alert" },
  { id: 5, icon: <Package className="h-3.5 w-3.5" />, color: "text-primary", bg: "bg-primary/10", title: "Order #1023 ready for pickup", subtitle: "Takeaway", time: "24 min ago", type: "order" },
  { id: 6, icon: <UserPlus className="h-3.5 w-3.5" />, color: "text-[#CF00FF]", bg: "bg-[#CF00FF]/10", title: "New customer: John Doe", subtitle: "First visit", time: "31 min ago", type: "customer" },
];

export function LiveActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Clock className="h-5 w-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <h3 className="font-semibold text-base">Live Activity</h3>
          </div>
          <IOSBadge variant="success" size="sm">Live</IOSBadge>
        </div>

        <div className="space-y-1">
          {ACTIVITIES.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group cursor-pointer"
            >
              <div className={cn("p-2 rounded-lg shrink-0", activity.bg, activity.color)}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </IOSCard>
    </motion.div>
  );
}
