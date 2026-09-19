"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSBadge } from "@/components/ui/ios-badge";
import { IOSButton } from "@/components/ui/ios-button";
import { Textarea } from "@/components/ui/textarea";
import { useCmsOverview, useCmsSettings, useCmsPages, useGenerateWebsiteAI } from "@/lib/use-cms-v2";
import { useMyStore } from "@/lib/use-my-store";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Globe, FileText, Image as ImageIcon, Megaphone, Navigation, MessageSquare,
  Clock, ExternalLink, Palette, LayoutGrid, ArrowRight, Sparkles,
  ShieldCheck, AlertTriangle, CheckCircle2, Calendar, Plus, RefreshCcw, Eye, Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CmsOverviewPage() {
  const { data: overview, isLoading } = useCmsOverview();
  const { data: settings } = useCmsSettings();
  const { data: pages = [] } = useCmsPages();
  const { data: myStore } = useMyStore();
  const [aiPrompt, setAiPrompt] = useState("");
  const generateMutation = useGenerateWebsiteAI();

  const storeSlug = myStore?.slug || "my-store";

  if (isLoading) {
    return (
      <div className="space-y-4 pb-10">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const stats = overview?.stats;

  // Most recent page for "Continue Editing" card
  const recentPage = pages.length > 0 ? pages[0] : null;

  // 16-Point Storefront Health Audit Checks
  const healthChecks = [
    {
      id: "logo",
      title: "Storefront Logo",
      passed: Boolean(settings?.logo_url),
      severity: "high",
      desc: "Upload a high-resolution logo to reinforce your brand header.",
      route: "/cms/brand",
    },
    {
      id: "favicon",
      title: "Browser Favicon",
      passed: Boolean(settings?.favicon_url),
      severity: "medium",
      desc: "Set a favicon icon so your store tab stands out in browser windows.",
      route: "/cms/brand",
    },
    {
      id: "hero_image",
      title: "Homepage Hero Banner",
      passed: Boolean(stats?.published_pages && stats.published_pages > 0),
      severity: "high",
      desc: "Ensure your main homepage hero features high-impact visuals and text.",
      route: "/cms/pages",
    },
    {
      id: "seo_title",
      title: "Storefront SEO Title",
      passed: Boolean(settings?.seo_title),
      severity: "high",
      desc: "Set a global SEO search title for Google and social sharing cards.",
      route: "/cms/seo",
    },
    {
      id: "seo_description",
      title: "Meta Description",
      passed: Boolean(settings?.seo_description),
      severity: "high",
      desc: "Add a meta description summarizing your culinary offerings and store location.",
      route: "/cms/seo",
    },
    {
      id: "nav_header",
      title: "Header Navigation Links",
      passed: Boolean(stats?.published_pages && stats.published_pages > 0),
      severity: "medium",
      desc: "Connect your published pages to the top header navigation menu.",
      route: "/cms/navigation",
    },
    {
      id: "menu_presentation",
      title: "Customer Menu Presentation",
      passed: true,
      severity: "medium",
      desc: "Choose category tabs, product card layout, and dietary badge options.",
      route: "/cms/menu-presentation",
    },
    {
      id: "table_reservations",
      title: "Table Booking System",
      passed: true,
      severity: "low",
      desc: "Enable online table reservations so guests can book party slots.",
      route: "/cms/appointments",
    },
  ];

  const passedHealthCount = healthChecks.filter((h) => h.passed).length;
  const healthScore = Math.round((passedHealthCount / healthChecks.length) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Workspace Banner */}
      <div className="glass-adaptive p-6 rounded-2xl border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              CMS Owner Workspace
            </h1>
            <IOSBadge variant={settings?.published_at ? "success" : "warning"} size="sm">
              {settings?.published_at ? "Published Live" : "Draft Modifications"}
            </IOSBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage your public website content, design templates, SEO, media library, and customer interactions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/shop/$slug`}
            params={{ slug: storeSlug }}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:opacity-90 transition-opacity"
          >
            <Globe className="h-3.5 w-3.5" /> View Live Site
          </Link>
          {recentPage && (
            <Link
              to="/cms/pages/$pageId/edit"
              params={{ pageId: recentPage.id }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border bg-background hover:bg-muted font-semibold text-xs text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-amber-500" /> Preview Working Draft
            </Link>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Published Pages" value={stats.published_pages} icon={<Globe className="h-4 w-4" />} color="text-emerald-500" />
          <StatCard label="Draft Pages" value={stats.draft_pages} icon={<FileText className="h-4 w-4" />} color="text-amber-500" />
          <StatCard label="Media Assets" value={stats.total_media} icon={<ImageIcon className="h-4 w-4" />} color="text-blue-500" />
          <StatCard label="Announcements" value={stats.total_announcements} icon={<Megaphone className="h-4 w-4" />} color="text-purple-500" />
        </div>
      )}

      {/* Quick Creation Bar */}
      <IOSCard className="p-4 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-primary" /> Quick Create Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link to="/cms/pages" className="p-3 rounded-xl border bg-background hover:bg-muted transition-colors text-left flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-semibold text-xs">New Page</span>
          </Link>
          <Link to="/cms/announcements" className="p-3 rounded-xl border bg-background hover:bg-muted transition-colors text-left flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-xs">Announcement</span>
          </Link>
          <Link to="/cms/media" className="p-3 rounded-xl border bg-background hover:bg-muted transition-colors text-left flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-xs">Upload Media</span>
          </Link>
          <Link to="/cms/appointments" className="p-3 rounded-xl border bg-background hover:bg-muted transition-colors text-left flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-xs">Table Booking</span>
          </Link>
        </div>
      </IOSCard>

      {/* Main Grid: Health Panel & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Storefront Health Panel & Continue Editing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Storefront Health Panel */}
          <IOSCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn("h-5 w-5", healthScore === 100 ? "text-emerald-500" : "text-amber-500")} />
                <h2 className="font-bold text-sm text-foreground">Storefront Health Audit</h2>
              </div>
              <IOSBadge variant={healthScore === 100 ? "success" : "warning"} size="sm">
                Score: {healthScore}% ({passedHealthCount}/{healthChecks.length} Passed)
              </IOSBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {healthChecks.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border bg-background flex items-start justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <p className="font-bold text-xs text-foreground truncate">{item.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{item.desc}</p>
                  </div>
                  <Link
                    to={item.route}
                    className="text-[11px] font-semibold text-primary hover:underline shrink-0 flex items-center gap-0.5"
                  >
                    Fix <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </IOSCard>

          {/* Continue Editing Card */}
          {recentPage && (
            <IOSCard className="p-5 flex items-center justify-between gap-4 border-primary/20 bg-primary/[0.02]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" /> Continue Editing
                </span>
                <h3 className="font-bold text-base text-foreground">{recentPage.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Last updated {new Date(recentPage.updated_at).toLocaleString()} ({recentPage.total_sections_count || 0} sections)
                </p>
              </div>

              <Link
                to="/cms/pages/$pageId/edit"
                params={{ pageId: recentPage.id }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 transition-opacity shrink-0"
              >
                Open Editor →
              </Link>
            </IOSCard>
          )}

          {/* AI Website Copilot */}
          <IOSCard className="p-5 space-y-3 border-violet-500/20 bg-violet-500/[0.02]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h3 className="font-bold text-sm text-foreground">CMS AI Website Copilot</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your vision to generate draft page layouts or update section copy. AI updates drafts only and requires owner confirmation to publish.
            </p>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe your ideal website, e.g. A warm artisanal bakery with sourdough highlights, table reservations, and customer reviews..."
              rows={2}
              className="text-xs"
            />
            <div className="flex items-center gap-2">
              <IOSButton
                variant="default"
                size="sm"
                onClick={() => {
                  if (!aiPrompt.trim()) return;
                  generateMutation.mutate({ prompt: aiPrompt.trim(), apply: true }, {
                    onSuccess: (data) => {
                      toast.success(`AI generated ${data.sections.length} draft sections.`);
                      setAiPrompt("");
                    },
                    onError: () => toast.error("AI generation failed."),
                  });
                }}
                disabled={generateMutation.isPending || !aiPrompt.trim()}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {generateMutation.isPending ? "Generating Draft..." : "Generate Homepage Draft"}
              </IOSButton>
            </div>
          </IOSCard>
        </div>

        {/* Right Column: CMS Navigation & Recent Activity Audit */}
        <div className="space-y-6">
          {/* Quick Navigation Cards */}
          <IOSCard className="p-4 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Studio Modules</h3>
            <div className="space-y-1.5">
              {[
                { label: "Pages Manager", route: "/cms/pages", icon: FileText, desc: "Edit pages & layouts" },
                { label: "Navigation Studio", route: "/cms/navigation", icon: Navigation, desc: "Header & footer links" },
                { label: "Themes & Brand", route: "/cms/brand", icon: Palette, desc: "Colors, fonts & templates" },
                { label: "Menu Presentation", route: "/cms/menu-presentation", icon: Utensils, desc: "Product grid & card design" },
                { label: "Table Reservations", route: "/cms/appointments", icon: Calendar, desc: "Booking schedules & guests" },
                { label: "Media Library", route: "/cms/media", icon: ImageIcon, desc: "Uploads & focal points" },
                { label: "Contact Inbox", route: "/cms/contact-messages", icon: MessageSquare, desc: "Customer form messages" },
                { label: "SEO & Sharing", route: "/cms/seo", icon: Globe, desc: "Search title & social metadata" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.route}
                    className="flex items-center justify-between p-2.5 rounded-xl border bg-background hover:bg-muted transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </IOSCard>

          {/* Recent Activity Logs */}
          {overview?.recent_activity && overview.recent_activity.length > 0 && (
            <IOSCard className="p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Recent Audit Trail
              </h3>
              <div className="space-y-2">
                {overview.recent_activity.slice(0, 6).map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl border bg-background text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-[11px]">{formatAction(log.action)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{new Date(log.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </IOSCard>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <IOSCard className="p-4 flex items-center gap-3">
      <div className={cn("p-2.5 rounded-xl bg-muted/50", color)}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </IOSCard>
  );
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    update_draft_settings: "Updated brand settings",
    publish_homepage: "Published homepage",
    rollback_homepage: "Rolled back homepage",
    upload_media: "Uploaded media",
    delete_media: "Deleted media",
    create_announcement: "Created announcement",
    publish_announcement: "Published announcement",
    delete_announcement: "Deleted announcement",
    create_page: "Created new page",
    update_page_metadata: "Updated page settings",
    publish_page: "Published page",
    unpublish_page: "Unpublished page",
    duplicate_page: "Duplicated page",
    delete_page: "Deleted page",
    restore_page_version: "Restored page version",
    ai_generate_website: "AI-generated homepage",
    ai_edit_page: "AI-edited page",
    ai_apply_plan: "Applied AI section plan",
  };
  return map[action] || action.replace(/_/g, " ");
}
