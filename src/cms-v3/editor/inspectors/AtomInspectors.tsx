/**
 * SmartStore Website Studio (CMS V3) — Core Primitives & Atom Inspectors
 * Elementor-grade Content tab inspectors for Text, Heading, Button, Image, Icon, Divider, Spacer
 */

import React, { useState } from "react";
import { PageNode } from "../../types/cms-v3";
import {
  Type,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Minus,
  ArrowUpDown,
  ChevronDown,
  ExternalLink,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaPickerModal } from "./MediaPickerModal";

interface InspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function TextInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, [key]: value },
    });
  };

  const titleContent = (props.title as string) || (props.content as string) || (props.label as string) || "";

  return (
    <div className="p-3 space-y-3 text-xs text-slate-300">
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Heading / Text Content
          </span>
        </div>

        <div className="p-3 space-y-3.5">
          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300">Title</span>
              <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Edit with AI
              </span>
            </div>
            <textarea
              rows={3}
              value={titleContent}
              onChange={(e) => {
                updateProp("title", e.target.value);
                updateProp("content", e.target.value);
              }}
              placeholder="Enter your title here..."
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Link */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300">Link</span>
              <Settings className="w-3 h-3 text-slate-500" />
            </div>
            <input
              type="text"
              value={(props.url as string) || ""}
              onChange={(e) => updateProp("url", e.target.value)}
              placeholder="Paste URL or type link..."
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* HTML Tag */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
            <span className="text-[11px] font-medium text-slate-300">HTML Tag</span>
            <select
              value={(props.tag as string) || "h2"}
              onChange={(e) => updateProp("tag", e.target.value)}
              className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none uppercase font-mono"
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
              <option value="p">p</option>
              <option value="span">span</option>
              <option value="div">div</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ButtonInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, [key]: value },
    });
  };

  return (
    <div className="p-3 space-y-3 text-xs text-slate-300">
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Button CTA
          </span>
        </div>

        <div className="p-3 space-y-3.5">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Text</span>
            <input
              type="text"
              value={(props.label as string) || (props.content as string) || ""}
              onChange={(e) => {
                updateProp("label", e.target.value);
                updateProp("content", e.target.value);
              }}
              placeholder="Click Here"
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Link</span>
            <input
              type="text"
              value={(props.url as string) || ""}
              onChange={(e) => updateProp("url", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
              placeholder="/menu or https://..."
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
            <span className="text-[11px] text-slate-300">Open in New Window</span>
            <input
              type="checkbox"
              checked={!!props.newTab}
              onChange={(e) => updateProp("newTab", e.target.checked)}
              className="rounded border-slate-700 accent-indigo-600 w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
            <span className="text-[11px] text-slate-300">Type</span>
            <select
              value={node.variant || "primary"}
              onChange={(e) => onChangeNode({ ...node, variant: e.target.value })}
              className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="primary">Default / Solid</option>
              <option value="secondary">Outline</option>
              <option value="ghost">Ghost / Text</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const styles = node.styles?.base || {};
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
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

  const imageUrl = (props.url as string) || (props.src as string) || "";

  return (
    <div className="p-3 space-y-3 text-xs text-slate-300">
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={({ url, alt }) => {
          updateProp("url", url);
          updateProp("src", url);
          if (alt && !(props.alt as string)) updateProp("alt", alt);
        }}
      />

      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Image Content
          </span>
        </div>

        <div className="p-3 space-y-3.5">
          {imageUrl && (
            <div className="rounded-lg overflow-hidden border border-slate-800 aspect-video bg-slate-950">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload or choose from library
          </button>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Image URL</span>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => {
                updateProp("url", e.target.value);
                updateProp("src", e.target.value);
              }}
              placeholder="https://..."
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Alt Text</span>
            <input
              type="text"
              value={(props.alt as string) || ""}
              onChange={(e) => updateProp("alt", e.target.value)}
              placeholder="Image description for SEO"
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-300">Width</span>
              <input
                type="text"
                value={(styles.width as string) || ""}
                onChange={(e) => updateStyle("width", e.target.value || undefined)}
                placeholder="100%"
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-300">Object Fit</span>
              <select
                value={(styles.objectFit as string) || "cover"}
                onChange={(e) => updateStyle("objectFit", e.target.value)}
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
                <option value="scale-down">Scale Down</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IconInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-3 space-y-3 text-xs text-slate-300">
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Icon
          </span>
        </div>

        <div className="p-3 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">Icon Name</span>
            <select
              value={(props.name as string) || "Sparkles"}
              onChange={(e) => updateProp("name", e.target.value)}
              className="w-36 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
            >
              <option value="Sparkles">Sparkles</option>
              <option value="Star">Star</option>
              <option value="Heart">Heart</option>
              <option value="ShoppingBag">ShoppingBag</option>
              <option value="Check">Check</option>
              <option value="ArrowRight">ArrowRight</option>
              <option value="Shield">Shield</option>
              <option value="Zap">Zap</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DividerInspector({ node, onChangeNode }: InspectorProps) {
  const styles = node.styles?.base || {};
  return (
    <div className="p-3 space-y-3 text-xs text-slate-300">
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Divider Style
          </span>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">Style</span>
            <select
              value={(styles.borderStyle as string) || "solid"}
              onChange={(e) =>
                onChangeNode({
                  ...node,
                  styles: { ...node.styles, base: { ...styles, borderStyle: e.target.value } },
                })
              }
              className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SpacerInspector({ node, onChangeNode }: InspectorProps) {
  const styles = node.styles?.base || {};
  return (
    <div className="p-3 space-y-3 text-xs text-slate-300">
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="px-3 py-2 bg-slate-900 flex items-center justify-between font-bold text-xs text-slate-200 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Spacer Space
          </span>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">Height</span>
            <input
              type="text"
              value={(styles.height as string) || "3rem"}
              onChange={(e) =>
                onChangeNode({
                  ...node,
                  styles: { ...node.styles, base: { ...styles, height: e.target.value } },
                })
              }
              className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
