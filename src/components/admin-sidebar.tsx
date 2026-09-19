"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { NAV_GROUPS } from "@/lib/nav-config";
import { useNavLayout } from "@/lib/nav-layout-context";
import { PanelLeftClose, Store, ExternalLink } from "lucide-react";
import { useMyStore } from "@/lib/use-my-store";
import { cn } from "@/lib/utils";

export function AdminSidebar({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation();
  const { navMode, setNavMode } = useNavLayout();
  const { data: store } = useMyStore();

  if (!mobile && navMode !== "sidebar") {
    return null;
  }

  const storeSlug = store?.slug ?? "";
  const shopUrl = storeSlug ? `${window.location.origin}/shop/${storeSlug}` : "#";

  const baseClasses = mobile
    ? "h-full flex flex-col bg-background"
    : "fixed top-0 left-0 bottom-0 z-30 w-64 border-r border-border/40 bg-white/80 dark:bg-[#0a0a1a]/90 backdrop-blur-xl flex flex-col pt-16 pb-4 transition-all";

  return (
    <aside className={baseClasses}>
      {/* Sidebar Top / Store Brand info */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#190E85] via-[#2D1B9E] to-[#00E0FF] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {store?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate text-foreground">{store?.name || "SmartStore AI"}</p>
            {storeSlug && (
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
              >
                <span>/shop/{storeSlug}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            )}
          </div>
        </div>
        {!mobile && (
          <button
            onClick={() => setNavMode("dock")}
            title="Switch to Bottom Dock mode"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links Grouped */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.route || location.pathname.startsWith(`${item.route}/`);

                return (
                  <Link
                    key={item.route}
                    to={item.route}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && !mobile && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute right-0 top-1.5 bottom-1.5 w-1 rounded-l-full bg-primary"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Switcher back to Dock */}
      {!mobile && (
        <div className="p-3 border-t border-border/40">
          <button
            onClick={() => setNavMode("dock")}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Switch to Bottom Dock</span>
          </button>
        </div>
      )}
    </aside>
  );
}
