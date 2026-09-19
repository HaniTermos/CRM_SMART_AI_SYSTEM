import React from "react";
import {
  Eye,
  CheckCircle2,
  ChefHat,
  Package,
  UserCheck,
  X,
  Printer,
  MessageCircle,
  Armchair,
  Ban,
  Edit3,
  Phone,
  User,
  Target,
  Send,
  Tag,
  ShieldBan,
  Copy,
  Archive,
  Plus,
  Minus,
  ExternalLink,
  PackagePlus,
  SlidersHorizontal,
  Link,
  AlertTriangle,
  ArrowRight,
  Trophy,
  ThumbsDown,
  StickyNote,
  Calendar,
  FileText,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickActionType =
  | "view"
  | "confirm"
  | "start_prep"
  | "ready"
  | "served"
  | "cancel"
  | "print"
  | "message"
  | "seat"
  | "no_show"
  | "edit"
  | "call"
  | "profile"
  | "new_deal"
  | "campaign"
  | "discount"
  | "block"
  | "duplicate"
  | "archive"
  | "stock_plus"
  | "stock_minus"
  | "view_store"
  | "restock"
  | "adjust"
  | "link"
  | "low_stock_alert"
  | "move_stage"
  | "win"
  | "lost"
  | "add_note"
  | "schedule_task"
  | "send_quote";

export interface ActionItem {
  id: string;
  label: string;
  type: QuickActionType;
  onClick: () => void;
  disabled?: boolean;
}

const ACTION_CONFIG: Record<
  QuickActionType,
  { icon: LucideIcon; className: string }
> = {
  view: { icon: Eye, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  confirm: { icon: CheckCircle2, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  start_prep: { icon: ChefHat, className: "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20" },
  ready: { icon: Package, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  served: { icon: UserCheck, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  cancel: { icon: X, className: "text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20" },
  print: { icon: Printer, className: "text-slate-600 dark:text-slate-300 hover:bg-slate-500/10" },
  message: { icon: MessageCircle, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  seat: { icon: Armchair, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  no_show: { icon: Ban, className: "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20" },
  edit: { icon: Edit3, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  call: { icon: Phone, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  profile: { icon: User, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  new_deal: { icon: Target, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  campaign: { icon: Send, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  discount: { icon: Tag, className: "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20" },
  block: { icon: ShieldBan, className: "text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20" },
  duplicate: { icon: Copy, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  archive: { icon: Archive, className: "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20" },
  stock_plus: { icon: Plus, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  stock_minus: { icon: Minus, className: "text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20" },
  view_store: { icon: ExternalLink, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  restock: { icon: PackagePlus, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  adjust: { icon: SlidersHorizontal, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  link: { icon: Link, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  low_stock_alert: { icon: AlertTriangle, className: "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20" },
  move_stage: { icon: ArrowRight, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  win: { icon: Trophy, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  lost: { icon: ThumbsDown, className: "text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20" },
  add_note: { icon: StickyNote, className: "text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20" },
  schedule_task: { icon: Calendar, className: "text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  send_quote: { icon: FileText, className: "text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20" }
};

interface QuickActionsProps {
  actions: ActionItem[];
  className?: string;
  size?: "sm" | "md";
}

export function QuickActions({ actions, className, size = "md" }: QuickActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100", className)}>
      {actions.map((action) => {
        const config = ACTION_CONFIG[action.type] || { icon: Eye, className: "text-slate-500" };
        const IconComponent = config.icon;

        return (
          <button
            key={action.id || action.label}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            disabled={action.disabled}
            title={action.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
              size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-xs",
              config.className
            )}
          >
            <IconComponent className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
