/**
 * SmartStore Website Studio (CMS V3) — Authoritative Style Resolver
 * Converts PageNode.styles into standard React.CSSProperties, supporting all Layout, Spacing, Style, and Typography properties.
 */

import React from "react";

export function buildNodeStyleObject(stylesMap: Record<string, unknown> = {}): React.CSSProperties {
  const css: React.CSSProperties = {};

  if (!stylesMap || typeof stylesMap !== "object") return css;

  // 1. Spacing - Margins
  if (stylesMap.margin) css.margin = String(stylesMap.margin);
  if (stylesMap.marginTop) css.marginTop = String(stylesMap.marginTop);
  if (stylesMap.marginRight) css.marginRight = String(stylesMap.marginRight);
  if (stylesMap.marginBottom) css.marginBottom = String(stylesMap.marginBottom);
  if (stylesMap.marginLeft) css.marginLeft = String(stylesMap.marginLeft);

  // 2. Spacing - Paddings
  if (stylesMap.padding) css.padding = String(stylesMap.padding);
  if (stylesMap.paddingX) {
    css.paddingLeft = String(stylesMap.paddingX);
    css.paddingRight = String(stylesMap.paddingX);
  }
  if (stylesMap.paddingY) {
    css.paddingTop = String(stylesMap.paddingY);
    css.paddingBottom = String(stylesMap.paddingY);
  }
  if (stylesMap.paddingTop) css.paddingTop = String(stylesMap.paddingTop);
  if (stylesMap.paddingRight) css.paddingRight = String(stylesMap.paddingRight);
  if (stylesMap.paddingBottom) css.paddingBottom = String(stylesMap.paddingBottom);
  if (stylesMap.paddingLeft) css.paddingLeft = String(stylesMap.paddingLeft);

  // 3. Sizing & Dimensions
  if (stylesMap.width) css.width = String(stylesMap.width);
  if (stylesMap.maxWidth) css.maxWidth = String(stylesMap.maxWidth);
  if (stylesMap.minWidth) css.minWidth = String(stylesMap.minWidth);
  if (stylesMap.height) css.height = String(stylesMap.height);
  if (stylesMap.minHeight) css.minHeight = String(stylesMap.minHeight);
  if (stylesMap.maxHeight) css.maxHeight = String(stylesMap.maxHeight);
  if (stylesMap.aspectRatio) css.aspectRatio = String(stylesMap.aspectRatio);
  if (stylesMap.overflow) css.overflow = stylesMap.overflow as any;

  // 4. Layout & Flexbox / Grid
  if (stylesMap.display) css.display = String(stylesMap.display);
  if (stylesMap.flexDirection) css.flexDirection = stylesMap.flexDirection as any;
  if (stylesMap.justifyContent) css.justifyContent = String(stylesMap.justifyContent);
  if (stylesMap.alignItems) css.alignItems = String(stylesMap.alignItems);
  if (stylesMap.flexWrap) css.flexWrap = stylesMap.flexWrap as any;
  if (stylesMap.flexGrow !== undefined) css.flexGrow = Number(stylesMap.flexGrow);
  if (stylesMap.flexShrink !== undefined) css.flexShrink = Number(stylesMap.flexShrink);
  if (stylesMap.gap) css.gap = String(stylesMap.gap);

  // 5. Backgrounds
  if (stylesMap.backgroundColor) css.backgroundColor = String(stylesMap.backgroundColor);
  if (stylesMap.backgroundImage) {
    const bg = String(stylesMap.backgroundImage);
    css.backgroundImage = bg.startsWith("url") || bg.startsWith("linear-gradient") ? bg : `url("${bg}")`;
    css.backgroundSize = (stylesMap.backgroundSize as string) || "cover";
    css.backgroundPosition = (stylesMap.backgroundPosition as string) || "center";
  }

  // 6. Typography
  if (stylesMap.color) css.color = String(stylesMap.color);
  if (stylesMap.textColor) css.color = String(stylesMap.textColor);
  if (stylesMap.fontFamily) css.fontFamily = String(stylesMap.fontFamily);
  if (stylesMap.fontSize) css.fontSize = String(stylesMap.fontSize);
  if (stylesMap.fontWeight) css.fontWeight = Number(stylesMap.fontWeight) || String(stylesMap.fontWeight);
  if (stylesMap.lineHeight) css.lineHeight = String(stylesMap.lineHeight);
  if (stylesMap.letterSpacing) css.letterSpacing = String(stylesMap.letterSpacing);
  if (stylesMap.objectFit) css.objectFit = stylesMap.objectFit as React.CSSProperties["objectFit"];
  if (stylesMap.textTransform) css.textTransform = stylesMap.textTransform as any;

  // 7. Borders & Corners
  if (stylesMap.borderStyle && stylesMap.borderStyle !== "none") {
    css.borderStyle = stylesMap.borderStyle as any;
    css.borderWidth = (stylesMap.borderWidth as string) || "1px";
    css.borderColor = (stylesMap.borderColor as string) || "var(--color-border)";
  } else if (stylesMap.borderWidth) {
    css.borderWidth = String(stylesMap.borderWidth);
    css.borderStyle = (stylesMap.borderStyle as any) || "solid";
    css.borderColor = (stylesMap.borderColor as string) || "var(--color-border)";
  }

  if (stylesMap.borderRadius) css.borderRadius = String(stylesMap.borderRadius);
  if (stylesMap.borderTopLeftRadius) css.borderTopLeftRadius = String(stylesMap.borderTopLeftRadius);
  if (stylesMap.borderTopRightRadius) css.borderTopRightRadius = String(stylesMap.borderTopRightRadius);
  if (stylesMap.borderBottomLeftRadius) css.borderBottomLeftRadius = String(stylesMap.borderBottomLeftRadius);
  if (stylesMap.borderBottomRightRadius) css.borderBottomRightRadius = String(stylesMap.borderBottomRightRadius);

  // 8. Visual Effects & Advanced
  if (stylesMap.boxShadow) css.boxShadow = String(stylesMap.boxShadow);
  if (typeof stylesMap.opacity === "number") css.opacity = stylesMap.opacity;
  if (stylesMap.mixBlendMode) css.mixBlendMode = stylesMap.mixBlendMode as any;
  if (stylesMap.textShadow) css.textShadow = String(stylesMap.textShadow);
  if (stylesMap.textStroke || stylesMap.WebkitTextStroke) {
    (css as any).WebkitTextStroke = String(stylesMap.textStroke || stylesMap.WebkitTextStroke);
  }

  // 9. Positioning & Flex Align Self / Order
  if (stylesMap.alignSelf) css.alignSelf = String(stylesMap.alignSelf);
  if (stylesMap.order !== undefined) css.order = Number(stylesMap.order);
  if (stylesMap.position) css.position = stylesMap.position as any;
  if (stylesMap.top) css.top = String(stylesMap.top);
  if (stylesMap.right) css.right = String(stylesMap.right);
  if (stylesMap.bottom) css.bottom = String(stylesMap.bottom);
  if (stylesMap.left) css.left = String(stylesMap.left);
  if (stylesMap.zIndex !== undefined) css.zIndex = Number(stylesMap.zIndex);
  if (stylesMap.transform) css.transform = String(stylesMap.transform);
  if (stylesMap.transition) css.transition = String(stylesMap.transition);
  if (stylesMap.cursor) css.cursor = String(stylesMap.cursor);

  return css;
}
