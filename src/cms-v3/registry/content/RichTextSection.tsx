/**
 * SmartStore Website Studio (CMS V3) — Sanitized Rich Text Component
 */

import React from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { sanitizeHtml } from "../../shared/RichTextSanitizer";
import { cn } from "@/lib/utils";

interface RichTextSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function RichTextSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: RichTextSectionProps) {
  const props = node.props || {};
  const rawContent = (props.content as string) || (props.html as string) || "<p>Artisanal bakery and gourmet dining experience.</p>";
  const cleanHtml = sanitizeHtml(rawContent);

  return (
    <div
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-rich-text max-w-4xl mx-auto py-8 px-4 sm:px-6 prose prose-slate text-slate-800 leading-relaxed text-sm",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 rounded-2xl"
      )}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
