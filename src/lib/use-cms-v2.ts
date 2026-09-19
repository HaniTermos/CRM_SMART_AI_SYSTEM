import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ──────────────── Types ────────────────

export type CmsPageStatus = "draft" | "published" | "scheduled" | "archived";

export type CmsPageRecord = {
  id: string;
  store_id: string;
  type: string;
  title: string;
  slug: string;
  status: CmsPageStatus;
  is_system_page: boolean;
  show_in_navigation: boolean;
  navigation_label: string | null;
  seo_title: string | null;
  seo_description: string | null;
  social_image_url: string | null;
  scheduled_publish_at: string | null;
  published_at: string | null;
  visible_sections_count?: number;
  total_sections_count?: number;
  max_version?: number;
  created_at: string;
  updated_at: string;
  sections?: CmsSectionRecord[];
};

export type CmsSectionType =
  | "hero"
  | "featured_menu"
  | "about"
  | "gallery"
  | "testimonials"
  | "faq"
  | "contact_form"
  | "map"
  | "opening_hours"
  | "rich_text"
  | "cta"
  | "social_links"
  | "appointment"
  | "divider"
  | "unknown";

export type CmsPageSectionItem = CmsSectionRecord;

export type CmsSectionRecord = {
  id: string;
  store_id: string;
  page_id: string;
  type: CmsSectionType;
  position: number;
  is_visible: boolean;
  visibility: "all" | "desktop" | "tablet" | "mobile";
  content: Record<string, any>;
  layout: Record<string, any>;
  appearance: Record<string, any>;
  background: Record<string, any>;
  responsive: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type CmsPublicSectionRecord = {
  id: string;
  store_id?: string;
  page_id?: string;
  type: string;
  position?: number;
  is_visible?: boolean;
  visibility?: string;
  content: Record<string, any>;
  layout?: Record<string, any>;
  appearance?: Record<string, any>;
  background?: Record<string, any>;
  responsive?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type CmsVersionRecord = {
  id: string;
  page_id: string;
  version: number;
  sections_snapshot: CmsSectionRecord[];
  page_metadata_snapshot: Record<string, any>;
  created_by: string | null;
  created_at: string;
};

export type CmsNavItem = {
  id: string;
  store_id: string;
  location: "header" | "footer" | "mobile";
  label: string;
  url: string;
  page_id: string | null;
  position: number;
  is_external: boolean;
  is_highlighted: boolean;
};

export type CmsContactMsg = {
  id: string;
  store_id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  preferred_response_method: string;
  status: "open" | "in_progress" | "resolved" | "spam";
  created_at: string;
};

export type CmsOverview = {
  settings: any;
  stats: {
    total_pages: number;
    published_pages: number;
    draft_pages: number;
    total_media: number;
    total_announcements: number;
    last_published_at: string | null;
  };
  recent_pages: CmsPageRecord[];
  recent_activity: any[];
};

// ──────────────── Overview ────────────────

export function useCmsOverview() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-overview", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsOverview> => {
      const res = await api.get("/stores/me/cms/overview");
      return res.data.data;
    },
    staleTime: 15000,
  });
}

// ──────────────── Pages ────────────────

export function useCmsPages() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-pages", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsPageRecord[]> => {
      const res = await api.get("/stores/me/cms/pages");
      return res.data.data;
    },
    staleTime: 20000,
  });
}

export function useCmsPage(pageId: string | undefined) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-page", pageId],
    enabled: !!user && !loading && !!pageId,
    queryFn: async (): Promise<CmsPageRecord & { sections: CmsSectionRecord[] }> => {
      const res = await api.get(`/stores/me/cms/pages/${pageId}`);
      return res.data.data;
    },
    staleTime: 10000,
  });
}

export function useCreateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CmsPageRecord>) => {
      const res = await api.post("/stores/me/cms/pages", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-pages"] }),
  });
}

