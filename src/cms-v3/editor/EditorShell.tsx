/**
 * SmartStore Website Studio (CMS V3) — Elementor-Grade Visual Page Builder Shell
 * Unified Studio Architecture:
 * - Master Topbar with Hamburger Menu, + Add Widgets, Undo/Redo, Page Dropdown, Device Viewport, AI, Page Settings, Structure, Preview, Publish
 * - Dedicated Left Sidebar (Elements Drawer <-> Edit Element Inspector with Content | Style | Advanced)
 * - Floating Structure / Layers Window
 * - Page Settings & SEO Modal
 * - Real-time Live Canvas
 */

import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Menu,
  Plus,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Settings,
  Layers,
  Eye,
  Globe,
  Loader2,
  CheckCircle2,
  ChevronDown,
  FolderTree,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
} from "lucide-react";
import { RenderContext, AiOperation } from "../types/cms-v3";
import { UniversalRenderer } from "../renderer/UniversalRenderer";
import { UnifiedSidebar } from "./UnifiedSidebar";
import { DragProvider } from "./drag-drop/dragContext";
import { AiDiffModal } from "./AiDiffModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { StructurePanel } from "./StructurePanel";
import { PageSettingsModal } from "./PageSettingsModal";
import { useEditorEngine } from "./useEditorEngine";
import { useEditorKeyboard } from "./useEditorKeyboard";
import { DEFAULT_SYSTEM_THEME_TOKENS, resolveThemeCascade, generateCssVariables } from "../theme/contract";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function EditorShell() {
  return (
    <DragProvider>
      <EditorShellContent />
    </DragProvider>
  );
}

