/**
 * SmartStore Website Studio (CMS V3) — Navigation Components Inspectors
 */

import React from "react";
import { PageNode, HeaderConfig, FooterConfig, AnnouncementConfig } from "../../types/cms-v3";
import { Layout, Palette, Megaphone, MapPin, AlignLeft, ShieldCheck } from "lucide-react";

interface InspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function HeaderInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const config = (props.config as HeaderConfig) || {};

  const updateConfig = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: {
        ...node.props,
        config: {
          ...(node.props.config as HeaderConfig || {}),
          [key]: value
        }
      }
    });
  };

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, [key]: value }
    });
  };

  return (
    <div className="p-4 space-y-5 text-xs text-slate-300">
      <div className="space-y-2">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-indigo-400" /> Header Layout Variant
        </label>
        <select
          value={config.variant || "logo-left-nav-right"}
          onChange={(e) => updateConfig("variant", e.target.value)}
          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="logo-left-nav-right">Logo Left, Nav Right (Default)</option>
          <option value="logo-left-nav-center">Logo Left, Nav Center</option>
          <option value="centered-logo">Centered Logo</option>
          <option value="transparent-overlay">Transparent Hero Overlay</option>
          <option value="glass-sticky">Glassmorphism Sticky</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" /> Header Branding & Media
        </label>
        <div>
          <span className="text-[11px] text-slate-400">Logo Text</span>
          <input
            type="text"
            value={(props.logoText as string) || "SmartStore"}
            onChange={(e) => updateProp("logoText", e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          />
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Logo Media URL</span>
          <input
            type="text"
            value={(props.logoUrl as string) || ""}
            onChange={(e) => updateProp("logoUrl", e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono text-[11px]"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-bold text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Header Behaviors
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.sticky !== false}
            onChange={(e) => updateConfig("sticky", e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-indigo-600"
          />
          <span>Sticky header on scroll</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.shrinkOnScroll !== false}
            onChange={(e) => updateConfig("shrinkOnScroll", e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-indigo-600"
          />
          <span>Shrink height on scroll</span>
        </label>
      </div>
    </div>
  );
}

export function FooterInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const config = (props.config as FooterConfig) || {};

  const updateConfig = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: {
        ...node.props,
        config: {
          ...(node.props.config as FooterConfig || {}),
          [key]: value
        }
      }
    });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Layout className="w-3.5 h-3.5 text-indigo-400" /> Footer Configuration
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Footer Variant</span>
        <select
          value={config.variant || "multi-column"}
          onChange={(e) => updateConfig("variant", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="multi-column">Multi-Column Links (Default)</option>
          <option value="compact">Compact Minimal</option>
          <option value="dark-luxury">Dark Luxury</option>
        </select>
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Copyright Statement</span>
        <input
          type="text"
          value={(props.copyright as string) || config.copyright || "© 2026 SmartStore AI"}
          onChange={(e) => onChangeNode({ ...node, props: { ...node.props, copyright: e.target.value } })}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}

export function MobileDrawerInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <AlignLeft className="w-3.5 h-3.5 text-indigo-400" /> Mobile Navigation Drawer
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Drawer Position</span>
        <select
          value={(props.position as string) || "right"}
          onChange={(e) => updateProp("position", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="right">Slide Right (Default)</option>
          <option value="left">Slide Left</option>
        </select>
      </div>
    </div>
  );
}

export function AnnouncementBarInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const config = (props.config as AnnouncementConfig) || {};

  const updateConfig = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: {
        ...node.props,
        config: {
          ...(node.props.config as AnnouncementConfig || {}),
          [key]: value
        }
      }
    });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Megaphone className="w-3.5 h-3.5 text-indigo-400" /> Announcement Bar Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Announcement Message</span>
        <textarea
          rows={2}
          value={config.message || (props.message as string) || ""}
          onChange={(e) => updateConfig("message", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Promo Code (1-Click Copy)</span>
        <input
          type="text"
          value={config.promoCode || ""}
          onChange={(e) => updateConfig("promoCode", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
          placeholder="e.g. SAVE20"
        />
      </div>
    </div>
  );
}

export function BreadcrumbsInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Breadcrumbs Settings
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Home Link Label</span>
        <input
          type="text"
          value={(props.homeLabel as string) || "Home"}
          onChange={(e) => updateProp("homeLabel", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}
