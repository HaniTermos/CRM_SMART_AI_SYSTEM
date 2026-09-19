/**
 * SmartStore Website Studio (CMS V3) — Deep Inspectors for Core Atoms & Sections
 */

import React, { useState } from "react";
import { PageNode } from "../../types/cms-v3";
import {
  Type,
  MousePointer,
  Image as ImageIcon,
  Sparkles,
  Minus,
  Maximize2,
  ShoppingBag,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Palette,
  Sliders,
  Smartphone,
  Eye,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

type TabType = "content" | "style" | "layout" | "responsive" | "states" | "motion" | "accessibility";

export function ShallowInspectors({ node, onChangeNode }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const props = node.props || {};
  const styles = node.styles?.base || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, [key]: value },
    });
  };

  const updateStyle = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      styles: {
        ...node.styles,
        base: { ...(node.styles?.base || {}), [key]: value },
      },
    });
  };

  const renderTabsHeader = (tabs: TabType[]) => (
    <div className="flex border-b border-slate-800 bg-slate-950 px-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={cn(
            "px-3 py-2 text-[11px] font-bold capitalize transition border-b-2",
            activeTab === tab
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  switch (node.component) {
    case "text":
      return (
        <div className="text-xs text-slate-300">
          {renderTabsHeader(["content", "style", "layout", "responsive", "accessibility"])}
          <div className="p-4 space-y-4">
            {activeTab === "content" && (
              <>
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-400" /> Typography Content
                </label>
                <div>
                  <span className="text-[11px] text-slate-400">Text Content</span>
                  <textarea
                    rows={3}
                    value={(props.content as string) || ""}
                    onChange={(e) => updateProp("content", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">HTML Tag</span>
                  <select
                    value={(props.tag as string) || "p"}
                    onChange={(e) => updateProp("tag", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  >
                    <option value="h1">H1 Heading</option>
                    <option value="h2">H2 Subheading</option>
                    <option value="h3">H3 Section Title</option>
                    <option value="p">Paragraph (p)</option>
                    <option value="span">Inline (span)</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === "style" && (
              <>
                <div>
                  <span className="text-[11px] text-slate-400">Font Size</span>
                  <input
                    type="text"
                    value={(styles.fontSize as string) || "1rem"}
                    onChange={(e) => updateStyle("fontSize", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Text Color</span>
                  <input
                    type="text"
                    value={(styles.color as string) || "#ffffff"}
                    onChange={(e) => updateStyle("color", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );

    case "button":
      return (
        <div className="text-xs text-slate-300">
          {renderTabsHeader(["content", "style", "layout", "responsive", "states", "accessibility"])}
          <div className="p-4 space-y-4">
            {activeTab === "content" && (
              <>
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-indigo-400" /> Button Label & Link
                </label>
                <div>
                  <span className="text-[11px] text-slate-400">Button Label</span>
                  <input
                    type="text"
                    value={(props.label as string) || "Click Here"}
                    onChange={(e) => updateProp("label", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Destination URL</span>
                  <input
                    type="text"
                    value={(props.url as string) || "#"}
                    onChange={(e) => updateProp("url", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
              </>
            )}
            {activeTab === "style" && (
              <>
                <div>
                  <span className="text-[11px] text-slate-400">Background Color</span>
                  <input
                    type="text"
                    value={(styles.backgroundColor as string) || "#4f46e5"}
                    onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );

    case "image":
      return (
        <div className="text-xs text-slate-300">
          {renderTabsHeader(["content", "style", "responsive", "accessibility"])}
          <div className="p-4 space-y-4">
            {activeTab === "content" && (
              <>
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Image Source & Alt
                </label>
                <div>
                  <span className="text-[11px] text-slate-400">Image URL</span>
                  <input
                    type="text"
                    value={(props.url as string) || ""}
                    onChange={(e) => updateProp("url", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Alt Text (Accessibility)</span>
                  <input
                    type="text"
                    value={(props.alt as string) || ""}
                    onChange={(e) => updateProp("alt", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );

    case "product-grid":
      return (
        <div className="text-xs text-slate-300">
          {renderTabsHeader(["content", "style", "layout", "responsive"])}
          <div className="p-4 space-y-4">
            {activeTab === "content" && (
              <>
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Product Catalog Data Source
                </label>
                <div>
                  <span className="text-[11px] text-slate-400">Category Filter</span>
                  <select
                    value={(props.category as string) || "all"}
                    onChange={(e) => updateProp("category", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  >
                    <option value="all">All Store Products</option>
                    <option value="featured">Featured Favorites</option>
                    <option value="bestsellers">Bestsellers</option>
                    <option value="new">New Arrivals</option>
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Product Display Limit</span>
                  <input
                    type="number"
                    value={(props.limit as number) || 6}
                    onChange={(e) => updateProp("limit", parseInt(e.target.value) || 6)}
                    className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 text-xs text-slate-400">
          <p className="font-bold text-slate-200 mb-2">Component: {node.component}</p>
          <span className="text-[11px]">Standard property inspector controls available.</span>
        </div>
      );
  }
}