function EditorShellContent() {
  const { pageId } = useParams({ strict: false }) as { pageId?: string };
  const targetPageId = pageId || "sample-hero-page";

  // Device & UI Mode State
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewMode, setPreviewMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [isResizing, setIsResizing] = useState(false);

  // Floating Modals / Windows
  const [structureOpen, setStructureOpen] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);

  // AI Diff Modal State
  const [aiDiffOpen, setAiDiffOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [proposedOperations, setProposedOperations] = useState<AiOperation[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Authoritative State Engine Hook
  const engine = useEditorEngine({ pageId: targetPageId });

  // Handle Resizable Left Sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 280), 460);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Global Ctrl+\ / Cmd+\ shortcut to toggle left sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Global Keyboard Shortcuts
  useEditorKeyboard({
    selectedNodeId: engine.selectedNodeId,
    onDelete: (id) => engine.requestDeleteNode(id),
    onUndo: () => engine.undo(),
    onRedo: () => engine.redo(),
    onCopy: (id) => engine.copyNode(id),
    onPaste: (parentId) => engine.pasteNode(parentId),
    onDuplicate: (id) => engine.duplicateNode(id),
    onDeselect: () => engine.deselectNode(),
    onMoveUp: (id) => engine.moveNode(id, "up"),
    onMoveDown: (id) => engine.moveNode(id, "down"),
  });

  // Browser Navigation Unsaved Changes Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (engine.saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in progress.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [engine.saveStatus]);

  // AI Propose Edits Trigger
  const handleAiPropose = async () => {
    if (!aiPrompt.trim() || !engine.document) return;
    setIsAiThinking(true);
    try {
      const res = await api.post("/cms-v3/me/ai/propose-edits", {
        pageId: targetPageId,
        prompt: aiPrompt,
        targetNodeId: engine.selectedNodeId,
        currentDocument: engine.document,
      });

      if (res.data?.data?.operations) {
        setProposedOperations(res.data.data.operations || []);
        setAiDiffOpen(true);
      }
    } catch (err) {
      console.error("AI proposal failed:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Apply AI Operations to Document
  const handleApplyAiOps = async (selectedOps: AiOperation[]) => {
    if (!engine.document) return;
    try {
      const res = await api.post("/cms-v3/me/ai/apply-operations", {
        document: engine.document,
        operations: selectedOps,
      });

      if (res.data?.data?.document) {
        const appliedDoc = res.data.data.document;
        engine.setDocument(appliedDoc);
        api.post(`/cms-v3/me/pages/${targetPageId}/save-draft`, {
          componentTree: appliedDoc,
          changeSummary: "Applied AI proposed operations",
        });
      }
    } catch (err) {
      console.error("Failed to apply AI operations:", err);
    }
  };

  // Resolve Live Theme Tokens & CSS Variables
  const activeThemeTokens = resolveThemeCascade(
    DEFAULT_SYSTEM_THEME_TOKENS,
    engine.document?.themeOverride
  );
  const themeCssVariables = generateCssVariables(activeThemeTokens);

  const renderContext: RenderContext = {
    mode: previewMode ? "preview" : "editor",
    device,
    direction: "ltr",
    theme: activeThemeTokens,
    preview: previewMode,
  };

  // Calculate Breadcrumb trail
  const breadcrumbs = engine.getBreadcrumbs(engine.selectedNodeId);
  const pageTitle = (engine.document?.nodes?.[engine.document?.rootNodeId]?.props?.title as string) || "Home";

  return (
    <div className="editor-root h-[100dvh] w-screen overflow-hidden bg-[#18191b] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* 1. Elementor Master Header Toolbar (Screenshot 1-5) */}
      <header className="h-12 bg-[#202124] border-b border-[#36393f] px-3 flex items-center justify-between shrink-0 z-30 shadow-sm">
        {/* Left: Hamburger, Add Widgets, History/Undo/Redo, Page Dropdown */}
        <div className="flex items-center gap-2">
          {/* Hamburger / Menu */}
          <Link
            to="/cms-v3/website/pages"
            className="w-8 h-8 rounded-md bg-[#2b2e32] hover:bg-[#35393e] text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Back to Pages list"
          >
            <Menu className="w-4 h-4" />
          </Link>

          {/* Components catalog */}
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(true);
              engine.deselectNode();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2b2e32] hover:bg-[#35393e] text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Open Components panel"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Components</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={() => engine.undo()}
              disabled={!engine.canUndo}
              className="p-1.5 rounded hover:bg-[#35393e] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => engine.redo()}
              disabled={!engine.canRedo}
              className="p-1.5 rounded hover:bg-[#35393e] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#36393f] mx-1" />

          {/* Page Dropdown Selector */}
          <button
            type="button"
            onClick={() => setPageSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2b2e32] hover:bg-[#35393e] text-xs font-semibold text-white transition border border-[#36393f]"
          >
            <span>{pageTitle}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Save status badge */}
          {engine.saveStatus === "saving" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1 border border-amber-500/30">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving
            </span>
          )}
          {engine.saveStatus === "saved" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        {/* Center: Device Viewport Switcher (Screenshots 1-5) */}
        <div className="flex items-center gap-1 bg-[#18191b] p-0.5 rounded-lg border border-[#36393f]">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1",
              device === "desktop" ? "bg-[#35393e] text-white shadow-xs font-bold" : "text-slate-400 hover:text-slate-200"
            )}
            title="Desktop View (All Screens)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1",
              device === "tablet" ? "bg-[#35393e] text-white shadow-xs font-bold" : "text-slate-400 hover:text-slate-200"
            )}
            title="Tablet View (≤ 1024px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1",
              device === "mobile" ? "bg-[#35393e] text-white shadow-xs font-bold" : "text-slate-400 hover:text-slate-200"
            )}
            title="Mobile View (≤ 767px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: AI Assistant, Page Settings Icon, Structure Icon, Preview, Elementor Publish Button */}
        <div className="flex items-center gap-1.5">
          {/* AI Assistant */}
          <button
            type="button"
            onClick={() => setAiDiffOpen(true)}
            className="p-1.5 rounded-md hover:bg-[#35393e] text-slate-300 hover:text-white transition"
            title="AI Page Assistant"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Page Settings Icon (Opens Page Settings Modal) */}
          <button
            type="button"
            onClick={() => setPageSettingsOpen(true)}
            className={cn(
              "p-1.5 rounded-md transition",
              pageSettingsOpen
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                : "hover:bg-[#35393e] text-slate-300 hover:text-white"
            )}
            title="Page Settings & SEO"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Structure / Layers Icon (Opens Floating Structure Panel) */}
          <button
            type="button"
            onClick={() => setStructureOpen(!structureOpen)}
            className={cn(
              "p-1.5 rounded-md transition",
              structureOpen
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                : "hover:bg-[#35393e] text-slate-300 hover:text-white"
            )}
            title="Structure / Layers Tree"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              "p-1.5 rounded-md transition",
              previewMode
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "hover:bg-[#35393e] text-slate-300 hover:text-white"
            )}
            title={previewMode ? "Exit Preview Mode" : "Preview Canvas"}
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#36393f] mx-1" />

          {/* Elementor Publish Button (Magenta / Pink #E22866) */}
          <button
            type="button"
            onClick={() => engine.publish()}
            disabled={engine.isPublishing}
            className="px-4 py-1.5 rounded-md bg-[#e22866] hover:bg-[#c91e56] text-white text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            {engine.isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* 2. Interactive Breadcrumb Path Bar */}
      <div className="h-7 bg-[#202124]/90 border-b border-[#36393f] px-3 flex items-center justify-between text-xs shrink-0 z-20">
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-0.5">
          <span className="text-slate-500 flex items-center gap-1">
            <FolderTree className="w-3 h-3 text-slate-500" /> Page
          </span>

          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                type="button"
                onClick={() => engine.selectNode(b.id)}
                className={cn(
                  "px-1.5 py-0.2 rounded transition capitalize font-medium shrink-0",
                  idx === breadcrumbs.length - 1
                    ? "bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#2b2e32]"
                )}
              >
                {b.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
          title="Toggle Sidebar (Ctrl+\)"
        >
          {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. Editor Body: Left Unified Sidebar + Resizer Handle + Center Visual Canvas */}
      <div className="editor-body min-h-0 flex-1 flex transition-all duration-200 overflow-hidden relative">
        {/* Left Master Builder Sidebar */}
        {sidebarOpen && (
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full shrink-0 flex flex-col min-h-0 z-20"
          >
            <UnifiedSidebar
              document={engine.document}
              selectedNode={engine.selectedNode}
              selectedNodeId={engine.selectedNodeId}
              onSelectNode={(id) => engine.selectNode(id)}
              onUpdateNode={(updatedNode) => engine.updateNode(updatedNode)}
              onDuplicateNode={(id) => engine.duplicateNode(id)}
              onRequestDeleteNode={(id) => engine.requestDeleteNode(id)}
              onInsertElement={(key, initialProps, initialStyles) => {
                engine.insertNode(key, undefined, undefined, initialProps, initialStyles);
              }}
              onApplyTheme={(theme) => engine.applyThemeTokens(theme)}
              onDecomposeNode={(id) => engine.decomposeSectionNode(id)}
              onUpdatePageMeta={(patch) => {
                if (engine.document?.rootNodeId) {
                  engine.updateNodeProps(engine.document.rootNodeId, patch);
                }
              }}
            />
          </div>
        )}

        {/* Resizer Divider Handle */}
        {sidebarOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            className={cn(
              "w-1 hover:w-1.5 bg-[#36393f] hover:bg-indigo-500 cursor-col-resize shrink-0 transition-colors z-20",
              isResizing && "w-1.5 bg-indigo-500 shadow-[0_0_8px_#6366f1]"
            )}
            title="Drag to resize sidebar (280px - 460px)"
          />
        )}

        {/* Center Canvas Workspace */}
        <main className="editor-canvas flex-1 relative bg-[#18191b] flex flex-col items-center min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-6 pb-32">
          {/* AI Prompt Input Bar */}
          <div className="w-full max-w-5xl mb-4 bg-[#202124] border border-[#36393f] rounded-xl p-2.5 flex items-center gap-2 shadow-md">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Ask AI to design section, rewrite copy, add cards, or customize styles..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiPropose()}
              className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAiPropose}
              disabled={isAiThinking || !aiPrompt.trim()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate</span>
            </button>
          </div>

          {/* Canvas Render Frame with Dynamic Brand CSS Variables */}
          <div
            style={themeCssVariables as React.CSSProperties}
            className={cn(
              "bg-white text-slate-900 rounded-lg shadow-2xl transition-all duration-300 relative border border-[#36393f] min-h-[600px] font-sans",
              device === "desktop" && "w-full max-w-5xl",
              device === "tablet" && "w-[768px]",
              device === "mobile" && "w-[375px]"
            )}
          >
            {engine.document?.rootNodeId && (
              <UniversalRenderer
                nodeId={engine.document.rootNodeId}
                document={engine.document}
                context={renderContext}
                onSelectNode={(id) => engine.selectNode(id)}
                selectedNodeId={engine.selectedNodeId}
                hoveredNodeId={engine.hoveredNodeId}
                onHoverNode={(id) => engine.setHoveredNode(id)}
                onDeleteNode={(id) => engine.requestDeleteNode(id)}
                onDuplicateNode={(id) => engine.duplicateNode(id)}
                onMoveNodeUp={(id) => engine.moveNode(id, "up")}
                onMoveNodeDown={(id) => engine.moveNode(id, "down")}
                onSelectParent={(id) => {
                  const parentId = engine.getParentId(id);
                  if (parentId) engine.selectNode(parentId);
                }}
                onAddChild={(id) => {
                  engine.selectNode(id);
                }}
                onUpdateTextContent={(id, text) => {
                  engine.updateNodeProps(id, { content: text, label: text, title: text });
                }}
                onDropNode={(item, targetId, pos) => {
                  engine.handleDropItem(item, targetId, pos);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Structure Panel */}
      <StructurePanel
        isOpen={structureOpen}
        onClose={() => setStructureOpen(false)}
        document={engine.document}
        selectedNodeId={engine.selectedNodeId}
        hoveredNodeId={engine.hoveredNodeId}
        expandedNodes={engine.expandedNodes}
        onSelectNode={(id) => engine.selectNode(id)}
        onHoverNode={(id) => engine.setHoveredNode(id)}
        onToggleExpand={(id) => engine.toggleNodeExpanded(id)}
        onDuplicateNode={(id) => engine.duplicateNode(id)}
        onRequestDeleteNode={(id) => engine.requestDeleteNode(id)}
        activeDevice={device}
      />

      {/* Page Settings & SEO Modal */}
      <PageSettingsModal
        isOpen={pageSettingsOpen}
        onClose={() => setPageSettingsOpen(false)}
        document={engine.document}
        onUpdateNode={(updatedNode) => engine.updateNode(updatedNode)}
        onUpdatePageMeta={(patch) => {
          if (engine.document?.rootNodeId) {
            engine.updateNodeProps(engine.document.rootNodeId, patch);
          }
        }}
      />

      {/* AI Diff Review Modal */}
      <AiDiffModal
        isOpen={aiDiffOpen}
        onClose={() => setAiDiffOpen(false)}
        prompt={aiPrompt}
        operations={proposedOperations}
        onApplyOperations={handleApplyAiOps}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!engine.pendingDeleteNodeId}
        node={engine.pendingDeleteNodeId && engine.document?.nodes ? engine.document.nodes[engine.pendingDeleteNodeId] || null : null}
        descendantCount={engine.pendingDeleteNodeId ? engine.getNodeChildrenCount(engine.pendingDeleteNodeId) : 0}
        onConfirm={() => {
          if (engine.pendingDeleteNodeId) {
            engine.executeDeleteNode(engine.pendingDeleteNodeId);
          }
        }}
        onCancel={() => engine.setPendingDeleteNodeId(null)}
      />
    </div>
  );
}
