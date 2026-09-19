"use client";

import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { UtensilsCrossed, LayoutGrid, List, Layers, Eye, Check, Save, Sparkles, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/cms/menu-presentation")({
  component: MenuPresentationStudioPage,
});

function MenuPresentationStudioPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cms-menu-presentation"],
    queryFn: async () => {
      const res = await api.get("/stores/me/cms/menu-presentation");
      return res.data.data;
    },
  });

  const [layoutDesign, setLayoutDesign] = useState("tabs");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [showDietary, setShowDietary] = useState(true);
  const [showSearch, setShowSearch] = useState(true);
  const [soldOutBehavior, setSoldOutBehavior] = useState("dim");
  const [stickyCta, setStickyCta] = useState(true);

  useEffect(() => {
    if (data) {
      setLayoutDesign(data.layout_design || "tabs");
      setAspectRatio(data.image_aspect_ratio || "16:9");
      setShowDietary(data.show_dietary_badges ?? true);
      setShowSearch(data.show_search_bar ?? true);
      setSoldOutBehavior(data.sold_out_behavior || "dim");
      setStickyCta(data.sticky_order_cta ?? true);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/stores/me/cms/menu-presentation", {
        layout_design: layoutDesign,
        image_aspect_ratio: aspectRatio,
        show_dietary_badges: showDietary,
        show_search_bar: showSearch,
        sold_out_behavior: soldOutBehavior,
        sticky_order_cta: stickyCta,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Menu presentation settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["cms-menu-presentation"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to save presentation settings");
    },
  });

  const layouts = [
    { id: "tabs", name: "Category Tabs", desc: "Top tabbed bar with category filtering & product grid", icon: Layers },
    { id: "grid", name: "Product Grid", desc: "Clean 3-column card grid with large image previews", icon: LayoutGrid },
    { id: "list", name: "Compact List", desc: "Minimal list rows with thumbnail, title & price", icon: List },
    { id: "accordion", name: "Accordion Categories", desc: "Collapsible category accordions for large menus", icon: UtensilsCrossed },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-adaptive p-6 rounded-2xl border shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Menu Presentation Studio</h1>
            <IOSBadge variant="violet" size="sm">Customer Experience</IOSBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Customize how your operational menu & products are displayed to customers on your public storefront.
          </p>
        </div>
        <IOSButton
          variant="default"
          size="md"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-1.5" />
          {saveMutation.isPending ? "Saving..." : "Save Presentation"}
        </IOSButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <IOSCard className="p-5 space-y-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sliders className="h-4 w-4 text-primary" />
              Layout Design Template
            </h2>

            <div className="space-y-2">
              {layouts.map((l) => {
                const Icon = l.icon;
                const isSelected = layoutDesign === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLayoutDesign(l.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3",
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-background/60 hover:bg-muted"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg shrink-0", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs text-foreground">{l.name}</p>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{l.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <hr />

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display & Filtering Settings</h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer">
                  <span>Show Dietary Badges</span>
                  <input
                    type="checkbox"
                    checked={showDietary}
                    onChange={(e) => setShowDietary(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer">
                  <span>Show Search Bar</span>
                  <input
                    type="checkbox"
                    checked={showSearch}
                    onChange={(e) => setShowSearch(e.target.value as any ?? e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer">
                  <span>Sticky Floating Order Bar</span>
                  <input
                    type="checkbox"
                    checked={stickyCta}
                    onChange={(e) => setStickyCta(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                </label>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Image Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full glass-input text-xs p-2 rounded-xl border bg-background text-foreground"
                >
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>
            </div>
          </IOSCard>
        </div>

        {/* Live Presentation Preview */}
        <div className="lg:col-span-2 space-y-4">
          <IOSCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                Live Customer Preview ({layoutDesign.toUpperCase()})
              </span>
              <IOSBadge variant="secondary" size="sm">Real-time Simulation</IOSBadge>
            </div>

            <div className="p-4 rounded-2xl border bg-background min-h-[420px] space-y-4 shadow-inner">
              {showSearch && (
                <div className="p-2.5 rounded-xl border bg-muted/30 text-xs text-muted-foreground">
                  🔍 Search dishes, ingredients, or allergens...
                </div>
              )}

              {layoutDesign === "tabs" && (
                <div className="space-y-4">
                  <div className="flex gap-2 border-b pb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">All</span>
                    <span className="px-3 py-1 rounded-full text-xs text-muted-foreground hover:bg-muted">Pastries</span>
                    <span className="px-3 py-1 rounded-full text-xs text-muted-foreground hover:bg-muted">Breads</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 rounded-xl border bg-card space-y-2">
                        <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">Dish Photo</div>
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-xs">Croissant Artisanal</p>
                          <span className="text-xs font-bold text-primary">$4.50</span>
                        </div>
                        {showDietary && <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-600 font-semibold">Vegetarian</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {layoutDesign === "list" && (
                <div className="divide-y rounded-xl border overflow-hidden">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg shrink-0" />
                        <div>
                          <p className="font-bold text-xs">Pain au Chocolat</p>
                          <p className="text-[10px] text-muted-foreground">Flaky butter pastry filled with dark chocolate</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-primary">$5.00</span>
                    </div>
                  ))}
                </div>
              )}

              {layoutDesign === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-xl border bg-card space-y-2">
                      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">Product</div>
                      <p className="font-bold text-xs truncate">Artisanal Sourdough</p>
                      <p className="text-xs font-bold text-primary">$8.00</p>
                    </div>
                  ))}
                </div>
              )}

              {layoutDesign === "accordion" && (
                <div className="space-y-2">
                  {["Breakfast Specials", "Chef Signatures", "Beverages"].map((cat) => (
                    <div key={cat} className="p-3 rounded-xl border bg-card flex justify-between items-center text-xs font-bold">
                      <span>{cat}</span>
                      <span>↓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </IOSCard>
        </div>
      </div>
    </div>
  );
}
