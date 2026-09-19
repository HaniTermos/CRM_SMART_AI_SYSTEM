import React from "react";
import { PageNode, PageDocument, ThemeTokens } from "../types/cms-v3";
import { InspectorPanel } from "./InspectorPanel";
import { ElementsDrawer } from "./drag-drop/ElementsDrawer";

interface UnifiedSidebarProps {
  document: PageDocument | null;
  selectedNode: PageNode | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateNode: (updatedNode: PageNode) => void;
  onDuplicateNode: (id: string) => void;
  onRequestDeleteNode: (id: string) => void;
  onInsertElement: (componentKey: string, initialProps?: any, initialStyles?: any) => void;
  onApplyTheme: (theme: Partial<ThemeTokens>) => void;
  onDecomposeNode?: (id: string) => void;
  onUpdatePageMeta: (patch: { title?: string; slug?: string }) => void;
}

export function UnifiedSidebar({
  document: doc,
  selectedNode,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onDuplicateNode,
  onRequestDeleteNode,
  onInsertElement,
  onDecomposeNode,
}: UnifiedSidebarProps) {
  if (!doc) return null;

  return (
    <aside className="w-full bg-[#26292c] border-r border-[#36393f] flex flex-col h-full overflow-hidden text-slate-200 shrink-0 z-20 shadow-2xl">
      {selectedNode ? (
        <InspectorPanel
          node={selectedNode}
          onChangeNode={onUpdateNode}
          onDecomposeNode={onDecomposeNode}
          onBackToElements={() => onSelectNode(null)}
          onDuplicateNode={() => onDuplicateNode(selectedNode.id)}
          onDeleteNode={() => onRequestDeleteNode(selectedNode.id)}
        />
      ) : (
        <ElementsDrawer
          onInsertElement={(key, initialProps, initialStyles) => {
            onInsertElement(key, initialProps, initialStyles);
          }}
        />
      )}
    </aside>
  );
}
