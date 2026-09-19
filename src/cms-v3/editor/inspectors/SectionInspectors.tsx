/**
 * SmartStore Website Studio (CMS V3) — Section Component Inspectors
 */

import React from "react";
import { PageNode } from "../../types/cms-v3";
import { ShoppingBag, BookOpen, HelpCircle, Star, Mail, MapPin, Calendar, Layers, Sparkles } from "lucide-react";

interface InspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
  onDecomposeNode?: (id: string) => void;
}

export function ProductGridInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Product Catalog Grid Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Section Title</span>
        <input
          type="text"
          value={(props.title as string) || ""}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Columns Count</span>
        <select
          value={Number(props.columns) || 3}
          onChange={(e) => updateProp("columns", Number(e.target.value))}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns (Default)</option>
          <option value={4}>4 Columns</option>
        </select>
      </div>
    </div>
  );
}

export function StoryAboutInspector({ node, onChangeNode, onDecomposeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-3.5 space-y-3.5 text-xs text-slate-300">
      {/* 1-Click Modular Decomposition Card */}
      {onDecomposeNode && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modular Editable Elements</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Convert this section into individual editable components (Heading, Text, Image) to edit each one independently on the canvas.
          </p>
          <button
            onClick={() => onDecomposeNode(node.id)}
            className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3 h-3" />
            <span>Decompose to Editable Elements</span>
          </button>
        </div>
      )}

      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Story / About Section Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Eyebrow</span>
        <input
          type="text"
          value={(props.eyebrow as string) || ""}
          onChange={(e) => updateProp("eyebrow", e.target.value)}
          className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Title</span>
        <input
          type="text"
          value={(props.title as string) || ""}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Narrative Story</span>
        <textarea
          rows={3}
          value={(props.story as string) || ""}
          onChange={(e) => updateProp("story", e.target.value)}
          className="w-full mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
        />
      </div>
    </div>
  );
}

export function FaqAccordionInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> FAQ Accordion Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Section Title</span>
        <input
          type="text"
          value={(props.title as string) || ""}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}

export function TestimonialsInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-indigo-400" /> Testimonials Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Section Title</span>
        <input
          type="text"
          value={(props.title as string) || ""}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}

export function ContactFormInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-indigo-400" /> Contact Form Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Form Title</span>
        <input
          type="text"
          value={(props.title as string) || ""}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}

export function LocationMapInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Location & Map Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Address Line</span>
        <input
          type="text"
          value={(props.address as string) || ""}
          onChange={(e) => updateProp("address", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Opening Hours Text</span>
        <input
          type="text"
          value={(props.hours as string) || ""}
          onChange={(e) => updateProp("hours", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}

export function ReservationWidgetInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Table Reservation Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Widget Title</span>
        <input
          type="text"
          value={(props.title as string) || ""}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}
