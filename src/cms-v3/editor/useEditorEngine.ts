/**
 * SmartStore Website Studio (CMS V3) — Authoritative Editor State & History Engine
 * Provides undo/redo stack, selection, clipboard, parent-aware insertion, drag-and-drop reordering,
 * hierarchy traversal, brand theme tokens, smart deletion selection fallback, and race-protected autosave.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { PageDocument, PageNode, ThemeTokens } from "../types/cms-v3";
import { DraggedItem, DropPosition } from "./drag-drop/dragContext";
import { generateModularSection, normalizeDocumentToModularAST } from "./modularSectionEngine";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface BreadcrumbItem {
  id: string;
  label: string;
  component: string;
  kind: string;
}

export interface UseEditorEngineOptions {
  pageId: string;
}

export function useEditorEngine({ pageId }: UseEditorEngineOptions) {
  // Document State
  const [document, setDocument] = useState<PageDocument | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // History Stacks (capped at 50)
  const undoStackRef = useRef<PageDocument[]>([]);
  const redoStackRef = useRef<PageDocument[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Clipboard (node subtree snapshot)
  const clipboardRef = useRef<{ node: PageNode; descendants: Record<string, PageNode> } | null>(null);

  // Persistence & Publication State
  const [saveStatus, setSaveStatus] = useState<"clean" | "saving" | "saved" | "error">("clean");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedVersionNumber, setPublishedVersionNumber] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Race-condition guard for autosave
  const saveVersionRef = useRef(0);

  // Delete Confirmation State
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);

  // Autosave Timer
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update Undo/Redo state flags
  const updateHistoryFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  // Push current document snapshot to undo stack
  const pushToHistory = useCallback((currentDoc: PageDocument) => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(currentDoc)));
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = []; // clear redo on new action
    updateHistoryFlags();
  }, [updateHistoryFlags]);

  // Schedule autosave to backend API with race-protection
  const scheduleAutosave = useCallback((docToSave: PageDocument, changeSummary = "Visual editor edit") => {
    setSaveStatus("saving");
    const currentVersion = ++saveVersionRef.current;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.post(`/cms-v3/me/pages/${pageId}/save-draft`, {
          componentTree: docToSave,
          changeSummary,
        });

        // Only update status if no newer saves have been triggered since this request started
        if (saveVersionRef.current === currentVersion) {
          if (res.data?.success) {
            setSaveStatus("saved");
            setTimeout(() => {
              if (saveVersionRef.current === currentVersion) {
                setSaveStatus("clean");
              }
            }, 2000);
          } else {
            setSaveStatus("error");
          }
        }
      } catch (err) {
        console.error("Autosave draft failed:", err);
        if (saveVersionRef.current === currentVersion) {
          setSaveStatus("error");
        }
      }
    }, 800);
  }, [pageId]);

  // Load initial page document
  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await api.get(`/cms-v3/me/pages/${pageId}`);
        if (res.data?.data?.draftVersion?.component_tree) {
          const rawDoc = res.data.data.draftVersion.component_tree;
          const doc = normalizeDocumentToModularAST(rawDoc);
          setDocument(doc);
          setIsPublished(res.data.data.page?.is_published || false);
          // Expand root and top-level sections by default
          if (doc.rootNodeId && doc.nodes[doc.rootNodeId]) {
            const initialExpanded: Record<string, boolean> = { [doc.rootNodeId]: true };
            (doc.nodes[doc.rootNodeId].children || []).forEach((cId: string) => {
              initialExpanded[cId] = true;
            });
            setExpandedNodes(initialExpanded);
            // Select first child or root
            if (doc.nodes[doc.rootNodeId].children?.length > 0) {
              setSelectedNodeId(doc.nodes[doc.rootNodeId].children[0]);
            } else {
              setSelectedNodeId(doc.rootNodeId);
            }
          }
          return;
        }

        // Initialize staging hero test page if missing
        const initRes = await api.post("/cms-v3/me/staging/init-hero-test");
        if (initRes.data?.data?.draftVersion?.component_tree) {
          const rawDoc = initRes.data.data.draftVersion.component_tree;
          const doc = normalizeDocumentToModularAST(rawDoc);
          setDocument(doc);
          if (doc.rootNodeId && doc.nodes[doc.rootNodeId]) {
            setSelectedNodeId(doc.nodes[doc.rootNodeId].children?.[0] || doc.rootNodeId);
          }
        }
      } catch (err) {
        console.error("Failed to load document in editor engine:", err);
      }
    }
    loadDoc();
  }, [pageId]);

  // Helper: Find parent node ID of a given node
  const getParentId = useCallback((nodeId: string): string | null => {
    if (!document || !document.nodes) return null;
    for (const [pId, pNode] of Object.entries(document.nodes)) {
      if (pNode.children && pNode.children.includes(nodeId)) {
        return pId;
      }
    }
    return null;
  }, [document]);

  // Helper: Calculate full breadcrumb path from root to target node
  const getBreadcrumbs = useCallback((targetId: string | null): BreadcrumbItem[] => {
    if (!document || !document.nodes || !targetId || !document.nodes[targetId]) return [];
    const chain: BreadcrumbItem[] = [];
    let currId: string | null = targetId;

    while (currId && document.nodes[currId]) {
      const node = document.nodes[currId];
      const label = (node.props?.title as string) || (node.props?.label as string) || node.component || node.kind;
      chain.unshift({
        id: currId,
        label,
        component: node.component,
        kind: node.kind,
      });
      currId = getParentId(currId);
    }
    return chain;
  }, [document, getParentId]);

  // Helper: Count total recursive descendants
  const getNodeChildrenCount = useCallback((nodeId: string): number => {
    if (!document || !document.nodes || !document.nodes[nodeId]) return 0;
    let count = 0;
    const stack = [...(document.nodes[nodeId].children || [])];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      count++;
      const current = document.nodes[currentId];
      if (current?.children) {
        stack.push(...current.children);
      }
    }
    return count;
  }, [document]);

  // Selection actions
  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const deselectNode = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const setHoveredNode = useCallback((id: string | null) => {
    setHoveredNodeId(id);
  }, []);

  const toggleNodeExpanded = useCallback((id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Apply Global Theme / Brand Tokens
  const applyThemeTokens = useCallback((themeTokens: Partial<ThemeTokens>) => {
    if (!document) return;
    pushToHistory(document);

    const newDoc: PageDocument = {
      ...document,
      themeOverride: {
        ...(document.themeOverride || {}),
        ...themeTokens,
      },
    };

    setDocument(newDoc);
    scheduleAutosave(newDoc, "Updated global brand theme");
    toast.success("Brand theme applied to canvas!");
  }, [document, pushToHistory, scheduleAutosave]);

  // Update a node
  const updateNode = useCallback((updatedNode: PageNode) => {
    if (!document) return;
    pushToHistory(document);

    const newDoc: PageDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        [updatedNode.id]: updatedNode,
      },
    };

    setDocument(newDoc);
    scheduleAutosave(newDoc);
  }, [document, pushToHistory, scheduleAutosave]);

  // Update node partial properties
  const updateNodeProps = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    if (!document || !document.nodes[nodeId]) return;
    const node = document.nodes[nodeId];
    updateNode({
      ...node,
      props: {
        ...node.props,
        ...patch,
      },
    });
  }, [document, updateNode]);

  // Update node styles
  const updateNodeStyles = useCallback((nodeId: string, patch: Record<string, unknown>, scope: "base" | "hover" = "base") => {
    if (!document || !document.nodes[nodeId]) return;
    const node = document.nodes[nodeId];
    if (scope === "base") {
      updateNode({
        ...node,
        styles: {
          ...node.styles,
          base: {
            ...(node.styles?.base || {}),
            ...patch,
          },
        },
      });
    } else {
      updateNode({
        ...node,
        styles: {
          ...node.styles,
          states: {
            ...(node.styles?.states || {}),
            hover: {
              ...(node.styles?.states?.hover || {}),
              ...patch,
            },
          },
        },
      });
    }
  }, [document, updateNode]);

  // Delete node execution with smart selection fallback
  const executeDeleteNode = useCallback((nodeId: string) => {
    if (!document || !document.nodes[nodeId]) return;
    if (nodeId === document.rootNodeId) {
      toast.error("Cannot delete root page node");
      return;
    }

    pushToHistory(document);

    const newNodes = { ...document.nodes };
    const nodesToDelete = new Set<string>();

    // Collect node + all recursive descendants
    const stack = [nodeId];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      nodesToDelete.add(curr);
      const n = newNodes[curr];
      if (n?.children) {
        stack.push(...n.children);
      }
    }

    // Determine smart selection fallback BEFORE removing
    const parentId = getParentId(nodeId);
    let nextSelectedId: string | null = parentId || document.rootNodeId;

    if (parentId && newNodes[parentId]) {
      const parentChildren = newNodes[parentId].children || [];
      const delIndex = parentChildren.indexOf(nodeId);
      
      // Try next sibling, then previous sibling, then parent
      if (delIndex !== -1) {
        if (delIndex + 1 < parentChildren.length) {
          nextSelectedId = parentChildren[delIndex + 1];
        } else if (delIndex - 1 >= 0) {
          nextSelectedId = parentChildren[delIndex - 1];
        }
      }

      // Remove from parent's children array
      newNodes[parentId] = {
        ...newNodes[parentId],
        children: parentChildren.filter((c) => c !== nodeId),
      };
    }

    // Delete collected nodes from document map
    nodesToDelete.forEach((id) => {
      delete newNodes[id];
    });

    const newDoc: PageDocument = {
      ...document,
      nodes: newNodes,
    };

    setDocument(newDoc);
    setSelectedNodeId(nextSelectedId);
    setPendingDeleteNodeId(null);
    scheduleAutosave(newDoc, `Deleted node ${nodeId}`);
    toast.success("Element deleted");
  }, [document, getParentId, pushToHistory, scheduleAutosave]);

  // Request node deletion (checks if confirmation needed)
  const requestDeleteNode = useCallback((nodeId: string) => {
    if (!document || !document.nodes[nodeId]) return;
    if (nodeId === document.rootNodeId) {
      toast.error("Cannot delete root page node");
      return;
    }
    const childrenCount = getNodeChildrenCount(nodeId);
    if (childrenCount > 0) {
      setPendingDeleteNodeId(nodeId);
    } else {
      executeDeleteNode(nodeId);
    }
  }, [document, getNodeChildrenCount, executeDeleteNode]);

  // Duplicate a node and its entire subtree
  const duplicateNode = useCallback((nodeId: string) => {
    if (!document || !document.nodes[nodeId]) return;
    if (nodeId === document.rootNodeId) {
      toast.error("Cannot duplicate root page");
      return;
    }

    pushToHistory(document);

    const newNodes = { ...document.nodes };
    const idMap: Record<string, string> = {};

    // Recursive cloning function
    function cloneSubtree(currId: string): string {
      const original = document!.nodes[currId];
      if (!original) return currId;

      const newId = `${original.component || original.kind}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
      idMap[currId] = newId;

      const clonedChildren = (original.children || []).map((childId) => cloneSubtree(childId));

      newNodes[newId] = {
        ...JSON.parse(JSON.stringify(original)),
        id: newId,
        children: clonedChildren,
        props: {
          ...JSON.parse(JSON.stringify(original.props || {})),
          title: original.props?.title ? `${original.props.title} (Copy)` : undefined,
          label: original.props?.label ? `${original.props.label} (Copy)` : undefined,
        },
      };
      return newId;
    }

    const clonedRootId = cloneSubtree(nodeId);

    // Insert next to original inside parent
    const parentId = getParentId(nodeId);
    if (parentId && newNodes[parentId]) {
      const origIndex = newNodes[parentId].children.indexOf(nodeId);
      const newChildren = [...newNodes[parentId].children];
      newChildren.splice(origIndex + 1, 0, clonedRootId);
      newNodes[parentId] = {
        ...newNodes[parentId],
        children: newChildren,
      };
    }

    const newDoc: PageDocument = {
      ...document,
      nodes: newNodes,
    };

    setDocument(newDoc);
    setSelectedNodeId(clonedRootId);
    scheduleAutosave(newDoc, `Duplicated node ${nodeId}`);
    toast.success("Element duplicated");
  }, [document, getParentId, pushToHistory, scheduleAutosave]);

  // Move node up or down within its parent
  const moveNode = useCallback((nodeId: string, direction: "up" | "down") => {
    if (!document || !document.nodes[nodeId]) return;
    const parentId = getParentId(nodeId);
    if (!parentId || !document.nodes[parentId]) return;

    const parent = document.nodes[parentId];
    const children = [...parent.children];
    const index = children.indexOf(nodeId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      pushToHistory(document);
      const temp = children[index - 1];
      children[index - 1] = children[index];
      children[index] = temp;
    } else if (direction === "down" && index < children.length - 1) {
      pushToHistory(document);
      const temp = children[index + 1];
      children[index + 1] = children[index];
      children[index] = temp;
    } else {
      return;
    }

    const newDoc: PageDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        [parentId]: {
          ...parent,
          children,
        },
      },
    };

    setDocument(newDoc);
    scheduleAutosave(newDoc, `Moved node ${nodeId} ${direction}`);
  }, [document, getParentId, pushToHistory, scheduleAutosave]);

  // Insert a new component node with smart parent inference (modular composite support for sections)
  const insertNode = useCallback((
    componentKey: string,
    targetParentId?: string,
    insertIndex?: number,
    initialProps: Record<string, unknown> = {},
    initialStyles: Record<string, unknown> = {}
  ): string | null => {
    if (!document) return null;
    pushToHistory(document);

    const isSection = [
      "hero", "product-grid", "story-about", "faq-accordion", "testimonials",
      "contact-form", "location-map", "reservation-widget", "header", "footer",
      "announcement-bar", "video", "rich-text", "countdown", "newsletter", "section"
    ].includes(componentKey);

    const isContainer = componentKey === "flex-container" || componentKey === "grid-container";
    const kind = isContainer ? "container" : isSection ? "section" : "element";

    // Resolve target parent
    let resolvedParentId = targetParentId;
    if (!resolvedParentId) {
      if (isSection) {
        resolvedParentId = document.rootNodeId;
      } else if (selectedNodeId && document.nodes[selectedNodeId]) {
        const sel = document.nodes[selectedNodeId];
        if (sel.kind === "container" || sel.kind === "section" || sel.id === document.rootNodeId) {
          resolvedParentId = sel.id;
        } else {
          resolvedParentId = getParentId(selectedNodeId) || document.rootNodeId;
        }
      } else {
        resolvedParentId = document.rootNodeId;
      }
    }

    const parentNode = document.nodes[resolvedParentId] || document.nodes[document.rootNodeId];

    // 1. Modular Section Insertion (Hero, Story, Product Grid, Reviews, FAQ, Form, etc.)
    if (isSection) {
      const modular = generateModularSection(componentKey, initialProps, initialStyles);
      const newChildren = [...(parentNode.children || [])];
      if (typeof insertIndex === "number" && insertIndex >= 0 && insertIndex <= newChildren.length) {
        newChildren.splice(insertIndex, 0, modular.rootSectionId);
      } else {
        newChildren.push(modular.rootSectionId);
      }

      const newDoc: PageDocument = {
        ...document,
        nodes: {
          ...document.nodes,
          ...modular.nodes,
          [parentNode.id]: {
            ...parentNode,
            children: newChildren,
          },
        },
      };

      setDocument(newDoc);
      setSelectedNodeId(modular.primarySelectId || modular.rootSectionId);
      const expandedPatch: Record<string, boolean> = { [parentNode.id]: true };
      Object.keys(modular.nodes).forEach((nId) => {
        if (modular.nodes[nId].children && modular.nodes[nId].children.length > 0) {
          expandedPatch[nId] = true;
        }
      });
      setExpandedNodes((prev) => ({ ...prev, ...expandedPatch }));
      scheduleAutosave(newDoc, `Added Modular ${componentKey}`);
      toast.success(`Inserted Modular ${componentKey} with fully editable elements`);
      return modular.rootSectionId;
    }

    // 2. Standard Element / Container Insertion
    const newNodeId = `${componentKey}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
    
    let defaultProps: Record<string, unknown> = { ...initialProps };
    let defaultStyles: Record<string, unknown> = { ...initialStyles };

    if (componentKey === "button") {
      defaultProps = { label: "Click Here", url: "#", ...defaultProps };
      defaultStyles = { backgroundColor: "var(--color-primary)", color: "var(--color-primary-contrast)", borderRadius: "var(--shape-button-radius)", fontSize: "0.875rem", fontWeight: 700, ...defaultStyles };
    } else if (componentKey === "text") {
      defaultProps = { content: "Sample paragraph content text.", tag: "p", ...defaultProps };
    } else if (componentKey === "image") {
      defaultProps = { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", alt: "New visual asset", ...defaultProps };
      defaultStyles = { aspectRatio: "16/9", ...defaultStyles };
    } else if (isContainer) {
      defaultStyles = { flexDirection: "column", gap: "1.5rem", padding: "1.5rem", alignItems: "stretch", ...defaultStyles };
    }

    const newNode: PageNode = {
      id: newNodeId,
      kind,
      component: componentKey,
      variant: "default",
      children: [],
      props: defaultProps,
      styles: { base: defaultStyles },
      behaviors: { entrance: { type: "slide-up", durationMs: 500, delayMs: 100, easing: "ease-out" } },
    };

    const newChildren = [...(parentNode.children || [])];

    if (typeof insertIndex === "number" && insertIndex >= 0 && insertIndex <= newChildren.length) {
      newChildren.splice(insertIndex, 0, newNodeId);
    } else {
      newChildren.push(newNodeId);
    }

    const newDoc: PageDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        [newNodeId]: newNode,
        [parentNode.id]: {
          ...parentNode,
          children: newChildren,
        },
      },
    };

    setDocument(newDoc);
    setSelectedNodeId(newNodeId);
    setExpandedNodes((prev) => ({ ...prev, [parentNode.id]: true }));
    scheduleAutosave(newDoc, `Added ${componentKey}`);
    toast.success(`Inserted ${componentKey}`);
    return newNodeId;
  }, [document, selectedNodeId, getParentId, pushToHistory, scheduleAutosave]);

  // Handle Interactive Drag & Drop on Canvas / Navigator
  const handleDropItem = useCallback((
    item: DraggedItem,
    targetNodeId: string,
    position: DropPosition
  ) => {
    if (!document || !document.nodes[targetNodeId]) return;

    if (item.type === "new_component" && item.componentKey) {
      // 1. Insert brand new component relative to target
      const targetNode = document.nodes[targetNodeId];
      if (position === "inside") {
        insertNode(item.componentKey, targetNodeId, undefined, item.initialProps, item.initialStyles);
      } else {
        const parentId = getParentId(targetNodeId) || document.rootNodeId;
        const parentNode = document.nodes[parentId];
        const targetIndex = parentNode.children.indexOf(targetNodeId);
        const insertIndex = position === "before" ? Math.max(0, targetIndex) : targetIndex + 1;
        insertNode(item.componentKey, parentId, insertIndex, item.initialProps, item.initialStyles);
      }
    } else if (item.type === "existing_node" && item.nodeId) {
      // 2. Reorder / Reparent existing node
      const sourceId = item.nodeId;
      if (sourceId === targetNodeId || sourceId === document.rootNodeId) return;

      pushToHistory(document);

      const sourceParentId = getParentId(sourceId);
      if (!sourceParentId || !document.nodes[sourceParentId]) return;

      const newNodes = { ...document.nodes };

      // Remove from source parent
      newNodes[sourceParentId] = {
        ...newNodes[sourceParentId],
        children: newNodes[sourceParentId].children.filter((c) => c !== sourceId),
      };

      if (position === "inside") {
        // Append into target container
        const targetContainer = newNodes[targetNodeId];
        newNodes[targetNodeId] = {
          ...targetContainer,
          children: [...(targetContainer.children || []), sourceId],
        };
      } else {
        // Insert before or after target node in target's parent
        const targetParentId = getParentId(targetNodeId) || document.rootNodeId;
        const targetParent = newNodes[targetParentId];
        const targetIndex = targetParent.children.indexOf(targetNodeId);
        const insertIndex = position === "before" ? Math.max(0, targetIndex) : targetIndex + 1;

        const newChildren = [...targetParent.children];
        newChildren.splice(insertIndex, 0, sourceId);

        newNodes[targetParentId] = {
          ...targetParent,
          children: newChildren,
        };
      }

      const newDoc: PageDocument = {
        ...document,
        nodes: newNodes,
      };

      setDocument(newDoc);
      setSelectedNodeId(sourceId);
      scheduleAutosave(newDoc, `Moved element ${sourceId}`);
      toast.success("Element reordered");
    }
  }, [document, getParentId, insertNode, pushToHistory, scheduleAutosave]);

  // Copy node to clipboard
  const copyNode = useCallback((nodeId: string) => {
    if (!document || !document.nodes[nodeId]) return;
    const rootNode = document.nodes[nodeId];
    const descendants: Record<string, PageNode> = {};
    const stack = [...(rootNode.children || [])];

    while (stack.length > 0) {
      const cId = stack.pop()!;
      if (document.nodes[cId]) {
        descendants[cId] = JSON.parse(JSON.stringify(document.nodes[cId]));
        if (document.nodes[cId].children) {
          stack.push(...document.nodes[cId].children);
        }
      }
    }

    clipboardRef.current = {
      node: JSON.parse(JSON.stringify(rootNode)),
      descendants,
    };
    toast.success(`Copied ${rootNode.component || rootNode.kind}`);
  }, [document]);

  // Paste node from clipboard
  const pasteNode = useCallback((targetParentId?: string) => {
    if (!document || !clipboardRef.current) {
      toast.error("Clipboard is empty");
      return;
    }

    pushToHistory(document);

    const { node: clipNode, descendants: clipDescendants } = clipboardRef.current;
    let resolvedParentId = targetParentId;
    if (!resolvedParentId) {
      if (selectedNodeId && document.nodes[selectedNodeId]) {
        const sel = document.nodes[selectedNodeId];
        if (sel.kind === "container" || sel.kind === "section" || sel.id === document.rootNodeId) {
          resolvedParentId = sel.id;
        } else {
          resolvedParentId = getParentId(selectedNodeId) || document.rootNodeId;
        }
      } else {
        resolvedParentId = document.rootNodeId;
      }
    }

    const newNodes = { ...document.nodes };
    const idMap: Record<string, string> = {};

    // Clone root and descendants with new unique IDs
    function instantiateNode(oldNode: PageNode): string {
      const newId = `${oldNode.component || oldNode.kind}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
      idMap[oldNode.id] = newId;

      const newChildren = (oldNode.children || []).map((cId) => {
        const childNode = clipDescendants[cId];
        return childNode ? instantiateNode(childNode) : cId;
      });

      newNodes[newId] = {
        ...JSON.parse(JSON.stringify(oldNode)),
        id: newId,
        children: newChildren,
      };
      return newId;
    }

    const pastedRootId = instantiateNode(clipNode);
    const parentNode = newNodes[resolvedParentId] || newNodes[document.rootNodeId];
    newNodes[parentNode.id] = {
      ...parentNode,
      children: [...(parentNode.children || []), pastedRootId],
    };

    const newDoc: PageDocument = {
      ...document,
      nodes: newNodes,
    };

    setDocument(newDoc);
    setSelectedNodeId(pastedRootId);
    scheduleAutosave(newDoc, `Pasted ${clipNode.component}`);
    toast.success(`Pasted ${clipNode.component || clipNode.kind}`);
  }, [document, selectedNodeId, getParentId, pushToHistory, scheduleAutosave]);

  // Undo action
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0 || !document) return;
    const previousDoc = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(document)));
    setDocument(previousDoc);
    updateHistoryFlags();
    scheduleAutosave(previousDoc, "Undo");
    toast.info("Undo");
  }, [document, updateHistoryFlags, scheduleAutosave]);

  // Redo action
  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0 || !document) return;
    const nextDoc = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(document)));
    setDocument(nextDoc);
    updateHistoryFlags();
    scheduleAutosave(nextDoc, "Redo");
    toast.info("Redo");
  }, [document, updateHistoryFlags, scheduleAutosave]);

  // Decompose any monolithic section into granular editable child nodes
  const decomposeSectionNode = useCallback((nodeId: string) => {
    if (!document || !document.nodes[nodeId]) return;
    const node = document.nodes[nodeId];

    pushToHistory(document);

    const modular = generateModularSection(
      node.component || "hero",
      node.props || {},
      node.styles?.base || {},
      node.id
    );

    const newDoc: PageDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        ...modular.nodes,
      },
    };

    setDocument(newDoc);
    setSelectedNodeId(modular.primarySelectId || node.id);
    const expandedPatch: Record<string, boolean> = { [node.id]: true };
    Object.keys(modular.nodes).forEach((nId) => {
      if (modular.nodes[nId].children && modular.nodes[nId].children.length > 0) {
        expandedPatch[nId] = true;
      }
    });
    setExpandedNodes((prev) => ({ ...prev, ...expandedPatch }));
    scheduleAutosave(newDoc, `Unlocked & modularized ${node.component || 'section'}`);
    toast.success("Section converted to modular elements");
  }, [document, pushToHistory, scheduleAutosave]);

  // Publish version
  const publish = useCallback(async () => {
    if (!document) return;
    setIsPublishing(true);
    try {
      const res = await api.post(`/cms-v3/me/pages/${pageId}/publish`);
      if (res.data?.success) {
        setIsPublished(true);
        setPublishedVersionNumber(res.data.data?.publishedVersion?.version_number || 1);
        setSaveStatus("saved");
        toast.success("Page published live successfully!");
      } else {
        toast.error(res.data?.error || "Failed to publish page");
      }
    } catch (err: any) {
      console.error("Publish failed:", err);
      toast.error(err.response?.data?.error || "Error publishing page");
    } finally {
      setIsPublishing(false);
    }
  }, [document, pageId]);

  return {
    document,
    setDocument,
    selectedNodeId,
    selectedNode: selectedNodeId && document?.nodes ? document.nodes[selectedNodeId] || null : null,
    hoveredNodeId,
    expandedNodes,
    canUndo,
    canRedo,
    saveStatus,
    isPublished,
    publishedVersionNumber,
    isPublishing,
    pendingDeleteNodeId,
    setPendingDeleteNodeId,
    // Actions
    selectNode,
    deselectNode,
    setHoveredNode,
    toggleNodeExpanded,
    applyThemeTokens,
    updateNode,
    updateNodeProps,
    updateNodeStyles,
    requestDeleteNode,
    executeDeleteNode,
    duplicateNode,
    moveNode,
    insertNode,
    handleDropItem,
    copyNode,
    pasteNode,
    undo,
    redo,
    publish,
    decomposeSectionNode,
    getParentId,
    getBreadcrumbs,
    getNodeChildrenCount,
  };
}
