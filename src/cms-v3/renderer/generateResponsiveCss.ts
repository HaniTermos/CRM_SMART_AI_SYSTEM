/**
 * CMS V3 — Generates scoped responsive CSS for published/public pages.
 * Emits media-query overrides for responsive styles and per-device visibility.
 */

import { PageDocument } from "../types/cms-v3";
import { buildNodeStyleObject } from "./styleResolver";
import { nodeVisibilityCssRules } from "./visibility";

const TABLET_MQ = "@media (max-width: 1024px)";
const MOBILE_MQ = "@media (max-width: 767px)";

function camelToKebab(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function stylesRecordToCssBlock(styles: Record<string, unknown>): string {
  const cssProps = buildNodeStyleObject(styles);
  return Object.entries(cssProps)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
    .join(" ");
}

export function generateResponsiveStylesheet(doc: PageDocument): string {
  if (!doc?.nodes) return "";

  const rules: string[] = [];

  for (const node of Object.values(doc.nodes)) {
    const selector = `[data-cms-node="${node.id}"]`;

    rules.push(...nodeVisibilityCssRules(node.id, node.visibility));

    const responsive = node.styles?.responsive;
    if (responsive?.tablet) {
      const block = stylesRecordToCssBlock(responsive.tablet as Record<string, unknown>);
      if (block) rules.push(`${TABLET_MQ} { ${selector} { ${block} } }`);
    }
    if (responsive?.mobile) {
      const block = stylesRecordToCssBlock(responsive.mobile as Record<string, unknown>);
      if (block) rules.push(`${MOBILE_MQ} { ${selector} { ${block} } }`);
    }
  }

  return rules.join("\n");
}
