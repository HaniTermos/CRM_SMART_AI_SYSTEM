"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  useCmsSettings, useUpdateCmsSettings, usePublishCms, useRollbackCms,
  useCmsMedia, useCreateCmsMedia, useDeleteCmsMedia,
  useCmsAnnouncements, useCreateCmsAnnouncement, useUpdateCmsAnnouncement, useDeleteCmsAnnouncement,
  useCmsPages,
  useCmsActivity,
  useCmsThemes, useApplyCmsTheme,
  type HomepageContent
} from "@/lib/use-cms-v2";
import { ConfirmDialog } from "@/components/cms/confirm-dialog";
import {
  Palette, Image, Megaphone, FileText, Clock,
  Check, X, Upload, Trash2, Eye, Save, RotateCcw,
  Globe, Sun, Moon, ChevronDown, Plus, ExternalLink, ArrowRight
} from "lucide-react";

type CmsTab = "appearance" | "homepage" | "media" | "announcements" | "pages" | "activity";

const TABS: { id: CmsTab; label: string; icon: any }[] = [
  { id: "appearance", label: "Brand & Appearance", icon: Palette },
  { id: "homepage", label: "Homepage Content", icon: Globe },
  { id: "media", label: "Media Library", icon: Image },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "pages", label: "Static Pages", icon: FileText },
  { id: "activity", label: "Activity Log", icon: Clock },
];

