"use client";

import { useState } from "react";
import { Star, ChevronDown, ChevronUp, Mail, Phone, MapPin, Clock, ExternalLink, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CmsSectionRecord, CmsPublicSectionRecord, CmsSectionType } from "@/lib/use-cms-v2";

import { HeroSection } from "./sections/hero-section";
import { StorySection } from "./sections/story-section";

export type SectionRendererContext = {
  storeSlug?: string;
  currency?: string;
};

const SUPPORTED_SECTION_TYPES = new Set<string>([
  "hero", "featured_menu", "about", "gallery", "testimonials", "faq",
  "contact_form", "appointment", "map", "opening_hours", "rich_text", "cta", "social_links", "divider"
]);

export function normalizePublicSection(raw: CmsPublicSectionRecord | CmsSectionRecord): CmsSectionRecord {
  const isSupported = SUPPORTED_SECTION_TYPES.has(raw.type);
  if (!isSupported) {
    console.warn(`[CMS SectionRenderer] Unknown or unsupported section type: '${raw.type}' for section ID '${raw.id}'. Rendering safe fallback.`);
  }

  const validVisibility = ["all", "desktop", "tablet", "mobile"].includes(raw.visibility || "")
    ? (raw.visibility as "all" | "desktop" | "tablet" | "mobile")
    : "all";

  return {
    id: raw.id || `sec-${Math.random().toString(36).slice(2, 9)}`,
    store_id: raw.store_id || "",
    page_id: raw.page_id || "",
    type: isSupported ? (raw.type as CmsSectionType) : "unknown",
    position: raw.position ?? 0,
    is_visible: raw.is_visible ?? true,
    visibility: validVisibility,
    content: raw.content || {},
    layout: raw.layout || {},
    appearance: raw.appearance || {},
    background: raw.background || {},
    responsive: raw.responsive || {},
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// ─── Section Registry ───
export function SectionRenderer({
  section,
  isEditor = false,
  context = {},
}: {
  section: CmsSectionRecord;
  isEditor?: boolean;
  context?: SectionRendererContext;
}) {
  if (!section.is_visible && !isEditor) return null;
  const Component = SECTION_MAP[section.type] || UnknownFallbackSection;

  const padding = getPadding(section.layout);
  const bg = getBackground(section.appearance, section.background);

  return (
    <section
      id={`section-${section.id}`}
      className={cn("relative w-full overflow-hidden transition-opacity", !section.is_visible && isEditor && "opacity-40")}
      style={{ ...bg, ...padding }}
    >
      {section.background?.type === "image" && section.background.image_url && (
        <>
          <img
            src={section.background.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `rgba(0,0,0,${(section.background.overlay_opacity || 0) / 100})` }}
          />
        </>
      )}
      <div className={cn("relative z-10 mx-auto", section.layout?.width === "full" ? "w-full" : "max-w-6xl px-4 sm:px-6 lg:px-8")}>
        <Component content={section.content} appearance={section.appearance} layout={section.layout} context={context} />
      </div>
    </section>
  );
}

export function SectionList({
  sections,
  isEditor = false,
  context = {},
}: {
  sections: (CmsSectionRecord | CmsPublicSectionRecord)[];
  isEditor?: boolean;
  context?: SectionRendererContext;
}) {
  const normalized = sections.map((s) => normalizePublicSection(s));
  return (
    <div className="flex flex-col">
      {normalized.map((s) => (
        <SectionRenderer key={s.id} section={s} isEditor={isEditor} context={context} />
      ))}
    </div>
  );
}

// ─── Helpers ───
function getPadding(layout: Record<string, any> = {}) {
  const map: Record<string, string> = { none: "0", small: "1.5rem", medium: "3rem", large: "5rem" };
  return {
    paddingTop: map[layout.padding_top] || map.medium,
    paddingBottom: map[layout.padding_bottom] || map.medium,
  };
}

function getBackground(appearance: Record<string, any> = {}, background: Record<string, any> = {}) {
  const style: Record<string, string> = {};
  if (appearance.text_color) style.color = appearance.text_color;

  if (background.type === "gradient" && background.gradient_from && background.gradient_to) {
    style.background = `linear-gradient(${background.gradient_direction || "135deg"}, ${background.gradient_from}, ${background.gradient_to})`;
  } else if (background.type === "solid" || !background.type) {
    if (appearance.background_color) style.backgroundColor = appearance.background_color;
  }
  if (appearance.border_radius) style.borderRadius = appearance.border_radius;
  return style;
}

// ─── Individual Section Components ───

function LegacyHeroSection({ content, appearance }: SectionProps) {
  return (
    <div className="py-12 md:py-20 text-center space-y-6">
      {content.eyebrow && (
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] font-medium" style={{ color: appearance?.accent_color || "#00E0FF" }}>
          {content.eyebrow}
        </p>
      )}
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto">
        {content.title || "Welcome"}
      </h1>
      {content.subtitle && (
        <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto opacity-80">{content.subtitle}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        {content.cta_primary_text && (
          <a
            href={content.cta_primary_link || "#"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-transform hover:scale-105"
            style={{ backgroundColor: appearance?.accent_color || "#00E0FF", color: "#0F172A" }}
          >
            {content.cta_primary_text}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {content.cta_secondary_text && (
          <a
            href={content.cta_secondary_link || "#"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-current opacity-80 hover:opacity-100 transition-opacity"
          >
            {content.cta_secondary_text}
          </a>
        )}
      </div>
    </div>
  );
}

function FeaturedMenuSection({ content, layout, context }: SectionProps) {
  const { storeSlug, currency } = context || {};
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products", storeSlug],
    enabled: !!storeSlug,
    queryFn: async () => {
      const storeRes = await api.get(`/public/stores/${storeSlug}`);
      const res = await api.get(`/public/stores/${storeRes.data.data.id}/products`);
      return res.data.data;
    },
  });

  const limit = content.limit || 6;
  const categoryId = content.category_id;
  const showFilter = !!content.show_category_filter && !categoryId;
  const design = content.design || layout?.variant || "grid"; // grid | list | carousel | accordion
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(new Map(products.map((p: any) => [p.category_id, p.category_name || "Category"]).filter(([id]: [string, string]) => !!id)).entries());

  let visibleProducts = products;
  if (categoryId) {
    visibleProducts = visibleProducts.filter((p: any) => p.category_id === categoryId);
  } else if (showFilter && selectedCategory !== "all") {
    visibleProducts = visibleProducts.filter((p: any) => p.category_id === selectedCategory);
  }
  visibleProducts = visibleProducts.slice(0, limit);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">{content.title || "Featured Items"}</h2>
        {content.subtitle && <p className="text-sm opacity-70">{content.subtitle}</p>}
        {showFilter && categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn("px-3 py-1 rounded-full text-xs border transition-colors", selectedCategory === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              All
            </button>
            {categories.map(([id, name]) => (
              <button
                key={id as string}
                onClick={() => setSelectedCategory(id as string)}
                className={cn("px-3 py-1 rounded-full text-xs border transition-colors", selectedCategory === id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {name as string}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Loading menu…</p>
      ) : visibleProducts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No products available yet.</p>
      ) : design === "list" ? (
        <div className="divide-y rounded-2xl border bg-background overflow-hidden">
          {visibleProducts.map((p: any) => (
            <Link key={p.id} to="/shop/$slug/p/$productSlug" params={{ slug: storeSlug || "", productSlug: p.slug }}>
              <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded-xl object-cover shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{currency} {Number(p.price).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : design === "carousel" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {visibleProducts.map((p: any) => (
            <Link key={p.id} to="/shop/$slug/p/$productSlug" params={{ slug: storeSlug || "", productSlug: p.slug }} className="shrink-0 w-64 snap-start">
              <div className="group rounded-2xl border bg-background overflow-hidden hover:shadow-lg transition-shadow">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="aspect-video w-full object-cover" loading="lazy" />
                ) : (
                  <div className="aspect-video w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
                <div className="p-4 space-y-1">
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-sm font-medium">{currency} {Number(p.price).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p: any) => (
            <Link key={p.id} to="/shop/$slug/p/$productSlug" params={{ slug: storeSlug || "", productSlug: p.slug }}>
              <div className="group rounded-2xl border bg-background overflow-hidden hover:shadow-lg transition-shadow">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="aspect-video w-full object-cover" loading="lazy" />
                ) : (
                  <div className="aspect-video w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
                <div className="p-4 space-y-1">
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-sm font-medium">
                    {currency} {Number(p.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutSection({ content }: SectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">{content.title || "Our Story"}</h2>
        <p className="text-sm sm:text-base leading-relaxed opacity-80">{content.description || ""}</p>
      </div>
      {content.image_url && (
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img src={content.image_url} alt={content.title || "About"} className="w-full aspect-[4/3] object-cover" loading="lazy" />
        </div>
      )}
    </div>
  );
}

function GallerySection({ content }: SectionProps) {
  const images: string[] = content.images || [];
  return (
    <div className="space-y-6">
      {content.title && <h2 className="text-2xl sm:text-3xl font-bold text-center">{content.title}</h2>}
      {images.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No gallery images added yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url: string, i: number) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-md">
              <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialsSection({ content }: SectionProps) {
  const items: any[] = content.items || [];
  return (
    <div className="space-y-6">
      {content.title && <h2 className="text-2xl sm:text-3xl font-bold text-center">{content.title}</h2>}
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No testimonials added yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t: any, i: number) => (
            <div key={i} className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-3">
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating || 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed opacity-80">"{t.comment}"</p>
              <p className="text-xs font-semibold">— {t.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqSection({ content }: SectionProps) {
  const items: { question: string; answer: string }[] = content.items || [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {content.title && <h2 className="text-2xl sm:text-3xl font-bold text-center">{content.title}</h2>}
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No FAQ items added yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-white/5 transition-colors"
                aria-expanded={openIdx === i}
              >
                <span>{item.question}</span>
                {openIdx === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openIdx === i && (
                <div className="px-4 pb-4 text-sm opacity-70 leading-relaxed">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactFormSection({ content, context }: SectionProps) {
  const { storeSlug } = context || {};
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug) {
      toast.error("Store context missing.");
      return;
    }
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/public/stores/${storeSlug}/cms/v2/contact`, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        topic: "general",
        message: form.message,
        preferred_response_method: "email",
      });
      toast.success("Message sent. We'll get back to you soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">{content.title || "Get in Touch"}</h2>
        {content.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 shrink-0 opacity-60" />
            <span>{content.phone}</span>
          </div>
        )}
        {content.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 shrink-0 opacity-60" />
            <a href={`mailto:${content.email}`} className="hover:underline">{content.email}</a>
          </div>
        )}
        {content.address && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 shrink-0 opacity-60" />
            <span>{content.address}</span>
          </div>
        )}
        {content.opening_hours && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 opacity-60" />
            <span>{content.opening_hours}</span>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
        <p className="text-sm font-semibold">Send us a message</p>
        <Input
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <Input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <Input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <Textarea
          placeholder="Your message…"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          required
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </div>
  );
}

function RichTextSection({ content }: SectionProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {content.title && <h2 className="text-2xl sm:text-3xl font-bold">{content.title}</h2>}
      {content.body && <div className="text-sm sm:text-base leading-relaxed opacity-80 whitespace-pre-wrap">{content.body}</div>}
    </div>
  );
}

function CtaSection({ content, appearance }: SectionProps) {
  return (
    <div className="text-center space-y-4 py-6">
      {content.title && <h2 className="text-2xl sm:text-3xl font-bold">{content.title}</h2>}
      {content.subtitle && <p className="text-sm sm:text-base opacity-70 max-w-xl mx-auto">{content.subtitle}</p>}
      {content.button_text && (
        <a
          href={content.button_link || "#"}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-transform hover:scale-105"
          style={{ backgroundColor: appearance?.accent_color || "#00E0FF", color: "#0F172A" }}
        >
          {content.button_text}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function SocialLinksSection({ content }: SectionProps) {
  const links: { label: string; url: string }[] = content.links || [];
  return (
    <div className="text-center space-y-4">
      {content.title && <h3 className="text-lg font-semibold">{content.title}</h3>}
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">No social links configured.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-current/20 text-sm hover:opacity-80 transition-opacity">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function DividerSection() {
  return <hr className="border-current/10 my-2" />;
}

function OpeningHoursSection({ content }: SectionProps) {
  const hours: { day: string; time: string }[] = content.hours || [];
  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      {content.title && <h2 className="text-2xl font-bold">{content.title}</h2>}
      {hours.length === 0 ? (
        <p className="text-sm text-muted-foreground">Opening hours not configured.</p>
      ) : (
        <div className="space-y-1.5">
          {hours.map((h, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="font-medium">{h.day}</span>
              <span className="opacity-70">{h.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapSection({ content }: SectionProps) {
  return (
    <div className="space-y-4">
      {content.title && <h2 className="text-2xl font-bold text-center">{content.title}</h2>}
      {content.address && (
        <div className="flex items-center justify-center gap-2 text-sm opacity-70">
          <MapPin className="h-4 w-4" />
          <span>{content.address}</span>
        </div>
      )}
      <div className="rounded-2xl overflow-hidden bg-muted h-64 flex items-center justify-center text-sm text-muted-foreground">
        Map integration available. Configure your address.
      </div>
    </div>
  );
}

function AppointmentSection({ content, context }: SectionProps) {
  const { storeSlug } = context || {};
  const [form, setForm] = useState({ name: "", phone: "", email: "", date: "", time: "19:00", guests: "2", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date) {
      toast.error("Please fill in name, phone, and date.");
      return;
    }
    setSubmitted(true);
    toast.success("Table reservation request submitted!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">{content.title || "Book a Table / Appointment"}</h2>
        {content.subtitle && <p className="text-sm opacity-70">{content.subtitle || "Reserve your dining spot or private event in advance."}</p>}
      </div>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
          <p className="font-bold text-emerald-600 dark:text-emerald-400">Reservation Confirmed!</p>
          <p className="text-xs text-muted-foreground">We look forward to hosting you on {form.date} at {form.time} for {form.guests} guest(s).</p>
          <Button variant="outline" size="sm" onClick={() => setSubmitted(false)} className="mt-2">Book Another</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-background border shadow-md space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name</label>
              <Input placeholder="John Doe" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
              <Input placeholder="+1 555-0199" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Time</label>
              <Input type="time" value={form.time} onChange={(e) => setForm(p => ({ ...p, time: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Guests</label>
              <Input type="number" min="1" max="20" value={form.guests} onChange={(e) => setForm(p => ({ ...p, guests: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email (Optional)</label>
              <Input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Special Requests / Dietary Notes</label>
            <Textarea placeholder="Window seat, birthday occasion, allergies..." rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full font-semibold">{content.button_text || "Confirm Reservation"}</Button>
        </form>
      )}
    </div>
  );
}

function UnknownFallbackSection({ content }: SectionProps) {
  return (
    <div className="py-6 px-4 my-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 text-center text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
      <p className="font-semibold">Custom / Unsupported Section Type</p>
      {content?.title && <p className="mt-1 font-medium">{content.title}</p>}
    </div>
  );
}

// ─── Type ───
type SectionProps = {
  content: Record<string, any>;
  appearance?: Record<string, any>;
  layout?: Record<string, any>;
  context?: SectionRendererContext;
};

// ─── Registry ───
const SECTION_MAP: Record<string, React.FC<SectionProps>> = {
  hero: (props: SectionProps) => <HeroSection section={{ id: "hero", type: "hero", content: props.content, appearance: props.appearance || {}, layout: props.layout || {}, store_id: "", page_id: "", position: 0, is_visible: true, visibility: "all", background: {}, responsive: {} }} />,
  featured_menu: FeaturedMenuSection,
  about: (props: SectionProps) => <StorySection section={{ id: "story", type: "about", content: props.content, appearance: props.appearance || {}, layout: props.layout || {}, store_id: "", page_id: "", position: 0, is_visible: true, visibility: "all", background: {}, responsive: {} }} />,
  gallery: GallerySection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  contact_form: ContactFormSection,
  map: MapSection,
  opening_hours: OpeningHoursSection,
  rich_text: RichTextSection,
  cta: CtaSection,
  social_links: SocialLinksSection,
  appointment: AppointmentSection,
  divider: DividerSection,
  unknown: UnknownFallbackSection,
};
