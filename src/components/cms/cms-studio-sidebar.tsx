"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useMyStore } from "@/lib/use-my-store";
import {
  LayoutDashboard,
  FileText,
  Navigation,
  Megaphone,
  Palette,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  Search,
  History,
  Store,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  UtensilsCrossed,
  Layers,
  Globe
} from "lucide-react";

type SidebarGroup = {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
};

export function CmsStudioSidebar({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation();
  const { data: store } = useMyStore();
  const storeSlug = store?.slug || "my-store";

  const groups: SidebarGroup[] = [
    {
      title: "CMS V3 Studio",
      items: [
        { label: "V3 Dashboard", href: "/cms-v3", icon: LayoutDashboard },
        { label: "AI Onboarding & Copilot", href: "/cms-v3/website/ai", icon: Sparkles, badge: "AI" },
      ],
    },
    {
      title: "Website Builder",
      items: [
        { label: "Pages & Templates", href: "/cms-v3/website/pages", icon: FileText },
        { label: "Visual Navigation", href: "/cms-v3/website/navigation", icon: Navigation },
        { label: "Global Themes & Styling", href: "/cms-v3/website/theme", icon: Palette },
        { label: "CMS Settings & Flags", href: "/cms-v3/website/settings", icon: Globe },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-background/95 backdrop-blur-md border-r select-none z-30",
        mobile ? "w-full" : "w-64 fixed left-0 top-16 bottom-0"
      )}
    >
      {/* CMS Header Banner */}
      <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight text-foreground">CMS Studio</h2>
            <p className="text-[11px] text-muted-foreground font-medium">Design & Content Engine</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Pro
        </span>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/cms"
                    ? location.pathname === "/cms" || location.pathname === "/cms/"
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase tracking-wider",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Store Actions */}
      <div className="p-3 border-t bg-muted/20 space-y-2">
        <Link
          to={`/shop/$slug`}
          params={{ slug: storeSlug }}
          target="_blank"
          className="flex items-center justify-between p-2.5 rounded-xl border bg-background hover:bg-muted text-xs font-medium transition-colors"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            <span className="truncate max-w-[130px]">View Live Site</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>

        <Link
          to="/dashboard"
          className="flex items-center gap-2 p-2.5 rounded-xl border border-transparent text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Operations</span>
        </Link>
      </div>
    </aside>
  );
}