export function useUpdateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CmsPageRecord>) => {
      const res = await api.patch(`/stores/me/cms/pages/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      qc.invalidateQueries({ queryKey: ["cms-page", v.id] });
    },
  });
}

export function useDeleteCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stores/me/cms/pages/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-pages"] }),
  });
}

export function usePublishCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await api.post(`/stores/me/cms/pages/${pageId}/publish`);
      return res.data.data;
    },
    onSuccess: (_, pageId) => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      qc.invalidateQueries({ queryKey: ["cms-page", pageId] });
    },
  });
}

export function useUnpublishCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await api.post(`/stores/me/cms/pages/${pageId}/unpublish`);
      return res.data.data;
    },
    onSuccess: (_, pageId) => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      qc.invalidateQueries({ queryKey: ["cms-page", pageId] });
    },
  });
}

export function useDuplicateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await api.post(`/stores/me/cms/pages/${pageId}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-pages"] }),
  });
}

export function useCmsPageVersions(pageId: string | undefined) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-page-versions", pageId],
    enabled: !!user && !loading && !!pageId,
    queryFn: async (): Promise<CmsVersionRecord[]> => {
      const res = await api.get(`/stores/me/cms/pages/${pageId}/versions`);
      return res.data.data;
    },
  });
}

export function useRestoreCmsPageVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, versionId }: { pageId: string; versionId: string }) => {
      const res = await api.post(`/stores/me/cms/pages/${pageId}/restore/${versionId}`);
      return res.data.data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["cms-page", v.pageId] });
      qc.invalidateQueries({ queryKey: ["cms-page-versions", v.pageId] });
    },
  });
}

export function useGeneratePreviewToken() {
  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await api.post(`/stores/me/cms/pages/${pageId}/preview-token`);
      return res.data.data;
    },
  });
}

// ──────────────── Sections ────────────────

export function useCmsPageSections(pageId: string | undefined) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-sections", pageId],
    enabled: !!user && !loading && !!pageId,
    queryFn: async (): Promise<CmsSectionRecord[]> => {
      const res = await api.get(`/stores/me/cms/pages/${pageId}/sections`);
      return res.data.data;
    },
    staleTime: 10000,
  });
}

export function useCreateCmsSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, ...data }: { pageId: string } & Partial<CmsSectionRecord>) => {
      const res = await api.post(`/stores/me/cms/pages/${pageId}/sections`, data);
      return res.data.data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["cms-sections", v.pageId] }),
  });
}

export function useUpdateCmsSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, ...data }: { sectionId: string; pageId?: string } & Partial<CmsSectionRecord>) => {
      const res = await api.patch(`/stores/me/cms/sections/${sectionId}`, data);
      return res.data.data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["cms-sections", d.page_id] }),
  });
}

export function useReorderCmsSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, sectionIds }: { pageId: string; sectionIds: string[] }) => {
      const res = await api.patch(`/stores/me/cms/pages/${pageId}/sections/reorder`, { section_ids: sectionIds });
      return res.data.data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["cms-sections", v.pageId] }),
  });
}

export function useDuplicateCmsSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, pageId }: { sectionId: string; pageId: string }) => {
      const res = await api.post(`/stores/me/cms/sections/${sectionId}/duplicate`);
      return res.data.data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["cms-sections", v.pageId] }),
  });
}

export function useDeleteCmsSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, pageId }: { sectionId: string; pageId: string }) => {
      await api.delete(`/stores/me/cms/sections/${sectionId}`);
      return { pageId };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["cms-sections", d.pageId] }),
  });
}

// ──────────────── Navigation ────────────────

export function useCmsNavigation(location?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-nav", user?.id, location],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsNavItem[]> => {
      const q = location ? `?location=${location}` : "";
      const res = await api.get(`/stores/me/cms/navigation${q}`);
      return res.data.data;
    },
    staleTime: 20000,
  });
}

export function useCreateCmsNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CmsNavItem>) => {
      const res = await api.post("/stores/me/cms/navigation", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-nav"] }),
  });
}

