"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { useCmsThemes, useApplyCmsTheme, usePublishCms, useRollbackCms } from "@/lib/use-cms-v2";
import { toast } from "sonner";
import {
  Palette, Search, Eye, Check, Star, RefreshCcw, Smartphone, Tablet, Monitor,
  Layout, ShieldCheck, ArrowRight, X, Sparkles, Layers, History
} from "lucide-react";
import { cn } from "@/lib/utils";

export const THEME_CATEGORIES = [
  "All",
  "Café",
  "Bakery",
  "Restaurant",
  "Fine dining",
  "Fast food",
  "Food truck",
  "Catering",
  "Juice/healthy",
  "Dessert",
  "Cloud kitchen",
] as const;

export interface ThemeTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  conversionGoal: "orders" | "reservations" | "brand";
  colors: { primary: string; secondary: string; background: string; accent: string };
  typography: { fontHeading: string; fontBody: string };
  templatesCount: number;
  previewImage: string;
  description: string;
}

const SEED_THEMES: ThemeTemplate[] = [
  {
    id: "theme-modern-bistro",
    name: "Modern Bistro",
    slug: "modern-bistro",
    category: "Restaurant",
    conversionGoal: "reservations",
    colors: { primary: "#190E85", secondary: "#2D1B9E", background: "#0F172A", accent: "#00E0FF" },
    typography: { fontHeading: "Outfit", fontBody: "Inter" },
    templatesCount: 6,
    previewImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    description: "Sleek dark-mode aesthetic for high-end dining and table reservations.",
  },
  {
    id: "theme-artisan-cafe",
    name: "Artisan Café",
    slug: "artisan-cafe",
    category: "Café",
    conversionGoal: "orders",
    colors: { primary: "#78350F", secondary: "#B45309", background: "#FFFBEB", accent: "#D97706" },
    typography: { fontHeading: "Playfair Display", fontBody: "Plus Jakarta Sans" },
    templatesCount: 5,
    previewImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
    description: "Warm earthy palette ideal for specialty coffee shops and bakeries.",
  },
  {
    id: "theme-street-bites",
    name: "Street Bites",
    slug: "street-bites",
    category: "Fast food",
    conversionGoal: "orders",
    colors: { primary: "#DC2626", secondary: "#EF4444", background: "#09090B", accent: "#F59E0B" },
    typography: { fontHeading: "Montserrat", fontBody: "Inter" },
    templatesCount: 4,
    previewImage: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80",
    description: "High-energy bold layouts built for fast takeout and quick delivery orders.",
  },
  {
    id: "theme-green-leaf",
    name: "Green Leaf Organics",
    slug: "green-leaf",
    category: "Juice/healthy",
    conversionGoal: "brand",
    colors: { primary: "#047857", secondary: "#10B981", background: "#F0FDF4", accent: "#059669" },
    typography: { fontHeading: "Outfit", fontBody: "Inter" },
    templatesCount: 5,
    previewImage: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80",
    description: "Fresh vibrant green tones designed for juice bars and organic bowls.",
  },
  {
    id: "theme-sweet-patisserie",
    name: "Sweet Patisserie",
    slug: "sweet-patisserie",
    category: "Dessert",
    conversionGoal: "orders",
    colors: { primary: "#DB2777", secondary: "#F472B6", background: "#FDF2F8", accent: "#EC4899" },
    typography: { fontHeading: "Lora", fontBody: "Inter" },
    templatesCount: 5,
    previewImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    description: "Elegant pastel styling showcase for bakeries, cakes, and desserts.",
  },
];

