/**
 * SmartStore Website Studio (CMS V3) — Published Public Storefront Renderer
 */

import React, { useMemo } from "react";
import { PageDocument, RenderContext } from "../types/cms-v3";
import { UniversalRenderer } from "./UniversalRenderer";
import { DEFAULT_SYSTEM_THEME_TOKENS, generateCssVariables, resolveThemeCascade } from "../theme/contract";
import { generateResponsiveStylesheet } from "./generateResponsiveCss";

interface PublicRendererV3Props {
  document: PageDocument;
  storeSlug: string;
}

export function PublicRendererV3({ document, storeSlug }: PublicRendererV3Props) {
  const theme = resolveThemeCascade(DEFAULT_SYSTEM_THEME_TOKENS, document?.themeOverride);
  const cssVars = generateCssVariables(theme);

  const responsiveCss = useMemo(
    () => generateResponsiveStylesheet(document),
    [document]
  );

  const context: RenderContext = {
    mode: "public",
    device: "desktop",
    direction: theme.direction || "ltr",
    theme,
    preview: false,
  };

  if (!document || !document.rootNodeId || !document.nodes) {
    return null;
  }

  return (
    <div
      className="cms-v3-storefront-root min-h-screen bg-slate-50 font-sans"
      style={cssVars as React.CSSProperties}
      data-store-slug={storeSlug}
    >
      {responsiveCss ? (
        <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      ) : null}
      <UniversalRenderer nodeId={document.rootNodeId} document={document} context={context} />
    </div>
  );
}
