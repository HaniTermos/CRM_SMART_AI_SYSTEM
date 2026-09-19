/**
 * SmartStore Website Studio (CMS V3) — Dual Experience Master Inspector Panel
 * Features:
 * - Experience Switcher: ✨ Simple Mode (for business users) vs ⚡ Expert Mode (for designers/devs)
 * - Simple Mode: Fast copy editing, visual presets, zero-code styling, glassmorphism presets
 * - Expert Mode: Granular 3-tab inspector (Content, Style, Advanced) with pixel-level control
 */

import React, { useState } from "react";
import { PageNode } from "../types/cms-v3";
import {
  FileEdit,
  Palette,
  Settings,
  Sparkles,
  LayoutGrid,
  Copy,
  Trash2,
  Zap,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceBreakpoint } from "./inspectors/ResponsiveControl";
import { SimpleModeInspector } from "./inspectors/SimpleModeInspector";

// Shared Inspector Tabs
import { LayoutTab } from "./inspectors/LayoutTab";
import { StyleTab } from "./inspectors/StyleTab";
import { AdvancedTab } from "./inspectors/AdvancedTab";

// Dedicated Component Content Inspectors
import { HeroInspector } from "./HeroInspector";
import { FlexContainerInspector, GridContainerInspector } from "./inspectors/FlexContainerInspector";
import {
  TextInspector,
  ButtonInspector,
  ImageInspector,
  IconInspector,
  DividerInspector,
  SpacerInspector,
} from "./inspectors/AtomInspectors";
import {
  ProductGridInspector,
  StoryAboutInspector,
  FaqAccordionInspector,
  TestimonialsInspector,
  ContactFormInspector,
  LocationMapInspector,
  ReservationWidgetInspector,
} from "./inspectors/SectionInspectors";
import {
  HeaderInspector,
  FooterInspector,
  MobileDrawerInspector,
  AnnouncementBarInspector,
  BreadcrumbsInspector,
} from "./inspectors/NavigationInspectors";
import {
  VideoInspector,
  RichTextInspector,
  PopupInspector,
  CountdownInspector,
  NewsletterInspector,
  ReviewCarouselInspector,
  MasonryGalleryInspector,
} from "./inspectors/MarketingInspectors";
import { ShallowInspectors } from "./inspectors/ShallowInspectors";
import { CollectionListInspector } from "../registry/collections/CollectionListSection";
import { CartDrawerInspector } from "../registry/commerce/CartDrawerSection";
import { ProductSpotlightInspector } from "../registry/commerce/ProductSpotlightSection";
import { DietaryFiltersInspector } from "../registry/commerce/DietaryFiltersSection";

type InspectorSubTab = "content" | "style" | "advanced";

interface InspectorPanelProps {
  node: PageNode | null;
  onChangeNode: (updatedNode: PageNode) => void;
  onDecomposeNode?: (id: string) => void;
  onBackToElements?: () => void;
  onDuplicateNode?: () => void;
  onDeleteNode?: () => void;
}

