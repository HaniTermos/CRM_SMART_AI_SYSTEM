/**
 * SmartStore Website Studio (CMS V3) — Stage 5 Marketing & Media Inspectors
 */

import React from "react";
import { PageNode, VideoConfig, PopupConfig, CountdownConfig } from "../../types/cms-v3";
import { Video, Type, Megaphone, Clock, Mail, Star, Image as ImageIcon } from "lucide-react";

interface InspectorProps {
  node: PageNode;
  onChangeNode: (updatedNode: PageNode) => void;
}

export function VideoInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const config = (props.config as VideoConfig) || {};

  const updateConfig = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, config: { ...(node.props.config as VideoConfig || {}), [key]: value } },
    });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Video className="w-3.5 h-3.5 text-indigo-400" /> Video Player Settings
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Video URL (YouTube, Vimeo, MP4)</span>
        <input
          type="text"
          value={config.videoUrl || (props.url as string) || ""}
          onChange={(e) => updateConfig("videoUrl", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Poster Cover Image URL</span>
        <input
          type="text"
          value={config.posterImageUrl || ""}
          onChange={(e) => updateConfig("posterImageUrl", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
        />
      </div>
    </div>
  );
}

export function RichTextInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Type className="w-3.5 h-3.5 text-indigo-400" /> Rich Text HTML Editor
      </label>
      <div>
        <span className="text-[11px] text-slate-400">HTML Content (Sanitized)</span>
        <textarea
          rows={6}
          value={(props.content as string) || (props.html as string) || ""}
          onChange={(e) => updateProp("content", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono resize-y"
        />
      </div>
    </div>
  );
}

export function PopupInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const config = (props.config as PopupConfig) || {};

  const updateConfig = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, config: { ...(node.props.config as PopupConfig || {}), [key]: value } },
    });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Megaphone className="w-3.5 h-3.5 text-indigo-400" /> Popup Lead Capture Settings
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Popup Title</span>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => updateConfig("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Trigger Type</span>
        <select
          value={config.triggerType || "time_delay"}
          onChange={(e) => updateConfig("triggerType", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="time_delay">Time Delay (Seconds)</option>
          <option value="exit_intent">Exit Intent (Mouse Leave)</option>
          <option value="scroll_depth">Scroll Depth (%)</option>
        </select>
      </div>
    </div>
  );
}

export function CountdownInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const config = (props.config as CountdownConfig) || {};

  const updateConfig = (key: string, value: unknown) => {
    onChangeNode({
      ...node,
      props: { ...node.props, config: { ...(node.props.config as CountdownConfig || {}), [key]: value } },
    });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Countdown Timer Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Target End Timestamp (ISO Date)</span>
        <input
          type="text"
          value={config.targetDate || ""}
          onChange={(e) => updateConfig("targetDate", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
        />
      </div>
    </div>
  );
}

export function NewsletterInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-indigo-400" /> Newsletter Form Settings
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Heading Title</span>
        <input
          type="text"
          value={(props.title as string) || "Subscribe to Our Updates"}
          onChange={(e) => updateProp("title", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
    </div>
  );
}

export function ReviewCarouselInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-indigo-400" /> Review Slider Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Source</span>
        <select
          value={(props.source as string) || "manual"}
          onChange={(e) => updateProp("source", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="manual">Manual Reviews</option>
          <option value="approved">Approved Store Reviews</option>
        </select>
      </div>
    </div>
  );
}

export function MasonryGalleryInspector({ node, onChangeNode }: InspectorProps) {
  const props = node.props || {};
  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Masonry Photo Gallery Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Columns Layout</span>
        <select
          value={(props.columns as string) || "responsive"}
          onChange={(e) => updateProp("columns", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="responsive">Responsive Auto Grid</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </select>
      </div>
    </div>
  );
}
