/**
 * SmartStore Website Studio (CMS V3) — Add Component Visual Library Dialog
 * Visual thumbnail previews, categories, search, AI fill options, and parent-aware insertion
 */

import React, { useState } from "react";
import {
  X,
  Search,
  Sparkles,
  Layout,
  FileText,
  ShoppingBag,
  FormInput,
  MapPin,
  Plus,
  Monitor,
  Smartphone,
  Layers,
  FolderInput,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageNode } from "../types/cms-v3";
import { COMPONENT_REGISTRY } from "../registry";

interface ComponentLibraryItem {
  key: string;
  label: string;
  category: string;
  description: string;
  previewImage?: string;
  supportsAiFill: boolean;
  requiredData?: string;
}

const LIBRARY_ITEMS: ComponentLibraryItem[] = Object.values(COMPONENT_REGISTRY)
  .filter((def) => def.status === "implemented" || def.status === "partial")
  .map((def) => ({
    key: def.key,
    label: def.label,
    category: def.category,
    description: `Configurable ${def.label} component for website studio layout and content`,
    supportsAiFill: true,
    requiredData: def.key === "product-grid" ? "Products" : def.key === "reservation-widget" ? "Floor Tables" : undefined,
  }));

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (componentKey: string, targetParentId?: string, withAiFill?: boolean) => void;
  selectedNode: PageNode | null;
  targetParentId?: string | null;
}

export function AddComponentModal({
  isOpen,
  onClose,
  onSelectComponent,
  selectedNode,
  targetParentId,
}: AddComponentModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("all");
  const [selectedItemKey, setSelectedItemKey] = useState<string>("button");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [aiFillChecked, setAiFillChecked] = useState<boolean>(false);
  const [targetMode, setTargetMode] = useState<"selected" | "root">("selected");

  if (!isOpen) return null;

  const targetNodeName =
    selectedNode?.props?.title ||
    selectedNode?.props?.label ||
    selectedNode?.component ||
    selectedNode?.kind ||
    "Selected Container";

  const isSelectedContainer =
    selectedNode &&
    (selectedNode.kind === "container" ||
      selectedNode.kind === "section" ||
      selectedNode.component === "flex-container" ||
      selectedNode.component === "grid-container");

  const filteredItems = LIBRARY_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "all" ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeItem = LIBRARY_ITEMS.find((item) => item.key === selectedItemKey) || LIBRARY_ITEMS[0];

  const handleInsert = () => {
    const destinationId = targetMode === "selected" ? (selectedNode?.id || undefined) : undefined;
    onSelectComponent(activeItem.key, destinationId, aiFillChecked);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">Component & Element Library</h3>
              <p className="text-[11px] text-slate-400">Select visual building blocks to place into your page</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Insertion Container Banner */}
        {selectedNode && (
          <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FolderInput className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Inserting target:</span>
              <span className="font-bold text-slate-200 capitalize">
                {targetMode === "selected" ? `${targetNodeName} (${selectedNode.component || selectedNode.kind})` : "Page Root"}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setTargetMode("selected")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-semibold transition",
                  targetMode === "selected" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Inside Selected
              </button>
              <button
                onClick={() => setTargetMode("root")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-semibold transition",
                  targetMode === "root" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Page Root
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar: Categories & Search */}
          <div className="w-64 border-r border-slate-800 p-4 space-y-4 shrink-0 overflow-y-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery === "all" ? "" : searchQuery}
                onChange={(e) => setSearchQuery(e.target.value || "all")}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Categories</div>
              {[
                { id: "all", label: "All Components", icon: Layout },
                { id: "layout", label: "Layout & Primitives", icon: Layers },
                { id: "hero", label: "Hero Banners", icon: Sparkles },
                { id: "commerce", label: "Commerce & Catalog", icon: ShoppingBag },
                { id: "content", label: "Content & Story", icon: FileText },
                { id: "forms", label: "Forms & Submissions", icon: FormInput },
                { id: "location", label: "Location & Map", icon: MapPin },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2.5",
                      isActive ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Component Grid */}
          <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isSelected = selectedItemKey === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setSelectedItemKey(item.key)}
                  className={cn(
                    "bg-slate-950 rounded-xl p-4 border transition cursor-pointer flex flex-col justify-between space-y-3",
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20" : "border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">{item.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  {item.requiredData && (
                    <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                      Requires: {item.requiredData}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Preview & Insert Actions */}
          <div className="w-80 border-l border-slate-800 p-6 flex flex-col justify-between shrink-0 bg-slate-950">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-300">Component Preview</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
                  <button
                    onClick={() => setDevicePreview("desktop")}
                    className={cn("p-1 rounded text-slate-400", devicePreview === "desktop" && "bg-indigo-600 text-white")}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDevicePreview("mobile")}
                    className={cn("p-1 rounded text-slate-400", devicePreview === "mobile" && "bg-indigo-600 text-white")}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Visual Thumbnail Simulator */}
              <div
                className={cn(
                  "bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[180px] flex flex-col justify-center items-center text-center space-y-2 transition-all",
                  devicePreview === "mobile" && "max-w-[200px] mx-auto"
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-slate-200">{activeItem.label}</span>
                <p className="text-[11px] text-slate-400 leading-snug">{activeItem.description}</p>
              </div>

              {/* AI Fill Options */}
              {activeItem.supportsAiFill && (
                <label className="flex items-center gap-2 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiFillChecked}
                    onChange={(e) => setAiFillChecked(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600"
                  />
                  <span>Auto-fill initial copy with AI</span>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-2">
              <button
                onClick={handleInsert}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Insert {activeItem.label}</span>
              </button>
              <button onClick={onClose} className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
