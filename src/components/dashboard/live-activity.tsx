"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Clock, ShoppingCart, CalendarCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrders } from "@/lib/use-orders";
import { useReservations } from "@/lib/use-reservations";
import { useMyStore } from "@/lib/use-my-store";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type ActivityItem = {
  id: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  time: string;
  sortKey: number;
};

export function LiveActivity() {
  const { data: store } = useMyStore();
  const today = new Date().toISOString().split("T")[0];
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: reservations = [], isLoading: reservationsLoading } = useReservations(today);
  const isLoading = ordersLoading || reservationsLoading;

  const activities = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];

    for (const order of orders.slice(0, 6)) {
      list.push({
        id: `order-${order.id}`,
        icon: <ShoppingCart className="h-3.5 w-3.5" />,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        title: `Order #${order.order_number}${order.table_label ? ` — Table ${order.table_label}` : ""}`,
        subtitle: `${store?.currency === "EUR" ? "€" : "$"}${Number(order.total).toFixed(2)}`,
        time: timeAgo(order.created_at),
        sortKey: new Date(order.created_at).getTime(),
      });
    }

    for (const r of reservations.slice(0, 4)) {
      list.push({
        id: `res-${r.id}`,
        icon: <CalendarCheck className="h-3.5 w-3.5" />,
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        title: `Reservation — ${r.table_label ? `Table ${r.table_label}` : "Booking"}, ${r.time.slice(0, 5)}`,
        subtitle: `${r.guests} guests`,
        time: timeAgo(r.created_at || `${r.date}T${r.time}`),
        sortKey: new Date(r.created_at || `${r.date}T${r.time}`).getTime(),
      });
    }

    return list.sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
  }, [orders, reservations, store?.currency]);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No recent activity. Orders and reservations will appear here.
          </p>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, i) => (
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
        )}
      </IOSCard>
    </motion.div>
  );
}
