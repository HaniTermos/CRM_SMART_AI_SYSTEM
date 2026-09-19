"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { useMyStore } from "@/lib/use-my-store";
import { useNavLayout } from "@/lib/nav-layout-context";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/lib/use-notifications";
import {
  ExternalLink, Zap, QrCode, Sun, Moon, Bell,
  User as UserIcon, Settings, LogOut, LayoutGrid, PanelLeft, ChevronDown, Menu,
  Check, CheckCheck, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function TopNavbar({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { isDark, toggleDark } = useTheme();
  const { user, logout } = useAuth();
  const { data: store } = useMyStore();
  const { navMode, toggleNavMode } = useNavLayout();
  const navigate = useNavigate();

  const storeSlug = store?.slug ?? "";
  const shopUrl = storeSlug
    ? `${window.location.origin}/shop/${storeSlug}`
    : "#";

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Mobile menu + Brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#190E85] via-[#2D1B9E] to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold shadow-md">
                S
              </div>
              <span className="font-bold text-sm hidden sm:block tracking-tight text-foreground">
                SmartStore <span className="text-[#00E0FF] font-mono text-xs">AI</span>
              </span>
            </Link>
          </div>

          {/* Center: Quick Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            {storeSlug && (
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                  "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View Shop</span>
              </a>
            )}
            <button
              onClick={() => navigate({ to: "/orders" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick Order</span>
            </button>
            <button
              onClick={() => navigate({ to: "/qr-manager" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">QR Codes</span>
            </button>
          </div>

          {/* Right: Notifications, Theme & User Menu */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleNavMode}
              title={`Switch layout (Current: ${navMode})`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40"
            >
              {navMode === "dock" ? <PanelLeft className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
              <span className="capitalize">{navMode}</span>
            </button>

            <NotificationDropdown />

            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 p-1 rounded-full hover:bg-muted/80 transition-colors outline-none focus:ring-2 focus:ring-primary/20 ml-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {userInitial}
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user?.name || "Store Owner"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                    {user?.role && (
                      <span className="mt-1 inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                        {user.role}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })} className="cursor-pointer gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Profile & Settings</span>
                </DropdownMenuItem>

                {storeSlug && (
                  <DropdownMenuItem
                    onClick={() => window.open(shopUrl, "_blank", "noopener,noreferrer")}
                    className="cursor-pointer gap-2"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span>View Shop</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={toggleNavMode} className="cursor-pointer gap-2">
                  {navMode === "dock" ? (
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Layout: {navMode === "dock" ? "Sidebar Mode" : "Bottom Dock Mode"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-500/10">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function NotificationDropdown() {
  const { data: notifications = [], isLoading } = useNotifications({ limit: 20 });
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const navigate = useNavigate();

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "success": return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case "warning": return <div className="w-2 h-2 rounded-full bg-amber-500" />;
      case "error": return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                    !n.is_read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id);
                    if (n.link) navigate({ to: n.link as any });
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1">{severityIcon(n.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium", !n.is_read && "text-foreground")}>{n.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead.mutate(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
