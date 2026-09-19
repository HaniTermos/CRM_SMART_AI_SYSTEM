import {
  Home, UtensilsCrossed, ShoppingCart, Users, ArrowLeftRight,
  Target, Star, BarChart3, Settings, Calendar, LayoutGrid,
  ChefHat, Package, UserCog, Gift, QrCode, Sparkles, Compass, Tag, Layers,
  Palette
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  route: string;
  badge?: string;
  showInSidebar?: boolean;
  showInDock?: boolean;
  dockLabel?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

// Single source of truth for dashboard navigation.
// Sidebar groups and bottom dock are derived from this registry.
export const DASHBOARD_NAVIGATION: NavItem[] = [
  { id: "dashboard", icon: Home, label: "Dashboard", route: "/dashboard", showInSidebar: true, showInDock: true },
  { id: "orders", icon: ShoppingCart, label: "Orders", route: "/orders", showInSidebar: true, showInDock: true },
  { id: "menu", icon: UtensilsCrossed, label: "Menu", route: "/menu", showInSidebar: true, showInDock: true },
  { id: "reservations", icon: Calendar, label: "Reservations", route: "/reservations", showInSidebar: true, showInDock: true, dockLabel: "Book" },
  { id: "reports", icon: BarChart3, label: "Reports", route: "/reports", showInSidebar: true, showInDock: true },
  { id: "ai-insights", icon: Sparkles, label: "AI Insights", route: "/ai-insights", showInSidebar: true, showInDock: true, dockLabel: "AI" },

  // Sidebar-only / More menu
  { id: "categories", icon: Layers, label: "Categories", route: "/categories", showInSidebar: true, showInDock: false },
  { id: "inventory", icon: Package, label: "Inventory", route: "/inventory", showInSidebar: true, showInDock: true, dockLabel: "Stock" },
  { id: "kitchen", icon: ChefHat, label: "Kitchen", route: "/kitchen", showInSidebar: true, showInDock: true },
  { id: "floor", icon: LayoutGrid, label: "Floor Plan", route: "/floor", showInSidebar: true, showInDock: false },
  { id: "customers", icon: Users, label: "Guests", route: "/customers", showInSidebar: true, showInDock: true },
  { id: "crm", icon: ArrowLeftRight, label: "CRM Pipeline", route: "/crm", showInSidebar: true, showInDock: true },
  { id: "loyalty", icon: Gift, label: "Loyalty", route: "/loyalty", showInSidebar: true, showInDock: false },
  { id: "campaigns", icon: Compass, label: "Campaigns", route: "/campaigns", showInSidebar: true, showInDock: false },
  { id: "discounts", icon: Tag, label: "Discounts", route: "/discounts", showInSidebar: true, showInDock: false },
  { id: "reviews", icon: Star, label: "Reviews", route: "/reviews", showInSidebar: true, showInDock: false },
  { id: "qr-manager", icon: QrCode, label: "QR Manager", route: "/qr-manager", showInSidebar: true, showInDock: true, dockLabel: "QR" },
  { id: "demand", icon: Target, label: "Demand Scoring", route: "/demand", showInSidebar: true, showInDock: false },
  { id: "staff", icon: UserCog, label: "Staff", route: "/staff", showInSidebar: true, showInDock: false },
  { id: "cms", icon: Palette, label: "CMS Studio V3", route: "/cms-v3", showInSidebar: true, showInDock: true },
  { id: "settings", icon: Settings, label: "Settings", route: "/settings", showInSidebar: true, showInDock: true, dockLabel: "More" },
];

// Sidebar grouped view
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: DASHBOARD_NAVIGATION.filter((i) =>
      ["dashboard", "orders", "menu", "categories", "inventory", "kitchen", "floor", "reservations", "staff"].includes(i.id)
    ),
  },
  {
    title: "CRM & Marketing",
    items: DASHBOARD_NAVIGATION.filter((i) =>
      ["customers", "crm", "loyalty", "campaigns", "discounts", "reviews", "qr-manager"].includes(i.id)
    ),
  },
  {
    title: "Analytics & AI",
    items: DASHBOARD_NAVIGATION.filter((i) =>
      ["reports", "demand", "ai-insights"].includes(i.id)
    ),
  },
  {
    title: "Storefront",
    items: DASHBOARD_NAVIGATION.filter((i) => i.id === "cms"),
  },
  {
    title: "Settings",
    items: DASHBOARD_NAVIGATION.filter((i) => i.id === "settings"),
  },
];

// Bottom dock primary items (visible in dock bar)
export const DOCK_ITEMS: NavItem[] = DASHBOARD_NAVIGATION.filter((i) => i.showInDock);

// More menu items shown inside the dock's last item
export const DOCK_MORE_ITEMS: NavItem[] = DASHBOARD_NAVIGATION.filter(
  (i) => i.showInSidebar && !i.showInDock
);