export function CmsPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>("appearance");

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">CMS & Brand Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your storefront appearance, homepage, and content pages.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "homepage" && <HomepageTab />}
          {activeTab === "media" && <MediaTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "pages" && <PagesTab />}
          {activeTab === "activity" && <ActivityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AppearanceTab() {
  const { data: settings, isLoading } = useCmsSettings();
  const updateMutation = useUpdateCmsSettings();
  const publishMutation = usePublishCms();
  const rollbackMutation = useRollbackCms();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  type ConfirmDialogState = {
    open: boolean;
    title: string;
    description?: React.ReactNode;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  };
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const openConfirm = (config: Omit<ConfirmDialogState, "open">) => setConfirmDialog({ ...config, open: true });
  const closeConfirm = () => setConfirmDialog((c) => (c ? { ...c, open: false } : null));

  if (isLoading || !settings) {
    return <IOSCard className="p-6 animate-pulse"><div className="h-40 bg-muted rounded-xl" /></IOSCard>;
  }

  const get = (key: string) => localSettings[key] ?? (settings as any)[key] ?? "";
  const set = (key: string, value: string) => setLocalSettings((p) => ({ ...p, [key]: value }));
  const isDirty = Object.keys(localSettings).length > 0;

  const handleSave = () => {
    updateMutation.mutate(localSettings as any, { onSuccess: () => setLocalSettings({}) });
  };

  return (
    <IOSCard className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Brand & Appearance</h2>
          {settings.published_at && (
            <IOSBadge variant="success" size="sm">Published v{settings.version}</IOSBadge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <IOSButton variant="subtle" size="pill" onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
            </IOSButton>
          )}
          <IOSButton variant="default" size="pill" onClick={() => openConfirm({
            title: "Publish brand settings?",
            description: "This will make colors, fonts, logo, and homepage content live to customers.",
            confirmText: "Publish",
            onConfirm: () => publishMutation.mutate(undefined, { onSettled: closeConfirm }),
          })} disabled={publishMutation.isPending}>
            <Check className="h-3.5 w-3.5 mr-1" /> Publish
          </IOSButton>
          {settings.homepage_published && (
            <IOSButton variant="subtle" size="pill" onClick={() => openConfirm({
              title: "Rollback brand settings?",
              description: "This will revert to the previously published version. Current draft changes will be lost.",
              confirmText: "Rollback",
              variant: "destructive",
              onConfirm: () => rollbackMutation.mutate(undefined, { onSettled: closeConfirm }),
            })} disabled={rollbackMutation.isPending}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Rollback
            </IOSButton>
          )}
        </div>
      </div>

      <ThemeSelector />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Logo URL</Label>
          <Input value={get("logo_url")} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Favicon URL</Label>
          <Input value={get("favicon_url")} onChange={(e) => set("favicon_url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={get("primary_color") || "#190E85"} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-14 rounded cursor-pointer border-0" />
            <Input value={get("primary_color")} onChange={(e) => set("primary_color", e.target.value)} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Accent Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={get("accent_color") || "#00E0FF"} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-14 rounded cursor-pointer border-0" />
            <Input value={get("accent_color")} onChange={(e) => set("accent_color", e.target.value)} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Font Family</Label>
          <select value={get("font_family")} onChange={(e) => set("font_family", e.target.value)} className="w-full h-10 rounded-lg border bg-background px-3 text-sm">
            {["Inter", "Roboto", "Outfit", "Poppins", "DM Sans", "Plus Jakarta Sans"].map((f) => (<option key={f} value={f}>{f}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Button Style</Label>
          <select value={get("button_style")} onChange={(e) => set("button_style", e.target.value)} className="w-full h-10 rounded-lg border bg-background px-3 text-sm">
            {["rounded", "pill", "square"].map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Border Radius</Label>
          <Input value={get("border_radius")} onChange={(e) => set("border_radius", e.target.value)} placeholder="0.75rem" />
        </div>
        <div className="space-y-2">
          <Label>Theme Mode</Label>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <button key={mode} onClick={() => set("theme_mode", mode)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border transition-all", get("theme_mode") === mode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {mode === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
        <div className="space-y-2">
          <Label>SEO Title</Label>
          <Input value={get("seo_title")} onChange={(e) => set("seo_title", e.target.value)} placeholder="My Store - Best Food in Town" />
        </div>
        <div className="space-y-2">
          <Label>SEO Description</Label>
          <Input value={get("seo_description")} onChange={(e) => set("seo_description", e.target.value)} placeholder="Fresh meals, fast delivery..." />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Social Share Image URL</Label>
          <Input value={get("social_image_url")} onChange={(e) => set("social_image_url", e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDialog?.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={confirmDialog?.title || ""}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        variant={confirmDialog?.variant}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        isPending={publishMutation.isPending || rollbackMutation.isPending}
      />
    </IOSCard>
  );
}

function ThemeSelector() {
  const { data, isLoading } = useCmsThemes();
  const applyMutation = useApplyCmsTheme();

  if (isLoading || !data) {
    return <div className="h-24 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <Label>Theme Preset</Label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.themes.map((theme) => {
          const active = data.current_theme_id === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => applyMutation.mutate(theme.id)}
              disabled={applyMutation.isPending || active}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                active ? "ring-2 ring-primary bg-primary/5" : "bg-muted/40 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-4 rounded-full border" style={{ background: theme.colors.primary_color }} />
                <div className="h-4 w-4 rounded-full border" style={{ background: theme.colors.accent_color }} />
              </div>
              <div className="font-medium text-sm">{theme.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{theme.description}</div>
              {active && <Check className="h-3.5 w-3.5 text-primary mt-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HomepageTab() {
  const { data: settings, isLoading } = useCmsSettings();
  const updateMutation = useUpdateCmsSettings();
  const [draft, setDraft] = useState<Partial<HomepageContent>>({});

  if (isLoading || !settings) {
    return <IOSCard className="p-6 animate-pulse"><div className="h-60 bg-muted rounded-xl" /></IOSCard>;
  }

  const hp = settings.homepage_draft || {} as HomepageContent;
  const get = (key: keyof HomepageContent) => (draft[key] !== undefined ? draft[key] : hp[key]) as string;
  const set = (key: keyof HomepageContent, value: any) => setDraft((p) => ({ ...p, [key]: value }));
  const isDirty = Object.keys(draft).length > 0;

  const handleSave = () => {
    const merged = { ...hp, ...draft };
    updateMutation.mutate({ homepage_draft: merged } as any, { onSuccess: () => setDraft({}) });
  };

  return (
    <IOSCard className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Homepage Content Editor</h2>
          {isDirty && <IOSBadge variant="warning" size="sm">Unsaved Changes</IOSBadge>}
        </div>
        {isDirty && (
          <IOSButton variant="default" size="pill" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
          </IOSButton>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Hero Section</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Hero Title</Label><Input value={get("hero_title")} onChange={(e) => set("hero_title", e.target.value)} /></div>
          <div className="space-y-2"><Label>Hero Image URL</Label><Input value={get("hero_image")} onChange={(e) => set("hero_image", e.target.value)} placeholder="https://..." /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Hero Subtitle</Label><Textarea value={get("hero_subtitle")} onChange={(e) => set("hero_subtitle", e.target.value)} rows={2} /></div>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">CTA Buttons</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Primary CTA Text</Label><Input value={get("cta_primary_text")} onChange={(e) => set("cta_primary_text", e.target.value)} /></div>
          <div className="space-y-2"><Label>Primary CTA Link</Label><Input value={get("cta_primary_link")} onChange={(e) => set("cta_primary_link", e.target.value)} /></div>
          <div className="space-y-2"><Label>Secondary CTA Text</Label><Input value={get("cta_secondary_text")} onChange={(e) => set("cta_secondary_text", e.target.value)} /></div>
          <div className="space-y-2"><Label>Secondary CTA Link</Label><Input value={get("cta_secondary_link")} onChange={(e) => set("cta_secondary_link", e.target.value)} /></div>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">About Section</h3>
        <div className="grid sm:grid-cols-1 gap-4">
          <div className="space-y-2"><Label>About Title</Label><Input value={get("about_title")} onChange={(e) => set("about_title", e.target.value)} /></div>
          <div className="space-y-2"><Label>About Description</Label><Textarea value={get("about_description")} onChange={(e) => set("about_description", e.target.value)} rows={3} /></div>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contact Info</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Email</Label><Input value={get("contact_email")} onChange={(e) => set("contact_email", e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={get("contact_phone")} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={get("contact_address")} onChange={(e) => set("contact_address", e.target.value)} /></div>
        </div>
      </div>
    </IOSCard>
  );
}

function MediaTab() {
  const { data: media = [], isLoading } = useCmsMedia();
  const createMutation = useCreateCmsMedia();
  const deleteMutation = useDeleteCmsMedia();
  const [newUrl, setNewUrl] = useState("");

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    const filename = newUrl.split("/").pop() || "media-asset";
    createMutation.mutate({ filename, url: newUrl, alt_text: filename }, { onSuccess: () => setNewUrl("") });
  };

  return (
    <IOSCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Media Library</h2>
          <IOSBadge variant="secondary" size="sm">{media.length} assets</IOSBadge>
        </div>
      </div>

      <div className="flex gap-2">
        <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Paste image URL to add..." className="flex-1" />
        <IOSButton variant="default" size="pill" onClick={handleAdd} disabled={createMutation.isPending || !newUrl.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </IOSButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Image className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No media uploaded yet.</p>
          <p>Add images via URL to use in your storefront.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((item) => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden border bg-muted/30">
              <img src={item.url} alt={item.alt_text || item.filename} className="aspect-square object-cover w-full" loading="lazy" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2 text-[11px] text-muted-foreground truncate">{item.filename}</div>
            </div>
          ))}
        </div>
      )}
    </IOSCard>
  );
}

function AnnouncementsTab() {
  const { data: announcements = [], isLoading } = useCmsAnnouncements();
  const createMutation = useCreateCmsAnnouncement();
  const updateMutation = useUpdateCmsAnnouncement();
  const deleteMutation = useDeleteCmsAnnouncement();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", message: "", cta_text: "", cta_link: "" });

  const handleCreate = () => {
    createMutation.mutate(formData, { onSuccess: () => { setShowForm(false); setFormData({ title: "", message: "", cta_text: "", cta_link: "" }); } });
  };

  return (
    <IOSCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Announcements</h2>
        </div>
        <IOSButton variant="default" size="pill" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New
        </IOSButton>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
          <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} />
          <Textarea placeholder="Message" value={formData.message} onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="CTA Text (optional)" value={formData.cta_text} onChange={(e) => setFormData((p) => ({ ...p, cta_text: e.target.value }))} />
            <Input placeholder="CTA Link (optional)" value={formData.cta_link} onChange={(e) => setFormData((p) => ({ ...p, cta_link: e.target.value }))} />
          </div>
          <IOSButton variant="default" size="pill" onClick={handleCreate} disabled={!formData.title || !formData.message || createMutation.isPending}>
            Create Announcement
          </IOSButton>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{a.title}</span>
                  <IOSBadge variant={a.status === "published" ? "success" : "secondary"} size="sm">{a.status}</IOSBadge>
                  {!a.is_enabled && <IOSBadge variant="destructive" size="sm">Disabled</IOSBadge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {a.status === "draft" && (
                  <IOSButton variant="subtle" size="pill" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: a.id, status: "published" })}>
                    Publish
                  </IOSButton>
                )}
                <button onClick={() => deleteMutation.mutate(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </IOSCard>
  );
}

function PagesTab() {
  const { data: pages = [], isLoading } = useCmsPages();

  return (
    <IOSCard className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Static Pages</h2>
          <IOSBadge variant="secondary" size="sm">{pages.length} pages</IOSBadge>
        </div>
        <Link to="/cms/pages">
          <IOSButton variant="default" size="pill" className="h-8 text-xs">
            Open Page Manager <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </IOSButton>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No pages found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.slice(0, 6).map((page: any) => (
            <div key={page.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{page.title}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">/{page.slug}</span>
                  <IOSBadge variant={page.status === "published" ? "success" : "secondary"} size="sm">{page.status}</IOSBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </IOSCard>
  );
}

function ActivityTab() {
  const { data: logs = [], isLoading } = useCmsActivity();

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      update_draft_settings: "Updated draft settings",
      publish_homepage: "Published homepage",
      rollback_homepage: "Rolled back homepage",
      upload_media: "Uploaded media asset",
      delete_media: "Deleted media asset",
      create_announcement: "Created announcement",
      publish_announcement: "Published announcement",
      delete_announcement: "Deleted announcement",
      update_draft_page: "Updated page draft",
      publish_page: "Published static page",
      ai_generate_website: "AI-generated homepage",
      ai_edit_page: "AI-edited page",
      ai_apply_plan: "Applied AI section plan",
    };
    return map[action] || action;
  };

  return (
    <IOSCard className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-lg">CMS Activity History</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No CMS activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="font-medium truncate">{actionLabel(log.action)}</span>
                {log.user_name && <span className="text-xs text-muted-foreground">by {log.user_name}</span>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </IOSCard>
  );
}
