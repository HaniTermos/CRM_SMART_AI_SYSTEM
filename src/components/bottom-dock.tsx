// src/components/bottom-dock.tsx
"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Home, UtensilsCrossed, ShoppingCart, Users, ArrowLeftRight,
  Target, Star, BarChart3, Settings, Calendar, LayoutGrid,
  ChefHat, Package, UserCog, Gift,
} from "lucide-react";

const TABS = [
  { icon: Home, label: "Dash", route: "/dashboard" },
  { icon: UtensilsCrossed, label: "Menu", route: "/menu" },
  { icon: ShoppingCart, label: "Orders", route: "/orders" },
  { icon: Users, label: "Guests", route: "/customers" },
  { icon: Calendar, label: "Book", route: "/reservations" },
  { icon: LayoutGrid, label: "Floor", route: "/floor" },
  { icon: ChefHat, label: "Kitchen", route: "/kitchen" },
  { icon: Package, label: "Stock", route: "/inventory" },
  { icon: UserCog, label: "Staff", route: "/staff" },
  { icon: Gift, label: "Loyalty", route: "/loyalty" },
  { icon: ArrowLeftRight, label: "CRM", route: "/crm" },
  { icon: Target, label: "Demand", route: "/demand" },
  { icon: Star, label: "Reviews", route: "/reviews" },
  { icon: BarChart3, label: "Reports", route: "/reports" },
  { icon: Settings, label: "More", route: "/settings" },
];

export function BottomDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 px-4 pointer-events-none">
      <nav
        className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-3xl border shadow-2xl backdrop-blur-2xl
                   bg-white/60 border-black/5 text-slate-700
                   dark:bg-[rgba(15,15,35,0.6)] dark:border-white/10 dark:text-white/70"
        style={{
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.25), inset 0 1px 0 0 rgba(255,255,255,0.4)",
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.route;
          const isHovered = hovered === tab.route;

          return (
            <motion.button
              key={tab.route}
              onClick={() => navigate({ to: tab.route })}
              onMouseEnter={() => setHovered(tab.route)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ y: -6, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-colors"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(25,14,133,0.25), rgba(207,0,255,0.15))"
                  : "transparent",
              }}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${isActive ? "text-[#190E85] dark:text-[#00E0FF]" : "text-slate-400 dark:text-white/50"
                  } ${isHovered ? "text-slate-900 dark:text-white" : ""}`}
              />
              {isActive && (
                <motion.div
                  layoutId="dock-dot"
                  className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#190E85] dark:bg-[#00E0FF]"
                />
              )}
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/80 text-[10px] text-slate-800 dark:text-white whitespace-nowrap backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm"
                >
                  {tab.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}