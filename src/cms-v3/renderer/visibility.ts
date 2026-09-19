/**
 * CMS V3 — Responsive visibility helpers
 * Used by editor canvas (runtime device) and public CSS generation (media queries).
 */

import { PageNode } from "../types/cms-v3";

export type VisibilityDevice = "desktop" | "tablet" | "mobile";

export function isNodeVisible(
  node: PageNode,
  device: VisibilityDevice
): boolean {
  const v = node.visibility;
  if (!v) return true;
  if (device === "desktop") return v.desktop !== false;
  if (device === "tablet") return v.tablet !== false;
  return v.mobile !== false;
}

export function nodeVisibilityCssRules(nodeId: string, visibility: PageNode["visibility"]): string[] {
  if (!visibility) return [];
  const selector = `[data-cms-node="${nodeId}"]`;
  const rules: string[] = [];

  if (visibility.desktop === false) {
    rules.push(`@media (min-width: 1025px) { ${selector} { display: none !important; } }`);
  }
  if (visibility.tablet === false) {
    rules.push(`@media (min-width: 768px) and (max-width: 1024px) { ${selector} { display: none !important; } }`);
  }
  if (visibility.mobile === false) {
    rules.push(`@media (max-width: 767px) { ${selector} { display: none !important; } }`);
  }

  return rules;
}