export function useUpdateCmsNavBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Partial<CmsNavItem>[]) => {
      const res = await api.patch("/stores/me/cms/navigation", { items });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-nav"] }),
  });
}

export function useDeleteCmsNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stores/me/cms/navigation/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-nav"] }),
  });
}

// ──────────────── Contact Messages ────────────────

export function useCmsContactMessages(status?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-contact-msgs", user?.id, status],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsContactMsg[]> => {
      const q = status ? `?status=${status}` : "";
      const res = await api.get(`/stores/me/cms/contact-messages${q}`);
      return res.data.data;
    },
    staleTime: 15000,
  });
}

export type CmsContactAnalytics = {
  total: number;
  by_status: Record<string, number>;
  by_day: Array<{ date: string; count: number }>;
  by_topic: Array<{ topic: string; count: number }>;
};

export function useCmsContactMessageAnalytics(days = 30) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-contact-analytics", user?.id, days],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsContactAnalytics> => {
      const res = await api.get(`/stores/me/cms/contact-messages/analytics?days=${days}`);
      return res.data.data;
    },
    staleTime: 60000,
  });
}

export function useUpdateContactMsgStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/stores/me/cms/contact-messages/${id}`, { status });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-contact-msgs"] }),
  });
}

// ──────────────── Section Type Labels ────────────────

export const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  featured_menu: "Featured Menu",
  about: "About / Story",
  gallery: "Photo Gallery",
  testimonials: "Testimonials",
  faq: "FAQ Accordion",
  contact_form: "Contact Form",
  map: "Map & Directions",
  opening_hours: "Opening Hours",
  rich_text: "Rich Text",
  cta: "Call to Action",
  social_links: "Social Links",
  appointment: "Table Booking / Appointment",
  divider: "Divider",
};

export const SECTION_TYPE_LIST: CmsSectionType[] = [
  "hero",
  "featured_menu",
  "about",
  "gallery",
  "testimonials",
  "faq",
  "contact_form",
  "map",
  "opening_hours",
  "rich_text",
  "cta",
  "social_links",
  "appointment",
  "divider",
];

// ──────────────── Settings, Media, Announcements & Activity ────────────────

export type CmsAppearance = {
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  button_style: string;
  border_radius: string;
  theme_mode: "light" | "dark";
  layout_type: string;
  theme_id: string | null;
};

export type HomepageContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  cta_primary_text: string;
  cta_primary_link: string;
  cta_secondary_text: string;
  cta_secondary_link: string;
  about_title: string;
  about_description: string;
  featured_products_enabled: boolean;
  gallery_images: string[];
  testimonials: Array<{ name: string; comment: string; rating: number }>;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
};

export type CmsSettings = {
  id: string;
  store_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  button_style: string;
  border_radius: string;
  theme_mode: string;
  layout_type: string;
  theme_id: string | null;
  homepage_draft: HomepageContent;
  homepage_published: HomepageContent | null;
  seo_title: string | null;
  seo_description: string | null;
  social_image_url: string | null;
  version: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CmsMediaItem = {
  id: string;
  store_id: string;
  filename: string;
  url: string;
  mime_type: string;
  file_size: number;
  alt_text: string;
  created_at: string;
};

export type CmsAnnouncement = {
  id: string;
  store_id: string;
  title: string;
  message: string;
  cta_text: string | null;
  cta_link: string | null;
  start_date: string | null;
  end_date: string | null;
  is_enabled: boolean;
  status: "draft" | "published";
  created_at: string;
};

export type CmsActivityLogEntry = {
  id: string;
  store_id: string;
  user_name: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
};

export function useCmsSettings() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-settings", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsSettings> => {
      const res = await api.get("/stores/me/cms/settings");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useUpdateCmsSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<CmsSettings & { homepage_draft: Partial<HomepageContent> }>) => {
      const res = await api.patch("/stores/me/cms/settings", updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
    },
  });
}

export function usePublishCms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/stores/me/cms/settings/publish");
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cms-activity"] });
    },
  });
}

export function useRollbackCms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/stores/me/cms/settings/rollback");
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cms-activity"] });
    },
  });
}

export function useCmsMedia() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-media", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsMediaItem[]> => {
      const res = await api.get("/stores/me/cms/media");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useCreateCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CmsMediaItem>) => {
      const res = await api.post("/stores/me/cms/media", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-media"] });
    },
  });
}

export function useUploadCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post("/stores/me/cms/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as CmsMediaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-media"] });
    },
  });
}

export function useUpdateCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CmsMediaItem>) => {
      const res = await api.patch(`/stores/me/cms/media/${id}`, data);
      return res.data.data as CmsMediaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-media"] });
    },
  });
}

export function useDeleteCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/stores/me/cms/media/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-media"] });
    },
  });
}

export function useCmsAnnouncements() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-announcements", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsAnnouncement[]> => {
      const res = await api.get("/stores/me/cms/announcements");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useCreateCmsAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CmsAnnouncement>) => {
      const res = await api.post("/stores/me/cms/announcements", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-announcements"] });
    },
  });
}

export function useUpdateCmsAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CmsAnnouncement>) => {
      const res = await api.patch(`/stores/me/cms/announcements/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-announcements"] });
    },
  });
}