export function InspectorPanel({
  node,
  onChangeNode,
  onDecomposeNode,
  onBackToElements,
  onDuplicateNode,
  onDeleteNode,
}: InspectorPanelProps) {
  if (!node) return null;

  const [editorMode, setEditorMode] = useState<"simple" | "expert">("simple");
  const [activeSubTab, setActiveSubTab] = useState<InspectorSubTab>("content");
  const [activeDevice, setActiveDevice] = useState<DeviceBreakpoint>("desktop");

  const nodeTitle =
    (node.props?.title as string) ||
    (node.props?.label as string) ||
    (node.props?.content as string) ||
    node.component ||
    node.kind;

  // Render Component Specific Content Tab
  const renderContentTab = () => {
    switch (node.component) {
      case "hero":
        return <HeroInspector node={node} onChangeNode={onChangeNode} onDecomposeNode={onDecomposeNode} />;
      case "flex-container":
      case "section":
        return <FlexContainerInspector node={node} onChangeNode={onChangeNode} />;
      case "grid-container":
        return <GridContainerInspector node={node} onChangeNode={onChangeNode} />;
      case "text":
        return <TextInspector node={node} onChangeNode={onChangeNode} />;
      case "button":
        return <ButtonInspector node={node} onChangeNode={onChangeNode} />;
      case "image":
        return <ImageInspector node={node} onChangeNode={onChangeNode} />;
      case "icon":
        return <IconInspector node={node} onChangeNode={onChangeNode} />;
      case "divider":
        return <DividerInspector node={node} onChangeNode={onChangeNode} />;
      case "spacer":
        return <SpacerInspector node={node} onChangeNode={onChangeNode} />;
      case "product-grid":
        return <ProductGridInspector node={node} onChangeNode={onChangeNode} />;
      case "story-about":
        return <StoryAboutInspector node={node} onChangeNode={onChangeNode} onDecomposeNode={onDecomposeNode} />;
      case "faq-accordion":
        return <FaqAccordionInspector node={node} onChangeNode={onChangeNode} />;
      case "testimonials":
        return <TestimonialsInspector node={node} onChangeNode={onChangeNode} />;
      case "contact-form":
        return <ContactFormInspector node={node} onChangeNode={onChangeNode} />;
      case "location-map":
        return <LocationMapInspector node={node} onChangeNode={onChangeNode} />;
      case "reservation-widget":
        return <ReservationWidgetInspector node={node} onChangeNode={onChangeNode} />;
      case "header":
        return <HeaderInspector node={node} onChangeNode={onChangeNode} />;
      case "footer":
        return <FooterInspector node={node} onChangeNode={onChangeNode} />;
      case "mobile-drawer":
        return <MobileDrawerInspector node={node} onChangeNode={onChangeNode} />;
      case "announcement-bar":
        return <AnnouncementBarInspector node={node} onChangeNode={onChangeNode} />;
      case "breadcrumbs":
        return <BreadcrumbsInspector node={node} onChangeNode={onChangeNode} />;
      case "video":
        return <VideoInspector node={node} onChangeNode={onChangeNode} />;
      case "rich-text":
        return <RichTextInspector node={node} onChangeNode={onChangeNode} />;
      case "popup-modal":
        return <PopupInspector node={node} onChangeNode={onChangeNode} />;
      case "countdown":
        return <CountdownInspector node={node} onChangeNode={onChangeNode} />;
      case "newsletter":
        return <NewsletterInspector node={node} onChangeNode={onChangeNode} />;
      case "review-carousel":
        return <ReviewCarouselInspector node={node} onChangeNode={onChangeNode} />;
      case "masonry-gallery":
        return <MasonryGalleryInspector node={node} onChangeNode={onChangeNode} />;
      case "collection-list":
        return <CollectionListInspector node={node} onChangeNode={onChangeNode} />;
      case "cart-drawer":
        return <CartDrawerInspector node={node} onChangeNode={onChangeNode} />;
      case "product-spotlight":
        return <ProductSpotlightInspector node={node} onChangeNode={onChangeNode} />;
      case "dietary-filters":
        return <DietaryFiltersInspector node={node} onChangeNode={onChangeNode} />;
      case "page":
        return (
          <div className="p-4 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-slate-200">Page Root Properties</div>
            <p>Title: {(node.props.title as string) || "Untitled Page"}</p>
          </div>
        );
      default:
        return <ShallowInspectors node={node} onChangeNode={onChangeNode} />;
    }
  };

  const expertTabs = [
    { id: "content" as const, label: "Content", icon: FileEdit },
    { id: "style" as const, label: "Style", icon: Palette },
    { id: "advanced" as const, label: "Advanced", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1e2024]/95 backdrop-blur-xl text-slate-200">
      {/* 1. Header: Component Title + Simple/Expert Mode Switcher + Actions */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
            {node.component ? node.component.slice(0, 2) : "EL"}
          </div>
          <h4 className="font-bold text-xs text-white truncate capitalize">
            {nodeTitle}
          </h4>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Duplicate Button */}
          {onDuplicateNode && (
            <button
              type="button"
              onClick={onDuplicateNode}
              className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition"
              title="Duplicate Element (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Button */}
          {onDeleteNode && (
            <button
              type="button"
              onClick={onDeleteNode}
              className="p-1.5 rounded-lg hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition"
              title="Delete Element (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Back to Widgets Catalog */}
          {onBackToElements && (
            <button
              type="button"
              onClick={onBackToElements}
              className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition ml-1"
              title="Back to Widgets Catalog"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Glassmorphic Mode Switcher Pill (Simple vs Expert) */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Experience Mode
        </span>

        <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-750 shadow-inner">
          <button
            type="button"
            onClick={() => setEditorMode("simple")}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1",
              editorMode === "simple"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Simple</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode("expert")}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1",
              editorMode === "expert"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Zap className="w-3 h-3 text-cyan-300" />
            <span>Expert</span>
          </button>
        </div>
      </div>

      {/* 3. Expert Mode Tabs (Only visible when Expert mode is active) */}
      {editorMode === "expert" && (
        <div className="grid grid-cols-3 bg-slate-950/60 border-b border-slate-800/80 text-center shrink-0">
          {expertTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as InspectorSubTab)}
                className={cn(
                  "py-2 flex flex-col items-center justify-center gap-1 transition text-[11px] font-semibold border-b-2",
                  isActive
                    ? "border-indigo-500 text-white font-bold bg-slate-900/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Tab Content Body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3">
        {editorMode === "simple" ? (
          <SimpleModeInspector
            node={node}
            onChangeNode={onChangeNode}
            activeDevice={activeDevice}
            onSelectDevice={setActiveDevice}
          />
        ) : (
          <>
            {activeSubTab === "content" && renderContentTab()}
            {activeSubTab === "style" && <StyleTab node={node} onChangeNode={onChangeNode} />}
            {activeSubTab === "advanced" && <AdvancedTab node={node} onChangeNode={onChangeNode} />}
          </>
        )}
      </div>
    </div>
  );
}
