"use client";

import { Link } from "@tanstack/react-router";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Save,
  Globe,
  RotateCcw,
  RotateCw,
  Sparkles,
  MoreVertical,
  Search,
  History,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewportSize = "desktop" | "tablet" | "mobile";

interface EditorHeaderProps {
  pageTitle: string;
  pageSlug: string;
  pageStatus: string;
  hasDirty: boolean;
  isSaving: boolean;
  viewport: ViewportSize;
  onViewportChange: (vp: ViewportSize) => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onAIEdit: () => void;
  onOpenSEO: () => void;
  onOpenVersions: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function EditorHeader({
  pageTitle,
  pageSlug,
  pageStatus,
  hasDirty,
  isSaving,
  viewport,
  onViewportChange,
  onPreview,
  onSaveDraft,
  onPublish,
  onAIEdit,
  onOpenSEO,
  onOpenVersions,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: EditorHeaderProps) {
  return (
    <header className="h-14 bg-background/95 backdrop-blur-md border-b px-4 flex items-center justify-between z-50 select-none">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/cms/pages"
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Pages</span>
        </Link>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm text-foreground truncate max-w-[180px] sm:max-w-xs">{pageTitle}</h1>
          <span className="text-[11px] text-muted-foreground font-mono hidden md:inline">/{pageSlug}</span>
          <IOSBadge variant={pageStatus === "published" ? "success" : "warning"} size="sm">
            {pageStatus}
          </IOSBadge>
        </div>

        {/* Autosave Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1 text-primary animate-pulse">
              <Save className="h-3 w-3" /> Saving...
            </span>
          ) : hasDirty ? (
            <span className="flex items-center gap-1 text-amber-500">
              <AlertCircle className="h-3 w-3" /> Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3 w-3" /> All changes saved
            </span>
          )}
        </div>
      </div>

      {/* Center: Viewport Switcher & Undo/Redo */}
      <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border">
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="h-3 w-px bg-border my-auto" />
        <button
          onClick={() => onViewportChange("desktop")}
          className={cn("p-1.5 rounded-lg transition-colors", viewport === "desktop" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          title="Desktop view"
        >
          <Monitor className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onViewportChange("tablet")}
          className={cn("p-1.5 rounded-lg transition-colors", viewport === "tablet" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          title="Tablet view"
        >
          <Tablet className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onViewportChange("mobile")}
          className={cn("p-1.5 rounded-lg transition-colors", viewport === "mobile" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          title="Mobile view"
        >
          <Smartphone className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <IOSButton variant="subtle" size="sm" onClick={onAIEdit} className="hidden sm:flex text-xs">
          <Sparkles className="h-3.5 w-3.5 text-violet-500 mr-1" /> AI Assist
        </IOSButton>

        <IOSButton variant="subtle" size="sm" onClick={onPreview} className="text-xs">
          <Eye className="h-3.5 w-3.5 mr-1" /> Preview
        </IOSButton>

        <IOSButton variant="default" size="sm" onClick={onPublish} className="text-xs">
          <Globe className="h-3.5 w-3.5 mr-1" /> Publish
        </IOSButton>

        {/* Tools Menu */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={onOpenSEO}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="SEO & Metadata"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenVersions}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Version History"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
