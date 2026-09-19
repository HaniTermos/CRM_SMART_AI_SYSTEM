import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Layers,
  Layout,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  Palette,
  Sliders,
  Sparkles,
  Link2,
  ExternalLink,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Send,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/navigation")({
  component: VisualNavigationDesigner,
});

function VisualNavigationDesigner() {
  const [activeTab, setActiveTab] = useState<"header-links" | "header-design" | "footer-links" | "footer-design">("header-links");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [headerConfig, setHeaderConfig] = useState<any>({
    variant: "logo-left-nav-right",
    logoUrl: "",
    logoAlt: "SmartStore Logo",
    navigationItems: [
      { id: "nav-1", label: "Home", href: "/", visibleDesktop: true, visibleTablet: true, visibleMobile: true },
      { id: "nav-2", label: "Menu Catalog", href: "/menu", visibleDesktop: true, visibleTablet: true, visibleMobile: true },
      { id: "nav-3", label: "About Us", href: "/about", visibleDesktop: true, visibleTablet: true, visibleMobile: true },
      { id: "nav-4", label: "Contact Us", href: "/contact", visibleDesktop: true, visibleTablet: true, visibleMobile: true }
    ],
    primaryCta: { label: "Order Online", action: "order", url: "/menu", enabled: true },
    design: {
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      hoverColor: "#6366f1",
      ctaBgColor: "#4f46e5",
      ctaTextColor: "#ffffff",
      isSticky: true,
      glassmorphism: true,
      borderBottom: true,
      borderColor: "#1e293b",
      shadow: "soft",
      ctaStyle: "rounded-xl"
    }
  });

  const [footerConfig, setFooterConfig] = useState<any>({
    variant: "multi-column",
    columns: [
      {
        id: "col-1",
        title: "Explore",
        items: [
          { id: "f1", label: "Home", href: "/" },
          { id: "f2", label: "Menu Catalog", href: "/menu" },
          { id: "f3", label: "Seasonal Specials", href: "/menu" }
        ]
      },
      {
        id: "col-2",
        title: "Company",
        items: [
          { id: "f4", label: "About Our Story", href: "/about" },
          { id: "f5", label: "Reservations", href: "/reservations" },
          { id: "f6", label: "Contact & Location", href: "/contact" }
        ]
      },
      {
        id: "col-3",
        title: "Legal & Support",
        items: [
          { id: "f7", label: "Privacy Policy", href: "/privacy" },
          { id: "f8", label: "Terms of Service", href: "/terms" }
        ]
      }
    ],
    copyright: "© 2026 SmartStore AI. All rights reserved.",
    newsletter: {
      enabled: true,
      heading: "Stay In The Loop",
      subheading: "Receive weekly chef specials and seasonal promotions directly."
    },
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      youtube: ""
    },
    design: {
      backgroundColor: "#020617",
      textColor: "#94a3b8",
      headingColor: "#f8fafc",
      borderTop: true,
      borderColor: "#1e293b",
      accentColor: "#6366f1"
    }
  });

  useEffect(() => {
    api.get("/cms-v3/me/navigation")
      .then((res) => {
        const data = res.data?.data;
        if (data?.header) {
          setHeaderConfig((prev: any) => ({
            ...prev,
            ...data.header,
            design: { ...prev.design, ...(data.header.design || {}) }
          }));
        }
        if (data?.footer) {
          setFooterConfig((prev: any) => ({
            ...prev,
            ...data.footer,
            design: { ...prev.design, ...(data.footer.design || {}) },
            socials: { ...prev.socials, ...(data.footer.socials || {}) }
          }));
        }
      })
      .catch((err) => console.error("Error loading navigation:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddHeaderItem = () => {
    const newItem = {
      id: `nav-${Date.now()}`,
      label: "New Link",
      href: "/new-page",
      visibleDesktop: true,
      visibleTablet: true,
      visibleMobile: true
    };
    setHeaderConfig({
      ...headerConfig,
      navigationItems: [...(headerConfig.navigationItems || []), newItem]
    });
  };

  const handleRemoveHeaderItem = (id: string) => {
    setHeaderConfig({
      ...headerConfig,
      navigationItems: (headerConfig.navigationItems || []).filter((i: any) => i.id !== id)
    });
  };

  const handleAddFooterColumn = () => {
    const newCol = {
      id: `col-${Date.now()}`,
      title: "New Column",
      items: [{ id: `f-${Date.now()}`, label: "Link 1", href: "/" }]
    };
    setFooterConfig({
      ...footerConfig,
      columns: [...(footerConfig.columns || []), newCol]
    });
  };

  const handleRemoveFooterColumn = (colId: string) => {
    setFooterConfig({
      ...footerConfig,
      columns: (footerConfig.columns || []).filter((c: any) => c.id !== colId)
    });
  };

  const handleAddFooterLink = (colId: string) => {
    const newLink = { id: `f-${Date.now()}`, label: "New Link", href: "/" };
    const updated = (footerConfig.columns || []).map((col: any) => {
      if (col.id === colId) {
        return { ...col, items: [...(col.items || []), newLink] };
      }
      return col;
    });
    setFooterConfig({ ...footerConfig, columns: updated });
  };

  const handleUpdateFooterLink = (colId: string, linkId: string, patch: any) => {
    const updated = (footerConfig.columns || []).map((col: any) => {
      if (col.id === colId) {
        return {
          ...col,
          items: (col.items || []).map((item: any) => (item.id === linkId ? { ...item, ...patch } : item))
        };
      }
      return col;
    });
    setFooterConfig({ ...footerConfig, columns: updated });
  };

  const handleRemoveFooterLink = (colId: string, linkId: string) => {
    const updated = (footerConfig.columns || []).map((col: any) => {
      if (col.id === colId) {
        return {
          ...col,
          items: (col.items || []).filter((item: any) => item.id !== linkId)
        };
      }
      return col;
    });
    setFooterConfig({ ...footerConfig, columns: updated });
  };

  const handleSaveNavigation = async () => {
    setIsSaving(true);
    try {
      const res = await api.put("/cms-v3/me/navigation/draft", {
        header: headerConfig,
        footer: footerConfig
      });

      if (res.data?.success) {
        toast.success("Navigation settings & design saved successfully!");
      } else {
        toast.error("Failed to save navigation");
      }
    } catch (err) {
      toast.error("Error saving navigation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/cms-v3/website/pages"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Pages
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="font-extrabold text-sm text-slate-100 tracking-tight flex items-center gap-2">
            <Layout className="w-4 h-4 text-indigo-400" />
            <span>Visual Navigation & Design Studio</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={cn("px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition", previewDevice === "desktop" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("tablet")}
              className={cn("px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition", previewDevice === "tablet" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={cn("px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition", previewDevice === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>

          <button
            onClick={handleSaveNavigation}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Saving..." : "Save Navigation"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Settings Sidebar */}
        <aside className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
          <div className="grid grid-cols-2 border-b border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab("header-links")}
              className={cn("py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5", activeTab === "header-links" ? "border-indigo-500 text-indigo-400 bg-slate-800/50" : "border-transparent text-slate-400 hover:text-slate-200")}
            >
              <Link2 className="w-3.5 h-3.5" /> Navbar Links
            </button>
            <button
              onClick={() => setActiveTab("header-design")}
              className={cn("py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5", activeTab === "header-design" ? "border-indigo-500 text-indigo-400 bg-slate-800/50" : "border-transparent text-slate-400 hover:text-slate-200")}
            >
              <Palette className="w-3.5 h-3.5" /> Navbar Design
            </button>
            <button
              onClick={() => setActiveTab("footer-links")}
              className={cn("py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5", activeTab === "footer-links" ? "border-indigo-500 text-indigo-400 bg-slate-800/50" : "border-transparent text-slate-400 hover:text-slate-200")}
            >
              <Layers className="w-3.5 h-3.5" /> Footer Links
            </button>
            <button
              onClick={() => setActiveTab("footer-design")}
              className={cn("py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5", activeTab === "footer-design" ? "border-indigo-500 text-indigo-400 bg-slate-800/50" : "border-transparent text-slate-400 hover:text-slate-200")}
            >
              <Sliders className="w-3.5 h-3.5" /> Footer Design
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* TAB 1: HEADER LINKS */}
            {activeTab === "header-links" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Header Navigation Links</h4>
                  <button
                    onClick={handleAddHeaderItem}
                    className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                </div>

                <div className="space-y-2">
                  {(headerConfig.navigationItems || []).map((item: any, idx: number) => (
                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-400 text-[11px]">Item #{idx + 1}</span>
                        <button
                          onClick={() => handleRemoveHeaderItem(item.id)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const updated = [...headerConfig.navigationItems];
                          updated[idx].label = e.target.value;
                          setHeaderConfig({ ...headerConfig, navigationItems: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-indigo-500 font-medium"
                        placeholder="Link Label (e.g. Menu)"
                      />
                      <input
                        type="text"
                        value={item.href}
                        onChange={(e) => {
                          const updated = [...headerConfig.navigationItems];
                          updated[idx].href = e.target.value;
                          setHeaderConfig({ ...headerConfig, navigationItems: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] focus:outline-indigo-500"
                        placeholder="/menu"
                      />
                    </div>
                  ))}
                </div>

                {/* Primary CTA Config */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">Navbar Action Button</span>
                    <input
                      type="checkbox"
                      checked={headerConfig.primaryCta?.enabled !== false}
                      onChange={(e) =>
                        setHeaderConfig({
                          ...headerConfig,
                          primaryCta: { ...headerConfig.primaryCta, enabled: e.target.checked }
                        })
                      }
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={headerConfig.primaryCta?.label || "Order Online"}
                    onChange={(e) =>
                      setHeaderConfig({
                        ...headerConfig,
                        primaryCta: { ...headerConfig.primaryCta, label: e.target.value }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                    placeholder="Button Text"
                  />
                  <input
                    type="text"
                    value={headerConfig.primaryCta?.url || "/menu"}
                    onChange={(e) =>
                      setHeaderConfig({
                        ...headerConfig,
                        primaryCta: { ...headerConfig.primaryCta, url: e.target.value }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px]"
                    placeholder="Button Link URL"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: HEADER DESIGN */}
            {activeTab === "header-design" && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Navbar Visual Styling</h4>

                <div className="space-y-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={headerConfig.design?.backgroundColor || "#0f172a"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, backgroundColor: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={headerConfig.design?.backgroundColor || "#0f172a"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, backgroundColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">Text & Link Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={headerConfig.design?.textColor || "#f8fafc"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, textColor: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={headerConfig.design?.textColor || "#f8fafc"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, textColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">Link Hover Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={headerConfig.design?.hoverColor || "#6366f1"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, hoverColor: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={headerConfig.design?.hoverColor || "#6366f1"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, hoverColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">CTA Button Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={headerConfig.design?.ctaBgColor || "#4f46e5"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, ctaBgColor: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={headerConfig.design?.ctaBgColor || "#4f46e5"}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, ctaBgColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 font-medium">Sticky Navigation</span>
                      <input
                        type="checkbox"
                        checked={headerConfig.design?.isSticky !== false}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, isSticky: e.target.checked }
                          })
                        }
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 font-medium">Glassmorphism / Backdrop Blur</span>
                      <input
                        type="checkbox"
                        checked={headerConfig.design?.glassmorphism !== false}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, glassmorphism: e.target.checked }
                          })
                        }
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 font-medium">Bottom Border Line</span>
                      <input
                        type="checkbox"
                        checked={headerConfig.design?.borderBottom !== false}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            design: { ...headerConfig.design, borderBottom: e.target.checked }
                          })
                        }
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FOOTER LINKS & COLUMNS */}
            {activeTab === "footer-links" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Footer Columns & Links</h4>
                  <button
                    onClick={handleAddFooterColumn}
                    className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Column
                  </button>
                </div>

                <div className="space-y-4">
                  {(footerConfig.columns || []).map((col: any, colIdx: number) => (
                    <div key={col.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <input
                          type="text"
                          value={col.title}
                          onChange={(e) => {
                            const updated = [...footerConfig.columns];
                            updated[colIdx].title = e.target.value;
                            setFooterConfig({ ...footerConfig, columns: updated });
                          }}
                          className="font-bold bg-transparent text-slate-100 text-xs border-b border-transparent focus:border-indigo-500 focus:outline-none"
                          placeholder="Column Title"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddFooterLink(col.id)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5" /> Link
                          </button>
                          <button
                            onClick={() => handleRemoveFooterColumn(col.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Column individual links */}
                      <div className="space-y-2">
                        {(col.items || []).map((item: any) => (
                          <div key={item.id} className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => handleUpdateFooterLink(col.id, item.id, { label: e.target.value })}
                              className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-[11px]"
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={item.href}
                              onChange={(e) => handleUpdateFooterLink(col.id, item.id, { href: e.target.value })}
                              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]"
                              placeholder="/url"
                            />
                            <button
                              onClick={() => handleRemoveFooterLink(col.id, item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: FOOTER DESIGN */}
            {activeTab === "footer-design" && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Footer Visual Styling & Features</h4>

                <div className="space-y-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">Footer Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerConfig.design?.backgroundColor || "#020617"}
                        onChange={(e) =>
                          setFooterConfig({
                            ...footerConfig,
                            design: { ...footerConfig.design, backgroundColor: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={footerConfig.design?.backgroundColor || "#020617"}
                        onChange={(e) =>
                          setFooterConfig({
                            ...footerConfig,
                            design: { ...footerConfig.design, backgroundColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">Link & Body Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerConfig.design?.textColor || "#94a3b8"}
                        onChange={(e) =>
                          setFooterConfig({
                            ...footerConfig,
                            design: { ...footerConfig.design, textColor: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={footerConfig.design?.textColor || "#94a3b8"}
                        onChange={(e) =>
                          setFooterConfig({
                            ...footerConfig,
                            design: { ...footerConfig.design, textColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Copyright Notice */}
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-medium">Copyright Notice</label>
                    <input
                      type="text"
                      value={footerConfig.copyright || "© 2026 SmartStore AI. All rights reserved."}
                      onChange={(e) => setFooterConfig({ ...footerConfig, copyright: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                    />
                  </div>

                  {/* Newsletter feature */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 font-medium">Newsletter Signup Box</span>
                      <input
                        type="checkbox"
                        checked={footerConfig.newsletter?.enabled !== false}
                        onChange={(e) =>
                          setFooterConfig({
                            ...footerConfig,
                            newsletter: { ...footerConfig.newsletter, enabled: e.target.checked }
                          })
                        }
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </label>
                  </div>

                  {/* Social links */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-slate-300 font-medium block">Social Media Links</span>
                    <input
                      type="text"
                      value={footerConfig.socials?.instagram || ""}
                      onChange={(e) =>
                        setFooterConfig({
                          ...footerConfig,
                          socials: { ...footerConfig.socials, instagram: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                      placeholder="Instagram URL (e.g. https://instagram.com/...)"
                    />
                    <input
                      type="text"
                      value={footerConfig.socials?.facebook || ""}
                      onChange={(e) =>
                        setFooterConfig({
                          ...footerConfig,
                          socials: { ...footerConfig.socials, facebook: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                      placeholder="Facebook URL"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Live Center Canvas Preview */}
        <main className="flex-1 bg-slate-950 p-6 overflow-y-auto flex flex-col items-center justify-start">
          <div
            className={cn(
              "w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col min-h-[560px]",
              previewDevice === "mobile" ? "max-w-[375px]" : previewDevice === "tablet" ? "max-w-[768px]" : "max-w-4xl"
            )}
          >
            {/* Live Header Preview Component */}
            <div
              className={cn(
                "px-6 py-4 flex items-center justify-between transition-all duration-200",
                headerConfig.design?.glassmorphism && "backdrop-blur-md"
              )}
              style={{
                backgroundColor: headerConfig.design?.backgroundColor || "#0f172a",
                color: headerConfig.design?.textColor || "#f8fafc",
                borderBottom: headerConfig.design?.borderBottom ? `1px solid ${headerConfig.design?.borderColor || "#1e293b"}` : "none"
              }}
            >
              <span className="font-extrabold text-base tracking-tight" style={{ color: headerConfig.design?.hoverColor || "#6366f1" }}>
                SmartStore AI
              </span>

              {previewDevice !== "mobile" ? (
                <div className="flex items-center gap-6 text-xs font-semibold">
                  {(headerConfig.navigationItems || []).map((item: any) => (
                    <span
                      key={item.id}
                      className="cursor-pointer transition-colors"
                      style={{ color: headerConfig.design?.textColor || "#f8fafc" }}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : null}

              {headerConfig.primaryCta?.enabled !== false && (
                <button
                  className="px-3.5 py-1.5 font-bold text-xs shadow-sm transition"
                  style={{
                    backgroundColor: headerConfig.design?.ctaBgColor || "#4f46e5",
                    color: headerConfig.design?.ctaTextColor || "#ffffff",
                    borderRadius: "0.75rem"
                  }}
                >
                  {headerConfig.primaryCta?.label || "Order Online"}
                </button>
              )}
            </div>

            {/* Live Canvas Mock Content */}
            <div className="flex-1 p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3 bg-slate-900/60">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-300">Live Storefront Header & Footer Wrapper</p>
              <p className="max-w-md text-slate-400 text-xs">
                Your visual navigation design styles and links wrap automatically around all published storefront pages.
              </p>
            </div>

            {/* Live Footer Preview Component */}
            <div
              className="p-8 text-xs space-y-6 transition-all duration-200"
              style={{
                backgroundColor: footerConfig.design?.backgroundColor || "#020617",
                color: footerConfig.design?.textColor || "#94a3b8",
                borderTop: footerConfig.design?.borderTop ? `1px solid ${footerConfig.design?.borderColor || "#1e293b"}` : "none"
              }}
            >
              {footerConfig.newsletter?.enabled !== false && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-100 text-xs">{footerConfig.newsletter?.heading || "Stay In The Loop"}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{footerConfig.newsletter?.subheading}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Enter your email"
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 w-full sm:w-48"
                      disabled
                    />
                    <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shrink-0">
                      Join
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-slate-800/80">
                {(footerConfig.columns || []).map((col: any) => (
                  <div key={col.id} className="space-y-2">
                    <h5 className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">{col.title}</h5>
                    <ul className="space-y-1.5 text-[11px]">
                      {(col.items || []).map((item: any) => (
                        <li key={item.id} className="hover:text-slate-200 cursor-pointer">
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
                <span>{footerConfig.copyright}</span>
                <div className="flex items-center gap-3">
                  {footerConfig.socials?.instagram && <Instagram className="w-3.5 h-3.5 hover:text-slate-200 cursor-pointer" />}
                  {footerConfig.socials?.facebook && <Facebook className="w-3.5 h-3.5 hover:text-slate-200 cursor-pointer" />}
                  {footerConfig.socials?.twitter && <Twitter className="w-3.5 h-3.5 hover:text-slate-200 cursor-pointer" />}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
