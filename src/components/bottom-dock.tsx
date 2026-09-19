"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { DOCK_ITEMS, DOCK_MORE_ITEMS, type NavItem } from "@/lib/nav-config";
import { useNavLayout } from "@/lib/nav-layout-context";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { navMode } = useNavLayout();
  const [hovered, setHovered] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  if (navMode === "sidebar") return null;

  const coreItems = DOCK_ITEMS.filter((i) => i.id !== "settings");
  const settingsItem = DOCK_ITEMS.find((i) => i.id === "settings");
  const moreItems = DOCK_MORE_ITEMS;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 px-4 pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-3xl border shadow-2xl backdrop-blur-2xl
                     bg-white/70 border-black/5 text-slate-700
                     dark:bg-[rgba(15,15,35,0.7)] dark:border-white/10 dark:text-white/70"
          style={{
            boxShadow: "0 20px 60px -15px rgba(0,0,0,0.25), inset 0 1px 0 0 rgba(255,255,255,0.4)",
          }}
        >
          {coreItems.map((tab) => (
            <DockButton
              key={tab.id}
              item={tab}
              isActive={isRouteActive(location.pathname, tab.route)}
              isHovered={hovered === tab.route}
              onHover={() => setHovered(tab.route)}
              onLeave={() => setHovered(null)}
              onClick={() => navigate({ to: tab.route })}
            />
          ))}

          {/* More button */}
          <DockButton
            item={{
              id: "more",
              icon: moreOpen ? X : MoreHorizontal,
              label: "More",
              route: "#",
            }}
            isActive={moreOpen}
            isHovered={hovered === "more"}
            onHover={() => setHovered("more")}
            onLeave={() => setHovered(null)}
            onClick={() => setMoreOpen((v) => !v)}
          />

          {/* Settings (last) */}
          {settingsItem && (
            <DockButton
              item={settingsItem}
              isActive={isRouteActive(location.pathname, settingsItem.route)}
              isHovered={hovered === settingsItem.route}
              onHover={() => setHovered(settingsItem.route)}
              onLeave={() => setHovered(null)}
              onClick={() => navigate({ to: settingsItem.route })}
            />
          )}
        </nav>
      </div>

      {/* More menu sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
          >
            <div className="rounded-3xl border bg-white/90 dark:bg-[rgba(15,15,35,0.9)] backdrop-blur-2xl shadow-2xl p-3">
              <div className="grid grid-cols-4 gap-2">
                {moreItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate({ to: item.route });
                      setMoreOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-2xl text-[10px] font-medium transition-colors",
                      isRouteActive(location.pathname, item.route)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="line-clamp-1">{item.dockLabel || item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-[35] bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DockButton({
  item,
  isActive,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const label = item.dockLabel || item.label;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
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
        className={`h-5 w-5 transition-colors ${
          isActive ? "text-[#190E85] dark:text-[#00E0FF]" : "text-slate-400 dark:text-white/50"
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
          {label}
        </motion.span>
      )}
    </motion.button>
  );
}

function isRouteActive(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}
