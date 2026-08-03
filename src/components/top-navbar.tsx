"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { ExternalLink, Zap, QrCode, Sun, Moon, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  const { isDark, toggleDark } = useTheme();
  const storeSlug = "lumina-bistro"; // TODO: wire to useMyStore
  const shopUrl = `http://localhost:8080/shop/${storeSlug}`;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="font-bold text-sm hidden sm:block">SmartStore</span>
          </Link>

          {/* Center: Quick Actions */}
          <div className="flex items-center gap-1.5">
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                "bg-primary/8 text-primary hover:bg-primary/15"
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Shop</span>
            </a>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all">
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick Order</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
              <QrCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">QR Codes</span>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
            </button>
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#00E0FF] flex items-center justify-center text-white text-xs font-bold ml-1">
              H
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
