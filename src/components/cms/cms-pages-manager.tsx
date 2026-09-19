"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  useCmsPages, useCreateCmsPage, useDeleteCmsPage,
  usePublishCmsPage, useUnpublishCmsPage, useDuplicateCmsPage,
  type CmsPageRecord
} from "@/lib/use-cms-v2";
import {
  FileText, Plus, Globe, Eye, Copy, Trash2, Edit3, MoreHorizontal,
  ChevronLeft, Check, X, Lock, LayoutGrid, Search, ExternalLink
} from "lucide-react";

export function CmsPagesManager() {
  const { data: pages = [], isLoading } = useCmsPages();
  const createMut = useCreateCmsPage();
  const deleteMut = useDeleteCmsPage();
  const publishMut = usePublishCmsPage();
  const unpublishMut = useUnpublishCmsPage();
  const dupMut = useDuplicateCmsPage();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = pages.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const systemPages = filtered.filter((p) => p.is_system_page);
  const customPages = filtered.filter((p) => !p.is_system_page);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const slug = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    createMut.mutate(
      { title: newTitle, slug, type: "custom", show_in_navigation: true },
      {
        onSuccess: (page) => {
          setShowCreate(false);
          setNewTitle("");
          setNewSlug("");
          navigate({ to: "/cms/pages/$pageId/edit", params: { pageId: page.id } });
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/cms" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Pages
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{pages.length} pages total</p>
          </div>
        </div>
        <IOSButton variant="default" size="pill" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Page
        </IOSButton>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..." className="pl-9" />
      </div>

      {/* Create Page Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <IOSCard className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">Create New Page</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Page Title</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Catering Services" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL Slug</Label>
                  <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="Auto-generated from title" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IOSButton variant="default" size="pill" onClick={handleCreate} disabled={!newTitle.trim() || createMut.isPending}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Create
                </IOSButton>
                <IOSButton variant="subtle" size="pill" onClick={() => setShowCreate(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </IOSButton>
              </div>
              {createMut.isError && (
                <p className="text-xs text-red-500">{(createMut.error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create page"}</p>
              )}
            </IOSCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* System Pages */}
      {systemPages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">System Pages</h3>
          {systemPages.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              onPublish={() => publishMut.mutate(page.id)}
              onUnpublish={() => unpublishMut.mutate(page.id)}
              onDuplicate={() => dupMut.mutate(page.id)}
              onDelete={null}
            />
          ))}
        </div>
      )}

      {/* Custom Pages */}
      {customPages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Custom Pages</h3>
          {customPages.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              onPublish={() => publishMut.mutate(page.id)}
              onUnpublish={() => unpublishMut.mutate(page.id)}
              onDuplicate={() => dupMut.mutate(page.id)}
              onDelete={() => {
                if (confirm(`Delete "${page.title}"? This cannot be undone.`)) deleteMut.mutate(page.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <IOSCard className="p-10 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold text-sm">No pages found</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first page to get started.</p>
        </IOSCard>
      )}
    </div>
  );
}

function PageRow({
  page,
  menuOpen,
  setMenuOpen,
  onPublish,
  onUnpublish,
  onDuplicate,
  onDelete,
}: {
  page: CmsPageRecord;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDuplicate: () => void;
  onDelete: (() => void) | null;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border gap-3 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {page.is_system_page ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{page.title}</span>
            <IOSBadge variant={page.status === "published" ? "success" : "secondary"} size="sm">{page.status}</IOSBadge>
            {page.show_in_navigation && <IOSBadge variant="secondary" size="sm">Nav</IOSBadge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono text-muted-foreground">/{page.slug}</span>
            {page.total_sections_count !== undefined && (
              <span className="text-[11px] text-muted-foreground">{page.total_sections_count} sections</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link to="/cms/pages/$pageId/edit" params={{ pageId: page.id }}>
          <IOSButton variant="subtle" size="pill" className="h-8 text-xs">
            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
          </IOSButton>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(menuOpen === page.id ? null : page.id)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen === page.id && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-popover border rounded-xl shadow-xl py-1 text-sm">
              {page.status !== "published" && (
                <button onClick={() => { onPublish(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors">
                  <Globe className="h-3.5 w-3.5" /> Publish
                </button>
              )}
              {page.status === "published" && (
                <button onClick={() => { onUnpublish(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Unpublish
                </button>
              )}
              <button onClick={() => { onDuplicate(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              {onDelete && (
                <button onClick={() => { onDelete(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
