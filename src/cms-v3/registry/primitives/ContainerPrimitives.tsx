/**
 * SmartStore Website Studio (CMS V3) — Layout Containers & Core Primitives
 * All primitives resolve and apply comprehensive layout, spacing, and styling properties.
 */

import React from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { resolveComponentNode } from "../../renderer/contracts";
import { buildNodeStyleObject } from "../../renderer/styleResolver";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface PrimitiveProps {
  node: PageNode;
  context: RenderContext;
  childrenNodes?: React.ReactNode;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

// 1. Flex Container
export function FlexContainer({ node, context, childrenNodes, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "flex transition-all duration-150 min-h-[60px] relative w-full",
        isSelected && "ring-1 ring-indigo-500/50"
      )}
      style={{
        flexDirection: (s.flexDirection as any) || "column",
        gap: (s.gap as string) || "1.5rem",
        alignItems: (s.alignItems as string) || "stretch",
        justifyContent: (s.justifyContent as string) || "flex-start",
        flexWrap: (s.flexWrap as any) || "nowrap",
        padding: (s.padding as string) || "1.5rem",
        backgroundColor: (s.backgroundColor as string) || "transparent",
        ...customCss,
      }}
    >
      {childrenNodes}
      {context.mode === "editor" && (!node.children || node.children.length === 0) && (
        <div className="w-full py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
          Empty Flex Container — Drop or Insert elements here
        </div>
      )}
    </div>
  );
}

// 2. Grid Container
export function GridContainer({ node, context, childrenNodes, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  const cols = Number(s.columns || 3);
  const gridColClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "grid transition-all duration-150 min-h-[60px] relative w-full",
        gridColClass,
        isSelected && "ring-1 ring-indigo-500/50"
      )}
      style={{
        gap: (s.gap as string) || "1.5rem",
        padding: (s.padding as string) || "1.5rem",
        ...customCss,
      }}
    >
      {childrenNodes}
      {context.mode === "editor" && (!node.children || node.children.length === 0) && (
        <div className="col-span-full py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
          Empty Grid Container — Drop or Insert elements here
        </div>
      )}
    </div>
  );
}

// 3. Text Atom
export function TextAtom({ node, context, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  const content = (p.content as string) || (p.title as string) || "Sample text paragraph";
  const tag = (p.tag as string) || "p";

  const CustomTag = (["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div"].includes(tag) ? tag : "p") as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

  const defaultFontSize = (s.fontSize as string) || (tag.startsWith("h") ? "1.75rem" : "1rem");
  const defaultFontWeight =
    typeof s.fontWeight === "number" ? s.fontWeight : tag.startsWith("h") ? 700 : 400;

  return (
    <CustomTag
      onClick={(e: React.MouseEvent) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("transition-all duration-150 max-w-full")}
      style={{
        display: "block",
        width: "100%",
        color: (s.color as string) || "var(--color-text)",
        fontSize: defaultFontSize,
        fontWeight: defaultFontWeight,
        lineHeight: (s.lineHeight as string) || 1.5,
        ...customCss,
      }}
    >
      {content}
    </CustomTag>
  );
}

// 4. Button Atom
export function ButtonAtom({ node, context, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  const label = (p.label as string) || "Click Here";
  const url = (p.url as string) || "#";

  return (
    <a
      href={context.mode === "editor" ? undefined : url}
      onClick={(e) => {
        if (context.mode === "editor") {
          e.preventDefault();
        }
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center font-bold px-5 py-2.5 shadow-xs transition-all duration-200 hover:opacity-90 cursor-pointer"
      )}
      style={{
        backgroundColor: (s.backgroundColor as string) || "var(--color-primary)",
        color: (s.textColor as string) || (s.color as string) || "var(--color-primary-contrast)",
        borderRadius: (s.borderRadius as string) || "var(--shape-button-radius)",
        fontSize: (s.fontSize as string) || "0.875rem",
        ...customCss,
      }}
    >
      {label}
    </a>
  );
}

// 5. Image Atom
export function ImageAtom({ node, context, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  const url = (p.url as string) || (p.imageUrl as string) || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80";
  const alt = (p.alt as string) || (p.altText as string) || "Visual asset";

  const objectFit = (s.objectFit as string) || "cover";

  return (
    <img
      src={url}
      alt={alt}
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("transition-all duration-200 w-full h-auto max-w-full")}
      style={{
        aspectRatio: (s.aspectRatio as string) || "16/9",
        objectFit: objectFit as React.CSSProperties["objectFit"],
        borderRadius: (s.borderRadius as string) || "var(--shape-card-radius)",
        ...customCss,
      }}
    />
  );
}

// 6. Icon Atom
export function IconAtom({ node, context, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  const iconName = (p.iconName as string) || (p.icon as string) || "Sparkles";
  // @ts-ignore
  const IconComponent = LucideIcons[iconName] || LucideIcons.Sparkles;

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("inline-flex items-center justify-center p-2 rounded-lg transition-all")}
      style={{
        color: (s.color as string) || "var(--color-primary)",
        fontSize: (s.fontSize as string) || "1.5rem",
        ...customCss,
      }}
    >
      <IconComponent className="w-6 h-6" />
    </div>
  );
}

// 7. Divider Atom
export function DividerAtom({ node, context, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);

  return (
    <hr
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("my-4 border-slate-200 dark:border-slate-800 w-full")}
      style={customCss}
    />
  );
}

// 8. Spacer Atom
export function SpacerAtom({ node, context, onSelectNode, isSelected }: PrimitiveProps) {
  const resolution = resolveComponentNode(node, context);
  const s = resolution.resolvedStyles;
  const customCss = buildNodeStyleObject(s);
  const height = (s.height as string) || "2rem";

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("w-full transition-all")}
      style={{ height, ...customCss }}
    />
  );
}