export function useDeleteCmsAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stores/me/cms/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-announcements"] });
    },
  });
}

export function useCmsActivity() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-activity", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsActivityLogEntry[]> => {
      const res = await api.get("/stores/me/cms/activity");
      return res.data.data;
    },
    staleTime: 15000,
  });
}

// ──────────────── Themes ────────────────

export type CmsTheme = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  colors: Record<string, string>;
  fonts: Record<string, string>;
};

export type CmsThemesResponse = {
  themes: CmsTheme[];
  current_theme_id: string | null;
};

export function useCmsThemes() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["cms-themes", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<CmsThemesResponse> => {
      const res = await api.get("/stores/me/cms/themes");
      return res.data.data;
    },
    staleTime: 300000,
  });
}

export function useApplyCmsTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (themeId: string) => {
      const res = await api.post(`/stores/me/cms/themes/${themeId}/apply`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-themes"] });
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cms-activity"] });
    },
  });
}

// ──────────────── AI Builder ────────────────

export type CmsAIPlan = {
  title: string;
  description: string;
  sections: Array<{
    type: CmsSectionType;
    position: number;
    content: Record<string, any>;
    appearance?: Record<string, any>;
    background?: Record<string, any>;
    layout?: Record<string, any>;
  }>;
};

export function useGenerateWebsiteAI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ prompt, apply }: { prompt?: string; apply?: boolean }) => {
      const res = await api.post("/stores/me/cms/ai/generate-website", { prompt, apply });
      return res.data.data as CmsAIPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      queryClient.invalidateQueries({ queryKey: ["cms-page"] });
      queryClient.invalidateQueries({ queryKey: ["cms-sections"] });
      queryClient.invalidateQueries({ queryKey: ["cms-activity"] });
    },
  });
}

export function useEditPageAI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, prompt, apply }: { pageId: string; prompt?: string; apply?: boolean }) => {
      const res = await api.post("/stores/me/cms/ai/edit-page", { pageId, prompt, apply });
      return res.data.data as CmsAIPlan;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["cms-page", v.pageId] });
      queryClient.invalidateQueries({ queryKey: ["cms-sections", v.pageId] });
      queryClient.invalidateQueries({ queryKey: ["cms-activity"] });
    },
  });
}

export function useApplyAIPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, sections }: { pageId: string; sections: CmsAIPlan["sections"] }) => {
      const res = await api.post("/stores/me/cms/ai/apply-plan", { pageId, sections });
      return res.data.data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["cms-page", v.pageId] });
      queryClient.invalidateQueries({ queryKey: ["cms-sections", v.pageId] });
      queryClient.invalidateQueries({ queryKey: ["cms-activity"] });
    },
  });
}