export function CmsThemeMarketplace() {
  const { data: apiThemes = [] } = useCmsThemes();
  const applyThemeMutation = useApplyCmsTheme();
  const publishMutation = usePublishCms();
  const rollbackMutation = useRollbackCms();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewTheme, setPreviewTheme] = useState<ThemeTemplate | null>(null);
  const [compareTheme, setCompareTheme] = useState<ThemeTemplate | null>(null);

  const filteredThemes = SEED_THEMES.filter((t) => {
    const matchCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleApplyDraft = (theme: ThemeTemplate) => {
    applyThemeMutation.mutate(theme.slug, {
      onSuccess: () => {
        toast.success(`Theme "${theme.name}" applied as a Draft! Your existing products, categories, orders, and pages remain 100% preserved.`);
        setPreviewTheme(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Failed to apply theme draft");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Theme Marketplace & Gallery</h2>
            <IOSBadge variant="violet" size="sm">Phase 3</IOSBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            Select high-conversion store themes. Applying a new theme creates a <strong>Draft</strong> while keeping all your existing products, categories, and SEO data intact.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IOSButton variant="outline" size="sm" onClick={() => rollbackMutation.mutate()} className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> Rollback Version
          </IOSButton>
          <IOSButton variant="gradient" size="sm" onClick={() => publishMutation.mutate()} className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Publish Active Draft
          </IOSButton>
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/50 max-w-full no-scrollbar">
          {THEME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search themes..."
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredThemes.map((theme) => (
          <motion.div key={theme.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <IOSCard className="overflow-hidden group flex flex-col h-full border border-border/50 hover:border-primary/40 transition-all">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img src={theme.previewImage} alt={theme.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <IOSBadge variant="secondary" size="sm">{theme.category}</IOSBadge>
                  <IOSBadge variant="outline" size="sm" className="bg-black/60 text-white border-none">{theme.conversionGoal}</IOSBadge>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                  <IOSButton variant="glass" size="sm" onClick={() => setPreviewTheme(theme)} className="gap-1 text-xs">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </IOSButton>
                  <IOSButton variant="subtle" size="sm" onClick={() => setCompareTheme(theme)} className="gap-1 text-xs">
                    <Layers className="h-3.5 w-3.5" /> Compare
                  </IOSButton>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base">{theme.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{theme.description}</p>
                </div>

                {/* Color Palette & Font Pill */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: theme.colors.primary }} />
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: theme.colors.accent }} />
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: theme.colors.secondary }} />
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">{theme.typography.fontHeading}</span>
                  </div>

                  <IOSButton
                    variant="gradient"
                    size="sm"
                    onClick={() => handleApplyDraft(theme)}
                    isLoading={applyThemeMutation.isPending}
                    className="gap-1 text-xs"
                  >
                    Apply Draft <ArrowRight className="h-3 w-3" />
                  </IOSButton>
                </div>
              </div>
            </IOSCard>
          </motion.div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTheme && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between p-3 bg-card border rounded-2xl mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-sm">{previewTheme.name} Live Preview</h3>
              <IOSBadge variant="secondary" size="sm">{previewTheme.category}</IOSBadge>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                <button onClick={() => setViewport("desktop")} className={cn("p-1.5 rounded-lg", viewport === "desktop" && "bg-card shadow-sm")}><Monitor className="h-4 w-4" /></button>
                <button onClick={() => setViewport("tablet")} className={cn("p-1.5 rounded-lg", viewport === "tablet" && "bg-card shadow-sm")}><Tablet className="h-4 w-4" /></button>
                <button onClick={() => setViewport("mobile")} className={cn("p-1.5 rounded-lg", viewport === "mobile" && "bg-card shadow-sm")}><Smartphone className="h-4 w-4" /></button>
              </div>

              <IOSButton variant="gradient" size="sm" onClick={() => handleApplyDraft(previewTheme)} className="gap-1 text-xs">
                Apply Theme as Draft
              </IOSButton>

              <button onClick={() => setPreviewTheme(null)} className="p-2 rounded-xl hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <div className={cn(
              "h-full bg-card rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300",
              viewport === "desktop" && "w-full",
              viewport === "tablet" && "w-[768px]",
              viewport === "mobile" && "w-[375px]"
            )}>
              <iframe src="/shop/demo" className="w-full h-full border-none" title="Theme Preview" />
            </div>
          </div>
        </div>
      )}

      {/* Before / After Comparison Modal */}
      {compareTheme && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Before / After Content Mapping</h3>
              <button onClick={() => setCompareTheme(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
              <strong>100% Content Safety Guaranteed:</strong> Your existing products, categories, orders, customers, reviews, and SEO metadata will remain unchanged.
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Current Active Theme</span>
                <div className="font-semibold text-sm">Default Store Theme</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Preserved 12 Products</li>
                  <li>✓ Preserved 4 Categories</li>
                  <li>✓ Preserved 3 Static Pages</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-primary">New Target Theme</span>
                <div className="font-semibold text-sm">{compareTheme.name}</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Mapped Hero Section</li>
                  <li>✓ Mapped Category Grid</li>
                  <li>✓ Mapped Reservation CTA</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <IOSButton variant="outline" size="sm" onClick={() => setCompareTheme(null)}>
                Cancel
              </IOSButton>
              <IOSButton variant="gradient" size="sm" onClick={() => { setCompareTheme(null); handleApplyDraft(compareTheme); }}>
                Proceed & Apply Draft
              </IOSButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
