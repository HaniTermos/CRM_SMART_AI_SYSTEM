"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link, useBlocker } from "@tanstack/react-router";
import { SectionList } from "@/components/shop/section-renderer";
import {
  useCmsPage, useCmsPageSections, useUpdateCmsPage,
  useCreateCmsSection, useUpdateCmsSection, useDeleteCmsSection,
  useReorderCmsSections, useDuplicateCmsSection,
  usePublishCmsPage, useCmsPageVersions, useRestoreCmsPageVersion,
  useGeneratePreviewToken, useEditPageAI,
  SECTION_TYPE_LABELS, SECTION_TYPE_LIST,
  type CmsSectionRecord, type CmsSectionType
} from "@/lib/use-cms-v2";
import { useMyStore } from "@/lib/use-my-store";
import {
  ChevronLeft, Plus, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown,
  Save, Globe, Monitor, Tablet, Smartphone,
  GripVertical, X, Clock, Undo2, Settings2, Image as ImageIcon, Search, Star, Sparkles
} from "lucide-react";
import { MediaPickerModal } from "@/components/cms/media-picker-modal";
import { ConfirmDialog } from "@/components/cms/confirm-dialog";
import { EditorHeader } from "@/components/cms/editor-header";
import { PageMapOutline } from "@/components/cms/page-map-outline";
import { CompletenessChecker } from "@/components/cms/completeness-checker";
import { CmsSeoModal } from "@/components/cms/cms-seo-modal";
import { DraftCompareModal } from "@/components/cms/draft-compare-modal";
import { toast } from "sonner";

type ViewportSize = "desktop" | "tablet" | "mobile";
type InspectorTab = "content" | "layout" | "appearance" | "background";

const SECTION_CATEGORIES = [
  { id: "hero", label: "Hero & Promo", types: ["hero", "cta"] as CmsSectionType[] },
  { id: "content", label: "Content", types: ["about", "rich_text", "gallery", "testimonials"] as CmsSectionType[] },
  { id: "commerce", label: "Commerce & Reservations", types: ["featured_menu", "appointment"] as CmsSectionType[] },
  { id: "info", label: "Info & Contact", types: ["faq", "contact_form", "opening_hours", "map", "social_links"] as CmsSectionType[] },
  { id: "layout", label: "Layout", types: ["divider"] as CmsSectionType[] },
];

function SectionVisualPreview({ type }: { type: CmsSectionType }) {
  switch (type) {
    case "hero":
      return (
        <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-indigo-900/20 to-cyan-900/20 p-2.5 flex flex-col justify-center items-center text-center space-y-1 border border-indigo-500/20 shadow-inner">
          <div className="w-12 h-1 bg-cyan-400/80 rounded-full mb-0.5" />
          <div className="w-24 h-2.5 bg-foreground/90 rounded-md font-bold" />
          <div className="w-32 h-1.5 bg-muted-foreground/60 rounded" />
          <div className="flex gap-1 pt-1">
            <div className="w-10 h-3 bg-cyan-500 rounded-md" />
            <div className="w-8 h-3 border border-foreground/30 rounded-md" />
          </div>
        </div>
      );
    case "featured_menu":
      return (
        <div className="w-full aspect-video rounded-lg bg-muted/40 p-2 space-y-1.5 border">
          <div className="w-16 h-2 bg-foreground/80 rounded mx-auto" />
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded bg-background p-1 border space-y-1">
                <div className="w-full h-5 bg-primary/20 rounded" />
                <div className="w-full h-1 bg-foreground/70 rounded" />
                <div className="w-1/2 h-1 bg-emerald-500 rounded" />
              </div>
            ))}
          </div>
        </div>
      );
    case "appointment":
      return (
        <div className="w-full aspect-video rounded-lg bg-emerald-950/10 p-2 flex flex-col justify-between border border-emerald-500/20">
          <div className="w-20 h-2 bg-emerald-600 rounded mx-auto" />
          <div className="grid grid-cols-2 gap-1 my-1">
            <div className="h-2.5 bg-muted rounded" />
            <div className="h-2.5 bg-muted rounded" />
            <div className="h-2.5 bg-muted rounded" />
            <div className="h-2.5 bg-muted rounded" />
          </div>
          <div className="w-full h-3 bg-emerald-500 rounded text-[8px] text-center text-white font-bold flex items-center justify-center">Book</div>
        </div>
      );
    case "about":
      return (
        <div className="w-full aspect-video rounded-lg bg-muted/40 p-2 grid grid-cols-2 gap-1.5 items-center border">
          <div className="space-y-1">
            <div className="w-12 h-2 bg-foreground/80 rounded" />
            <div className="w-full h-1 bg-muted-foreground/60 rounded" />
            <div className="w-4/5 h-1 bg-muted-foreground/60 rounded" />
          </div>
          <div className="w-full h-full bg-primary/20 rounded-md border" />
        </div>
      );
    case "gallery":
      return (
        <div className="w-full aspect-video rounded-lg bg-muted/40 p-1.5 grid grid-cols-3 gap-1 border">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-full h-full bg-cyan-500/20 rounded border border-cyan-500/30" />
          ))}
        </div>
      );
    case "testimonials":
      return (
        <div className="w-full aspect-video rounded-lg bg-amber-950/10 p-2 flex flex-col justify-center space-y-1.5 border border-amber-500/20">
          <div className="flex justify-center gap-0.5 text-amber-400 text-[9px]">★★★★★</div>
          <div className="w-28 h-1.5 bg-foreground/80 rounded mx-auto" />
          <div className="w-16 h-1 bg-amber-500/80 rounded mx-auto" />
        </div>
      );
    case "faq":
      return (
        <div className="w-full aspect-video rounded-lg bg-muted/40 p-2 space-y-1 border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-1 rounded bg-background border text-[8px]">
              <div className="w-16 h-1 bg-foreground/80 rounded" />
              <span>↓</span>
            </div>
          ))}
        </div>
      );
    case "contact_form":
      return (
        <div className="w-full aspect-video rounded-lg bg-muted/40 p-1.5 grid grid-cols-2 gap-1 border">
          <div className="space-y-1">
            <div className="w-10 h-2 bg-foreground/80 rounded" />
            <div className="w-14 h-1 bg-muted-foreground/60 rounded" />
          </div>
          <div className="space-y-1 bg-background p-1 rounded border">
            <div className="h-1.5 bg-muted rounded" />
            <div className="h-1.5 bg-muted rounded" />
            <div className="h-2 bg-primary rounded" />
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full aspect-video rounded-lg bg-muted/40 p-2 flex flex-col items-center justify-center border space-y-1">
          <div className="w-14 h-2 bg-foreground/80 rounded" />
          <div className="w-20 h-1 bg-muted-foreground/60 rounded" />
        </div>
      );
  }
}

