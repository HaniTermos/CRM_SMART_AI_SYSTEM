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
  useCmsAnnouncements,
  useCreateCmsAnnouncement,
  useUpdateCmsAnnouncement,
  useDeleteCmsAnnouncement,
} from "@/lib/use-cms-v2";
import { ChevronLeft, Megaphone, Plus, Trash2, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

type AnnouncementForm = {
  title: string;
  message: string;
  cta_text: string;
  cta_link: string;
  start_date: string;
  end_date: string;
};

const emptyForm: AnnouncementForm = {
  title: "",
  message: "",
  cta_text: "",
  cta_link: "",
  start_date: "",
  end_date: "",
};

export function CmsAnnouncementsManager() {
  const { data: announcements = [], isLoading } = useCmsAnnouncements();
  const createMut = useCreateCmsAnnouncement();
  const updateMut = useUpdateCmsAnnouncement();
  const deleteMut = useDeleteCmsAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);

  const handleCreate = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    createMut.mutate(
      {
        ...form,
        status: "draft",
        is_enabled: true,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm(emptyForm);
          toast.success("Announcement created.");
        },
      }
    );
  };

  const toggleStatus = (id: string, current: string) => {
    updateMut.mutate({ id, status: current === "published" ? "draft" : "published" });
  };

  const toggleEnabled = (id: string, current: boolean) => {
    updateMut.mutate({ id, is_enabled: !current });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link to="/cms" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create storefront banners and scheduled notices.
          </p>
        </div>
      </div>

      <IOSCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Active Announcements
            <IOSBadge variant="secondary" size="sm">{announcements.length}</IOSBadge>
          </h2>
          <IOSButton variant="default" size="pill" className="h-7 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3 w-3 mr-1" /> New
          </IOSButton>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">CTA Text</Label><Input value={form.cta_text} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} className="h-8 text-xs" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Message</Label><Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} className="text-xs" rows={2} /></div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">CTA Link</Label><Input value={form.cta_link} onChange={(e) => setForm((p) => ({ ...p, cta_link: e.target.value }))} className="h-8 text-xs" placeholder="https://..." /></div>
                  <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">End Date</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} className="h-8 text-xs" /></div>
                </div>
                <div className="flex gap-2">
                  <IOSButton variant="default" size="pill" className="h-7 text-xs" onClick={handleCreate} disabled={createMut.isPending || !form.title.trim() || !form.message.trim()}>
                    <Save className="h-3 w-3 mr-1" /> Save Draft
                  </IOSButton>
                  <IOSButton variant="subtle" size="pill" className="h-7 text-xs" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                    Cancel
                  </IOSButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No announcements yet.</p>
            <p className="text-xs mt-1">Create a banner to display on your storefront.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{a.title}</span>
                    <IOSBadge variant={a.status === "published" ? "success" : "secondary"} size="sm">{a.status}</IOSBadge>
                    {!a.is_enabled && <IOSBadge variant="destructive" size="sm">Disabled</IOSBadge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.message}</p>
                  {(a.start_date || a.end_date) && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {a.start_date ? new Date(a.start_date).toLocaleString() : "Now"} → {a.end_date ? new Date(a.end_date).toLocaleString() : "No end"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleEnabled(a.id, a.is_enabled)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      a.is_enabled ? "hover:bg-muted text-primary" : "hover:bg-muted text-muted-foreground"
                    )}
                    title={a.is_enabled ? "Disable" : "Enable"}
                  >
                    {a.is_enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <IOSButton
                    variant="subtle"
                    size="pill"
                    className="h-7 text-xs"
                    onClick={() => toggleStatus(a.id, a.status)}
                  >
                    {a.status === "published" ? "Unpublish" : "Publish"}
                  </IOSButton>
                  <button
                    onClick={() => { if (confirm("Delete this announcement?")) deleteMut.mutate(a.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </IOSCard>
    </div>
  );
}
