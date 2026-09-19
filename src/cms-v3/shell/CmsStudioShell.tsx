/**
 * SmartStore Website Studio (CMS V3) — Dedicated Studio Shell Layout
 * Completely isolated from operational dashboard shell (No AdminSidebar, BottomDock, or Operations AI).
 */

import React, { useState } from "react";
import { Link, useLocation, Outlet } from "@tanstack/react-router";
import {
  Layout,
  FileText,
  Navigation,
  Palette,
  LayoutTemplate,
  Image,
  Megaphone,
  FormInput,
  Calendar,
  Search,
  History,
  Sparkles,
  Settings,
  ExternalLink,
  ArrowLeft,
  Menu as MenuIcon,
  X,
  Store,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", path: "/cms-v3", icon: Layout },
  { label: "Pages", path: "/cms-v3/website/pages", icon: FileText },
  { label: "Navigation", path: "/cms-v3/website/navigation", icon: Navigation },
  { label: "Theme & Design", path: "/cms-v3/website/theme", icon: Palette },
  { label: "Templates", path: "/cms-v3/website/templates", icon: LayoutTemplate },
  { label: "Media Library", path: "/cms-v3/website/media", icon: Image },
  { label: "Announcements", path: "/cms-v3/website/announcements", icon: Megaphone },
  { label: "Forms & Messages", path: "/cms-v3/website/forms", icon: FormInput },
  { label: "Appointments", path: "/cms-v3/website/appointments", icon: Calendar },
  { label: "SEO & Sharing", path: "/cms-v3/website/seo", icon: Search },
  { label: "Version History", path: "/cms-v3/website/versions", icon: History },
  { label: "AI Studio", path: "/cms-v3/website/ai", icon: Sparkles },
  { label: "Settings", path: "/cms-v3/website/settings", icon: Settings },
];

export function CmsStudioShell() {
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* CMS Studio Header Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600 transition"
            aria-label="Toggle menu"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">Website Studio</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">V3</span>
              </div>
              <span className="text-xs text-slate-500 hidden sm:inline-block">Design, publish & grow storefront</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Active Storefront</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">V3 Staging</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Draft Mode</span>
          </div>

          <Link
            to="/dashboard"
            className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations</span>
          </Link>

          <button
            disabled
            title="Publish will be enabled when draft content exists"
            className="px-3.5 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 opacity-50 cursor-not-allowed transition shadow-xs"
          >
            Publish
          </button>
        </div>
      </header>

      {/* Shell Body Grid */}
      <div className="flex-1 flex min-h-[calc(100vh-4rem)] relative">
        {/* Mobile Navigation Backdrop */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Studio Sidebar (Desktop + Mobile Sheet) */}
        <aside
          className={cn(
            "fixed lg:static top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0",
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Studio Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/cms-v3"
                  ? location.pathname === "/cms-v3"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> V3 Isolated
              </span>
              <span>v3.0.0-dev</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