// ─── Add Section Modal ───
function AddSectionModal({
  onClose,
  onSelect,
  isPending,
}: {
  onClose: () => void;
  onSelect: (type: CmsSectionType) => void;
  isPending: boolean;
}) {
  const [search, setSearch] = useState("");

  const matchesSearch = (type: CmsSectionType) =>
    !search ||
    SECTION_TYPE_LABELS[type].toLowerCase().includes(search.toLowerCase()) ||
    getSectionDescription(type).toLowerCase().includes(search.toLowerCase());

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-background rounded-2xl border shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add Section</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search section types…"
            className="pl-9"
          />
        </div>

        <div className="space-y-6">
          {SECTION_CATEGORIES.map((cat) => {
            const types = cat.types.filter(matchesSearch);
            if (types.length === 0) return null;
            return (
              <div key={cat.id}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cat.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => onSelect(type)}
                      disabled={isPending}
                      className="group p-3 rounded-xl border text-left hover:bg-primary/5 hover:border-primary/40 transition-all hover:shadow-md disabled:opacity-50 space-y-2"
                    >
                      <SectionVisualPreview type={type} />
                      <div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{SECTION_TYPE_LABELS[type]}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{getSectionDescription(type)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {SECTION_CATEGORIES.every((cat) => cat.types.filter(matchesSearch).length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No section types match your search.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Helpers ───
function getDefaultContent(type: CmsSectionType): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    hero: { eyebrow: "Welcome", title: "Your Store Name", subtitle: "Fresh artisanal offerings crafted daily.", cta_primary_text: "Explore Menu", cta_primary_link: "#" },
    featured_menu: { title: "Featured Items", subtitle: "Our most loved creations", limit: 6, show_category_filter: true, design: "grid" },
    about: { title: "Our Story", description: "Share your unique story with customers.", image_url: "" },
    gallery: { title: "Gallery", images: [] },
    testimonials: { title: "What Customers Say", items: [] },
    faq: { title: "Frequently Asked Questions", items: [] },
    contact_form: { title: "Contact Us", phone: "", email: "", address: "" },
    appointment: { title: "Book a Table", subtitle: "Reserve your spot in advance.", button_text: "Confirm Reservation" },
    rich_text: { title: "Section Title", body: "Add your content here." },
    cta: { title: "Ready to Order?", subtitle: "Browse our menu and order online.", button_text: "Order Now", button_link: "#" },
    map: { title: "Find Us", address: "" },
    opening_hours: { title: "Opening Hours", hours: [] },
    social_links: { title: "Follow Us", links: [] },
    divider: {},
  };
  return defaults[type] || {};
}

function getSectionDescription(type: CmsSectionType): string {
  const desc: Record<string, string> = {
    hero: "Full-width banner with CTA buttons",
    featured_menu: "Show featured products from your menu",
    about: "Your story with image and text",
    gallery: "Photo grid showcasing your space",
    testimonials: "Customer reviews and ratings",
    faq: "Accordion Q&A section",
    contact_form: "Contact info and message form",
    appointment: "Table booking & event reservation form",
    map: "Location map and directions",
    opening_hours: "Weekly schedule display",
    rich_text: "Flexible text content block",
    cta: "Call-to-action promotional banner",
    social_links: "Social media profile links",
    divider: "Visual separator between sections",
  };
  return desc[type] || "";
}

export function CmsPageEditor({ pageId }: { pageId: string }) {
  const { data: pageData, isLoading: pageLoading } = useCmsPage(pageId);
  const { data: sections = [], isLoading: sectionsLoading } = useCmsPageSections(pageId);
  const updatePageMut = useUpdateCmsPage();
  const createSectionMut = useCreateCmsSection();
  const updateSectionMut = useUpdateCmsSection();
  const deleteSectionMut = useDeleteCmsSection();
  const reorderMut = useReorderCmsSections();
  const duplicateMut = useDuplicateCmsSection();
  const publishMut = usePublishCmsPage();
  const previewTokenMut = useGeneratePreviewToken();
  const { data: versions = [] } = useCmsPageVersions(pageId);
  const restoreVersionMut = useRestoreCmsPageVersion();
  const editPageAiMut = useEditPageAI();
  const { data: myStore } = useMyStore();

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [showAddSection, setShowAddSection] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [showVersions, setShowVersions] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [showDraftCompareModal, setShowDraftCompareModal] = useState(false);
  const [dirtySectionIds, setDirtySectionIds] = useState<Set<string>>(new Set());
  type ConfirmDialogState = {
    open: boolean;
    title: string;
    description?: React.ReactNode;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  };
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const hasDirty = dirtySectionIds.size > 0;

  const openConfirm = (config: Omit<ConfirmDialogState, "open">) => setConfirmDialog({ ...config, open: true });
  const closeConfirm = () => setConfirmDialog((c) => (c ? { ...c, open: false } : null));

  useBlocker({
    shouldBlockFn: () => {
      if (!hasDirty) return false;
      const shouldLeave = window.confirm("You have unsaved changes. Leave without saving?");
      return !shouldLeave;
    },
    enableBeforeUnload: hasDirty,
  });

  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const treeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const secId = entry.target.getAttribute("data-section-id");
            if (secId) {
              setSelectedSectionId(secId);
            }
          }
        }
      },
      { threshold: 0.35 }
    );

    Object.values(previewRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const viewportWidth = { desktop: "100%", tablet: "768px", mobile: "375px" }[viewport];

  if (pageLoading || sectionsLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading page editor...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Page not found.</p>
        <Link to="/cms/pages" className="text-primary text-sm underline mt-2 inline-block">Back to Pages</Link>
      </div>
    );
  }

  const handleAddSection = (type: CmsSectionType) => {
    createSectionMut.mutate({ pageId, type, content: getDefaultContent(type) }, {
      onSuccess: () => setShowAddSection(false),
    });
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const ids = sections.map((s) => s.id);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    reorderMut.mutate({ pageId, sectionIds: ids });
  };

  const handlePublish = () => {
    openConfirm({
      title: `Publish "${pageData.title}"?`,
      description: (
        <span>
          This will make <strong>{sections.length}</strong> section{sections.length === 1 ? "" : "s"} live to customers.
          {hasDirty && <span className="block mt-1 text-amber-600">Unsaved section changes will not be included.</span>}
        </span>
      ),
      confirmText: "Publish",
      onConfirm: () => {
        publishMut.mutate(pageId, { onSettled: closeConfirm });
      },
    });
  };

  const handleAIEdit = () => {
    const prompt = window.prompt("What would you like the AI to change about this page?");
    if (!prompt) return;
    editPageAiMut.mutate(
      { pageId, prompt, apply: true },
      {
        onSuccess: (data) => {
          toast?.success?.(`AI updated the page with ${data.sections.length} sections.`);
        },
        onError: () => {
          toast?.error?.("AI edit failed. Please try again.");
        },
      }
    );
  };

  const handlePreview = () => {
    const storeSlug = myStore?.slug;
    if (!storeSlug) {
      alert("Unable to determine store slug. Please save your store profile first.");
      return;
    }
    previewTokenMut.mutate(pageId, {
      onSuccess: (data) => {
        const pagePath = pageData.slug === "home" ? "" : `/pages/${pageData.slug}`;
        window.open(`/shop/${storeSlug}${pagePath}?preview_token=${data.token}`, "_blank");
      },
    });
  };

  const scrollToSection = (sectionId: string) => {
    const el = previewRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollTreeToSection = (sectionId: string) => {
    const el = treeRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };



  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden">
      {/* Editor Header Toolbar */}
      <EditorHeader
        pageTitle={pageData.title}
        pageSlug={pageData.slug}
        pageStatus={pageData.status}
        hasDirty={hasDirty}
        isSaving={false}
        viewport={viewport}
        onViewportChange={setViewport}
        onPreview={handlePreview}
        onSaveDraft={() => toast.success("Draft changes saved.")}
        onPublish={handlePublish}
        onAIEdit={handleAIEdit}
        onOpenSEO={() => setShowSeoModal(true)}
        onOpenVersions={() => setShowVersions(!showVersions)}
      />

      {/* Version History Drawer */}
      <AnimatePresence>
        {showVersions && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b">
            <div className="p-3 bg-muted/30 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold mb-2">Version History ({versions.length})</p>
              {versions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No versions yet. Publish to create the first version.</p>
              ) : (
                <div className="space-y-1">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/50">
                      <span>v{v.version} — {new Date(v.created_at).toLocaleString()}</span>
                      <button
                        onClick={() => {
                          openConfirm({
                            title: `Restore version ${v.version}?`,
                            description: "This will overwrite the current draft with the selected version. You can still roll back afterward.",
                            confirmText: "Restore",
                            variant: "destructive",
                            onConfirm: () => {
                              restoreVersionMut.mutate({ pageId, versionId: v.id }, { onSettled: closeConfirm });
                            },
                          });
                        }}
                        className="text-primary hover:underline"
                      >
                        <Undo2 className="h-3 w-3 inline mr-0.5" />Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Settings Drawer */}
      <AnimatePresence>
        {showPageSettings && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b">
            <PageSettingsPanel page={pageData} onUpdate={(updates) => updatePageMut.mutate({ id: pageId, ...updates })} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section Tree */}
        <div className="w-56 shrink-0 border-r overflow-y-auto bg-muted/20 hidden md:block">
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
              <button onClick={() => setShowAddSection(true)} className="p-1 rounded-lg hover:bg-muted text-primary" title="Add section">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {sections.map((s, i) => (
              <div
                key={s.id}
                ref={(el) => { treeRefs.current[s.id] = el; }}
                onClick={() => {
                  setSelectedSectionId(s.id);
                  setInspectorTab("content");
                  scrollToSection(s.id);
                }}
                className={cn(
                  "flex items-center gap-1.5 p-2 rounded-lg text-xs cursor-pointer transition-colors group",
                  selectedSectionId === s.id ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted",
                  !s.is_visible && "opacity-40"
                )}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 font-medium">{SECTION_TYPE_LABELS[s.type] || s.type}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleMoveSection(s.id, "up"); }} className="p-0.5 hover:text-primary" disabled={i === 0} title="Move up">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleMoveSection(s.id, "down"); }} className="p-0.5 hover:text-primary" disabled={i === sections.length - 1} title="Move down">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No sections yet.</p>
            )}
          </div>
        </div>

        {/* Center: Live Canvas Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/10 flex justify-center p-4">
          <div
            className="bg-background rounded-2xl shadow-xl overflow-hidden transition-all duration-300 border"
            style={{ width: viewportWidth, maxWidth: "100%" }}
          >
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-sm">This page has no sections</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Section" to start building.</p>
                <IOSButton variant="default" size="pill" className="mt-4" onClick={() => setShowAddSection(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Section
                </IOSButton>
              </div>
            ) : (
              <div>
                {sections.map((s) => (
                  <div
                    key={s.id}
                    ref={(el) => { previewRefs.current[s.id] = el; }}
                    data-section-id={s.id}
                    onClick={() => {
                      setSelectedSectionId(s.id);
                      setInspectorTab("content");
                      scrollTreeToSection(s.id);
                    }}
                    className={cn(
                      "relative cursor-pointer transition-all",
                      selectedSectionId === s.id && "ring-2 ring-primary/50 ring-offset-1"
                    )}
                  >
                    <SectionList sections={[s]} isEditor={true} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inspector Panel */}
        {selectedSection && (
          <div className="w-72 shrink-0 border-l overflow-y-auto bg-background hidden lg:block">
            <SectionInspector
              section={selectedSection}
              inspectorTab={inspectorTab}
              setInspectorTab={setInspectorTab}
              onUpdate={(updates) => updateSectionMut.mutate({ sectionId: selectedSection.id, ...updates })}
              onToggleVisibility={() => updateSectionMut.mutate({ sectionId: selectedSection.id, is_visible: !selectedSection.is_visible })}
              onDuplicate={() => duplicateMut.mutate({ sectionId: selectedSection.id, pageId })}
              onDelete={() => {
                openConfirm({
                  title: "Delete this section?",
                  description: `This will permanently remove the "${SECTION_TYPE_LABELS[selectedSection.type]}" section.`,
                  confirmText: "Delete",
                  variant: "destructive",
                  onConfirm: () => {
                    deleteSectionMut.mutate({ sectionId: selectedSection.id, pageId }, { onSettled: closeConfirm });
                    setSelectedSectionId(null);
                  },
                });
              }}
              onClose={() => setSelectedSectionId(null)}
              onDirtyChange={(id, dirty) => {
                setDirtySectionIds((prev) => {
                  const next = new Set(prev);
                  if (dirty) next.add(id); else next.delete(id);
                  return next;
                });
              }}
            />
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      <AnimatePresence>
        {showAddSection && (
          <AddSectionModal
            onClose={() => setShowAddSection(false)}
            onSelect={(type) => handleAddSection(type)}
            isPending={createSectionMut.isPending}
          />
        )}
      </AnimatePresence>

      {/* Floating Page Map Outline */}
      <PageMapOutline
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelectSection={(id) => {
          setSelectedSectionId(id);
          scrollToSection(id);
        }}
      />

      {/* SEO Modal */}
      <CmsSeoModal
        open={showSeoModal}
        onClose={() => setShowSeoModal(false)}
        pageId={pageId}
        initialSeoTitle={pageData.seo_title || ""}
        initialSeoDescription={pageData.seo_description || ""}
        initialSocialImage={pageData.social_image_url || ""}
        pageSlug={pageData.slug}
      />

      {/* Visual Draft Compare Modal */}
      <DraftCompareModal
        open={showDraftCompareModal}
        onClose={() => setShowDraftCompareModal(false)}
        pageTitle={pageData.title}
        draftSections={sections}
        pageStatus={pageData.status}
      />

      <ConfirmDialog
        open={!!confirmDialog?.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={confirmDialog?.title || ""}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        variant={confirmDialog?.variant}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        isPending={publishMut.isPending || restoreVersionMut.isPending || deleteSectionMut.isPending}
      />
    </div>
  );
}

// ─── Section Inspector ───
function SectionInspector({
  section,
  inspectorTab,
  setInspectorTab,
  onUpdate,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  onClose,
  onDirtyChange,
}: {
  section: CmsSectionRecord;
  inspectorTab: InspectorTab;
  setInspectorTab: (t: InspectorTab) => void;
  onUpdate: (u: Partial<CmsSectionRecord>) => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
  onDirtyChange?: (sectionId: string, dirty: boolean) => void;
}) {
  const [localContent, setLocalContent] = useState<Record<string, any>>({});
  const [localAppearance, setLocalAppearance] = useState<Record<string, any>>({});

  const content = { ...section.content, ...localContent };
  const appearance = { ...section.appearance, ...localAppearance };

  const hasDirty = Object.keys(localContent).length > 0 || Object.keys(localAppearance).length > 0;
  useEffect(() => {
    onDirtyChange?.(section.id, hasDirty);
  }, [section.id, hasDirty, onDirtyChange]);

  const saveContent = () => {
    if (Object.keys(localContent).length > 0) {
      onUpdate({ content: { ...section.content, ...localContent } } as any);
      setLocalContent({});
    }
    if (Object.keys(localAppearance).length > 0) {
      onUpdate({ appearance: { ...section.appearance, ...localAppearance } } as any);
      setLocalAppearance({});
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{SECTION_TYPE_LABELS[section.type]}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>

      {/* Section Actions */}
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={onToggleVisibility} className="p-1.5 rounded-lg hover:bg-muted text-xs flex items-center gap-1" title={section.is_visible ? "Hide" : "Show"}>
          {section.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
        <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-muted" title="Duplicate"><Copy className="h-3 w-3" /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 className="h-3 w-3" /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
        {(["content", "layout", "appearance", "background"] as InspectorTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setInspectorTab(tab)}
            className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium capitalize transition-colors", inspectorTab === tab ? "bg-background shadow-sm" : "hover:bg-muted-foreground/10")}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {inspectorTab === "content" && (
        <ContentEditor type={section.type} content={content} onChange={(k, v) => setLocalContent((p) => ({ ...p, [k]: v }))} />
      )}

      {/* Appearance Tab */}
      {inspectorTab === "appearance" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Background Color</Label>
            <div className="flex gap-2">
              <input type="color" value={appearance.background_color || "#ffffff"} onChange={(e) => setLocalAppearance((p) => ({ ...p, background_color: e.target.value }))} className="h-8 w-12 rounded cursor-pointer border-0" />
              <Input value={appearance.background_color || ""} onChange={(e) => setLocalAppearance((p) => ({ ...p, background_color: e.target.value }))} className="flex-1 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Text Color</Label>
            <div className="flex gap-2">
              <input type="color" value={appearance.text_color || "#0F172A"} onChange={(e) => setLocalAppearance((p) => ({ ...p, text_color: e.target.value }))} className="h-8 w-12 rounded cursor-pointer border-0" />
              <Input value={appearance.text_color || ""} onChange={(e) => setLocalAppearance((p) => ({ ...p, text_color: e.target.value }))} className="flex-1 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Accent Color</Label>
            <div className="flex gap-2">
              <input type="color" value={appearance.accent_color || "#190E85"} onChange={(e) => setLocalAppearance((p) => ({ ...p, accent_color: e.target.value }))} className="h-8 w-12 rounded cursor-pointer border-0" />
              <Input value={appearance.accent_color || ""} onChange={(e) => setLocalAppearance((p) => ({ ...p, accent_color: e.target.value }))} className="flex-1 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Border Radius</Label>
            <Input value={appearance.border_radius || "0.75rem"} onChange={(e) => setLocalAppearance((p) => ({ ...p, border_radius: e.target.value }))} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Background Tab */}
      {inspectorTab === "background" && (
        <BackgroundEditor section={section} onUpdate={onUpdate} />
      )}

      {/* Layout Tab */}
      {inspectorTab === "layout" && (
        <LayoutEditor section={section} onUpdate={onUpdate} />
      )}

      {/* Save Button */}
      {hasDirty && (
        <IOSButton variant="default" size="pill" className="w-full" onClick={saveContent}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
        </IOSButton>
      )}
    </div>
  );
}

// ─── Content Editor per Section Type ───
function ContentEditor({ type, content, onChange }: { type: string; content: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const [pickerTarget, setPickerTarget] = useState<{ key: string; label: string } | null>(null);

  const field = (key: string, label: string, multiline = false) => (
    <div className="space-y-1" key={key}>
      <Label className="text-xs">{label}</Label>
      {multiline ? (
        <Textarea value={content[key] || ""} onChange={(e) => onChange(key, e.target.value)} rows={3} className="text-xs" />
      ) : (
        <Input value={content[key] || ""} onChange={(e) => onChange(key, e.target.value)} className="h-8 text-xs" />
      )}
    </div>
  );

  const imageField = (key: string, label: string) => (
    <div className="space-y-1" key={key}>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={content[key] || ""}
          onChange={(e) => onChange(key, e.target.value)}
          className="h-8 text-xs flex-1"
          placeholder="https://..."
        />
        <button
          type="button"
          onClick={() => setPickerTarget({ key, label })}
          className="px-2 rounded-md border hover:bg-muted transition-colors"
          title="Pick from media library"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  const checkboxField = (key: string, label: string) => (
    <label key={key} className="flex items-center gap-2 text-xs">
      <input type="checkbox" checked={!!content[key]} onChange={(e) => onChange(key, e.target.checked)} className="rounded" />
      {label}
    </label>
  );

  const numberField = (key: string, label: string) => (
    <div className="space-y-1" key={key}>
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={content[key] ?? ""} onChange={(e) => onChange(key, parseInt(e.target.value) || 0)} className="h-8 text-xs" />
    </div>
  );

  const fields: Record<string, React.ReactNode[]> = {
    hero: [field("eyebrow", "Eyebrow"), field("title", "Title"), field("subtitle", "Subtitle", true), imageField("image_url", "Hero Image URL"), field("cta_primary_text", "Primary CTA Text"), field("cta_primary_link", "Primary CTA Link"), field("cta_secondary_text", "Secondary CTA Text"), field("cta_secondary_link", "Secondary CTA Link")],
    about: [field("title", "Title"), field("description", "Description", true), imageField("image_url", "Image URL")],
    featured_menu: [field("title", "Title"), field("subtitle", "Subtitle"), numberField("limit", "Max Items"), field("category_id", "Category ID (optional)"), checkboxField("show_category_filter", "Show category filter")],
    gallery: [field("title", "Title"), <GalleryImagesEditor key="images" content={content} onChange={onChange} />],
    testimonials: [field("title", "Title"), <TestimonialsEditor key="items" content={content} onChange={onChange} />],
    faq: [field("title", "Title"), <FaqItemsEditor key="items" content={content} onChange={onChange} />],
    contact_form: [field("title", "Title"), field("phone", "Phone"), field("email", "Email"), field("address", "Address"), field("opening_hours", "Opening Hours")],
    rich_text: [field("title", "Title"), field("body", "Body Content", true)],
    cta: [field("title", "Title"), field("subtitle", "Subtitle", true), field("button_text", "Button Text"), field("button_link", "Button Link")],
    map: [field("title", "Title"), field("address", "Address")],
    opening_hours: [field("title", "Title"), <OpeningHoursEditor key="hours" content={content} onChange={onChange} />],
    social_links: [field("title", "Title"), <SocialLinksEditor key="links" content={content} onChange={onChange} />],
    divider: [],
  };

  return (
    <>
      <div className="space-y-3">{fields[type] || [<p key="n" className="text-xs text-muted-foreground">No editable content for this section.</p>]}</div>
      <MediaPickerModal
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget?.label || "Select Image"}
        onSelect={(url) => {
          if (pickerTarget) {
            onChange(pickerTarget.key, url);
            setPickerTarget(null);
          }
        }}
      />
    </>
  );
}

function GalleryImagesEditor({ content, onChange }: { content: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const images: string[] = content.images || [];

  const addImage = (url: string) => {
    onChange("images", [...images, url]);
    setPickerOpen(false);
  };

  const removeImage = (idx: number) => {
    const next = [...images];
    next.splice(idx, 1);
    onChange("images", next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Gallery Images</Label>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setPickerOpen(true)}
          className="aspect-square rounded-lg border border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted transition-colors"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-[10px]">Add</span>
        </button>
      </div>
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addImage}
        title="Add Gallery Image"
      />
    </div>
  );
}

// ─── Structured Item Editors ───
function FaqItemsEditor({ content, onChange }: { content: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const items: { question: string; answer: string }[] = content.items || [];
  const update = (idx: number, key: string, value: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
    onChange("items", next);
  };
  const add = () => onChange("items", [...items, { question: "New question", answer: "Answer" }]);
  const remove = (idx: number) => onChange("items", items.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <Label className="text-xs">FAQ Items</Label>
      {items.map((item, i) => (
        <div key={i} className="space-y-1.5 p-2 rounded-lg border bg-muted/20">
          <div className="flex gap-1">
            <Input value={item.question} onChange={(e) => update(i, "question", e.target.value)} className="h-7 text-xs flex-1" placeholder="Question" />
            <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-500/10 text-red-500"><Trash2 className="h-3 w-3" /></button>
          </div>
          <Textarea value={item.answer} onChange={(e) => update(i, "answer", e.target.value)} rows={2} className="text-xs" placeholder="Answer" />
        </div>
      ))}
      <IOSButton variant="subtle" size="pill" className="w-full h-7 text-xs" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add FAQ</IOSButton>
    </div>
  );
}

function TestimonialsEditor({ content, onChange }: { content: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const items: { name: string; comment: string; rating: number }[] = content.items || [];
  const update = (idx: number, key: string, value: any) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
    onChange("items", next);
  };
  const add = () => onChange("items", [...items, { name: "Customer", comment: "Great experience!", rating: 5 }]);
  const remove = (idx: number) => onChange("items", items.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <Label className="text-xs">Testimonials</Label>
      {items.map((item, i) => (
        <div key={i} className="space-y-1.5 p-2 rounded-lg border bg-muted/20">
          <div className="flex gap-1">
            <Input value={item.name} onChange={(e) => update(i, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Name" />
            <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-500/10 text-red-500"><Trash2 className="h-3 w-3" /></button>
          </div>
          <Textarea value={item.comment} onChange={(e) => update(i, "comment", e.target.value)} rows={2} className="text-xs" placeholder="Comment" />
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => update(i, "rating", star)} className="p-0.5">
                <Star className={cn("h-3.5 w-3.5", star <= (item.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted")} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <IOSButton variant="subtle" size="pill" className="w-full h-7 text-xs" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add Testimonial</IOSButton>
    </div>
  );
}

function OpeningHoursEditor({ content, onChange }: { content: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const hours: { day: string; time: string }[] = content.hours || [];
  const update = (idx: number, key: string, value: string) => {
    const next = hours.map((h, i) => (i === idx ? { ...h, [key]: value } : h));
    onChange("hours", next);
  };
  const add = () => onChange("hours", [...hours, { day: "Mon", time: "9:00 AM - 5:00 PM" }]);
  const remove = (idx: number) => onChange("hours", hours.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <Label className="text-xs">Opening Hours</Label>
      {hours.map((h, i) => (
        <div key={i} className="flex gap-2">
          <Input value={h.day} onChange={(e) => update(i, "day", e.target.value)} className="h-7 text-xs flex-1" placeholder="Day" />
          <Input value={h.time} onChange={(e) => update(i, "time", e.target.value)} className="h-7 text-xs flex-[2]" placeholder="Hours" />
          <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-500/10 text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      ))}
      <IOSButton variant="subtle" size="pill" className="w-full h-7 text-xs" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add Hours</IOSButton>
    </div>
  );
}

function SocialLinksEditor({ content, onChange }: { content: Record<string, any>; onChange: (k: string, v: any) => void }) {
  const links: { label: string; url: string }[] = content.links || [];
  const update = (idx: number, key: string, value: string) => {
    const next = links.map((l, i) => (i === idx ? { ...l, [key]: value } : l));
    onChange("links", next);
  };
  const add = () => onChange("links", [...links, { label: "Instagram", url: "https://instagram.com" }]);
  const remove = (idx: number) => onChange("links", links.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <Label className="text-xs">Social Links</Label>
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <Input value={l.label} onChange={(e) => update(i, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder="Label" />
          <Input value={l.url} onChange={(e) => update(i, "url", e.target.value)} className="h-7 text-xs flex-[2]" placeholder="URL" />
          <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-500/10 text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      ))}
      <IOSButton variant="subtle" size="pill" className="w-full h-7 text-xs" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add Link</IOSButton>
    </div>
  );
}

// ─── Background Editor ───
function BackgroundEditor({ section, onUpdate }: { section: CmsSectionRecord; onUpdate: (u: any) => void }) {
  const bg = section.background || {};
  const update = (key: string, val: any) => onUpdate({ background: { ...bg, [key]: val } });
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Background Type</Label>
        <select value={bg.type || "solid"} onChange={(e) => update("type", e.target.value)} className="w-full h-8 rounded-lg border bg-background px-2 text-xs">
          {["solid", "gradient", "image"].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
      {bg.type === "image" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Image URL</Label>
            <div className="flex gap-2">
              <Input value={bg.image_url || ""} onChange={(e) => update("image_url", e.target.value)} className="h-8 text-xs flex-1" placeholder="https://..." />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-2 rounded-md border hover:bg-muted transition-colors"
                title="Pick from media library"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Overlay Opacity (%)</Label>
            <Input type="number" min={0} max={100} value={bg.overlay_opacity || 0} onChange={(e) => update("overlay_opacity", parseInt(e.target.value))} className="h-8 text-xs" />
          </div>
        </>
      )}
      {bg.type === "gradient" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">From Color</Label>
            <Input value={bg.gradient_from || "#190E85"} onChange={(e) => update("gradient_from", e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To Color</Label>
            <Input value={bg.gradient_to || "#00E0FF"} onChange={(e) => update("gradient_to", e.target.value)} className="h-8 text-xs" />
          </div>
        </>
      )}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => update("image_url", url)}
        title="Select Background Image"
      />
    </div>
  );
}

// ─── Layout Editor ───
function LayoutEditor({ section, onUpdate }: { section: CmsSectionRecord; onUpdate: (u: any) => void }) {
  const layout = section.layout || {};
  const update = (key: string, val: any) => onUpdate({ layout: { ...layout, [key]: val } });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Width</Label>
        <select value={layout.width || "contained"} onChange={(e) => update("width", e.target.value)} className="w-full h-8 rounded-lg border bg-background px-2 text-xs">
          <option value="contained">Contained (max-w-6xl)</option>
          <option value="full">Full Width</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Padding Top</Label>
        <select value={layout.padding_top || "medium"} onChange={(e) => update("padding_top", e.target.value)} className="w-full h-8 rounded-lg border bg-background px-2 text-xs">
          {["none", "small", "medium", "large"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Padding Bottom</Label>
        <select value={layout.padding_bottom || "medium"} onChange={(e) => update("padding_bottom", e.target.value)} className="w-full h-8 rounded-lg border bg-background px-2 text-xs">
          {["none", "small", "medium", "large"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Page Settings Panel ───
function PageSettingsPanel({ page, onUpdate }: { page: any; onUpdate: (u: any) => void }) {
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [seoTitle, setSeoTitle] = useState(page.seo_title || "");
  const [seoDesc, setSeoDesc] = useState(page.seo_description || "");
  const [socialImageUrl, setSocialImageUrl] = useState(page.social_image_url || "");
  const [showNav, setShowNav] = useState(page.show_in_navigation);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isSystem = page.is_system_page;
  const isSlugValid = (s: string) => /^[a-z0-9-]+$/.test(s) && s.length > 0;

  const handleSave = () => {
    if (!isSystem && !isSlugValid(slug)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
      return;
    }
    setSlugError(null);
    const payload: any = { title, seo_title: seoTitle, seo_description: seoDesc, social_image_url: socialImageUrl, show_in_navigation: showNav };
    if (!isSystem) payload.slug = slug;
    onUpdate(payload);
  };

  const previewUrl = typeof window !== "undefined" ? `${window.location.origin}/shop/${slug === "home" ? "" : `pages/${slug}`}` : "";

  return (
    <div className="p-3 bg-muted/30 space-y-3">
      <p className="text-xs font-semibold">Page Settings</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" /></div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugError(null); }} disabled={isSystem} className="h-8 text-xs" />
          {slugError && <p className="text-[11px] text-red-500">{slugError}</p>}
          {isSystem && <p className="text-[11px] text-muted-foreground">System page slug cannot be changed.</p>}
        </div>
        <div className="space-y-1"><Label className="text-xs">SEO Title</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="h-8 text-xs" /></div>
        <div className="space-y-1"><Label className="text-xs">SEO Description</Label><Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} className="text-xs" /></div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Social Share Image</Label>
          <div className="flex gap-2">
            <Input value={socialImageUrl} onChange={(e) => setSocialImageUrl(e.target.value)} className="h-8 text-xs flex-1" placeholder="https://..." />
            <button onClick={() => setPickerOpen(true)} className="px-2 rounded-md border hover:bg-muted transition-colors" title="Pick from media library">
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-background p-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Search Preview</p>
        <p className="text-sm text-blue-600 truncate">{seoTitle || title}</p>
        <p className="text-[11px] text-green-600 truncate">{previewUrl}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{seoDesc || "No description provided."}</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={showNav} onChange={(e) => setShowNav(e.target.checked)} className="rounded" />
          Show in navigation
        </label>
        <IOSButton variant="default" size="pill" className="h-7 text-xs" onClick={handleSave}>
          <Save className="h-3 w-3 mr-1" /> Save
        </IOSButton>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Social Image"
        onSelect={(url) => { setSocialImageUrl(url); setPickerOpen(false); }}
      />
    </div>
  );
}
