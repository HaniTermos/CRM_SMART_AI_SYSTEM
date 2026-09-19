/**
 * SmartStore Website Studio (CMS V3) — Page Settings & SEO Modal
 * Triggered from topbar settings icon
 */

import React, { useState } from "react";
import { X, FileCode, Globe, Palette, Sparkles, Check } from "lucide-react";
import { PageDocument, PageNode } from "../types/cms-v3";
import { cn } from "@/lib/utils";
import { ColorPickerPopover } from "./inspectors/ColorPickerPopover";

interface PageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PageDocument | null;
  onUpdateNode: (updatedNode: PageNode) => void;
  onUpdatePageMeta: (patch: { title?: string; slug?: string }) => void;
}

export function PageSettingsModal({
  isOpen,
  onClose,
  document: doc,
  onUpdateNode,
  onUpdatePageMeta,
}: PageSettingsModalProps) {
  if (!isOpen || !doc) return null;

  const rootNode = doc.nodes[doc.rootNodeId];
  if (!rootNode) return null;

  const title = (rootNode.props?.title as string) || "Home Page";
  const slug = (rootNode.props?.slug as string) || "home";
  const seoDescription = (rootNode.props?.seoDescription as string) || "";
  const bg = (rootNode.styles?.base?.background as string) || (rootNode.styles?.base?.backgroundColor as string) || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-slate-100 text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Page Settings & SEO</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 1. Page Title */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Page Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                onUpdateNode({
                  ...rootNode,
                  props: { ...rootNode.props, title: newTitle },
                });
                onUpdatePageMeta({ title: newTitle });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Home"
            />
          </div>

          {/* 2. Page Slug */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Page URL Slug</span>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-slate-950 border border-r-0 border-slate-800 rounded-l-lg text-slate-500 font-mono text-xs">
                /
              </span>
              <input
                type="text"
                value={slug}
                readOnly
                className="w-full px-3 py-2 rounded-r-lg bg-slate-950/50 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
              />
            </div>
          </div>

          {/* 3. SEO Meta Description */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-300">SEO Meta Description</span>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => {
                onUpdateNode({
                  ...rootNode,
                  props: { ...rootNode.props, seoDescription: e.target.value },
                });
              }}
              placeholder="Brief summary for search engines and social cards..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 4. Page Canvas Background Color */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
            <div>
              <span className="text-[11px] font-medium text-slate-200 block">Page Root Background</span>
              <span className="text-[10px] text-slate-400">Canvas background color</span>
            </div>
            <ColorPickerPopover
              color={bg}
              onChange={(val) => {
                onUpdateNode({
                  ...rootNode,
                  styles: {
                    ...rootNode.styles,
                    base: {
                      ...(rootNode.styles?.base || {}),
                      background: val,
                      backgroundColor: val,
                    },
                  },
                });
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
