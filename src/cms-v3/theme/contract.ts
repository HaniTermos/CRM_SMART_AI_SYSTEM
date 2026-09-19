/**
 * SmartStore Website Studio (CMS V3) — Theme Contract & Cascade Resolver
 */

import { ThemeTokens } from '../types/cms-v3';

export const DEFAULT_SYSTEM_THEME_TOKENS: ThemeTokens = {
  colors: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceMuted: '#F4F4F5',
    text: '#0F172A',
    textMuted: '#64748B',
    primary: '#4F46E5',
    primaryContrast: '#FFFFFF',
    secondary: '#3B82F6',
    accent: '#00E0FF',
    border: '#E2E8F0',
    focus: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  },
  typography: {
    headingFont: 'Outfit',
    bodyFont: 'Inter',
    scale: 'normal',
    headingWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '-0.01em'
  },
  shape: {
    radiusSmall: '0.375rem',
    radiusMedium: '0.75rem',
    radiusLarge: '1.25rem',
    buttonRadius: '1rem',
    cardRadius: '1rem'
  },
  spacing: {
    sectionPadding: '4rem',
    containerWidth: '1280px'
  },
  direction: 'ltr'
};

/**
 * Merges system tokens, active theme tokens, page-level theme overrides, and instance overrides
 * following the standard inheritance cascade:
 * Theme -> Template -> Component -> Instance -> Element -> Responsive Override
 */
export function resolveThemeCascade(
  baseTokens: ThemeTokens,
  pageOverride?: Partial<ThemeTokens>,
  nodeStyleOverride?: Record<string, unknown>
): ThemeTokens {
  const mergedColors = {
    ...baseTokens.colors,
    ...(pageOverride?.colors || {})
  };

  const mergedTypography = {
    ...baseTokens.typography,
    ...(pageOverride?.typography || {})
  };

  const mergedShape = {
    ...baseTokens.shape,
    ...(pageOverride?.shape || {})
  };

  const mergedSpacing = {
    ...baseTokens.spacing,
    ...(pageOverride?.spacing || {})
  };

  return {
    colors: mergedColors,
    typography: mergedTypography,
    shape: mergedShape,
    spacing: mergedSpacing,
    direction: pageOverride?.direction || baseTokens.direction
  };
}

type ResolvedCssValue = {
  display: string;
  source: "theme" | "local";
  tokenName?: string;
};

const CSS_VAR_TOKEN_MAP: Record<string, (tokens: ThemeTokens) => string> = {
  "--color-background": (t) => t.colors.background,
  "--color-surface": (t) => t.colors.surface,
  "--color-surface-muted": (t) => t.colors.surfaceMuted,
  "--color-text": (t) => t.colors.text,
  "--color-text-muted": (t) => t.colors.textMuted,
  "--color-primary": (t) => t.colors.primary,
  "--color-primary-contrast": (t) => t.colors.primaryContrast,
  "--color-secondary": (t) => t.colors.secondary,
  "--color-accent": (t) => t.colors.accent,
  "--color-border": (t) => t.colors.border,
  "--shape-button-radius": (t) => t.shape.buttonRadius,
  "--shape-card-radius": (t) => t.shape.cardRadius || "1rem",
  "--shape-radius-small": (t) => t.shape.radiusSmall || "0.375rem",
  "--shape-radius-medium": (t) => t.shape.radiusMedium || "0.75rem",
  "--shape-radius-large": (t) => t.shape.radiusLarge || "1.25rem",
};

/**
 * Resolves CSS var() theme tokens to human-readable values for inspector display.
 */
export function resolveCssValue(raw: string | undefined, tokens: ThemeTokens = DEFAULT_SYSTEM_THEME_TOKENS): ResolvedCssValue {
  if (!raw || !raw.trim()) return { display: "", source: "local" };
  const trimmed = raw.trim();
  const varMatch = trimmed.match(/^var\(\s*(--[^,)]+)\s*(?:,\s*([^)]+))?\s*\)$/i);
  if (varMatch) {
    const tokenName = varMatch[1];
    const fallback = varMatch[2]?.trim();
    const resolver = CSS_VAR_TOKEN_MAP[tokenName];
    if (resolver) {
      return { display: resolver(tokens), source: "theme", tokenName };
    }
    if (fallback) {
      return resolveCssValue(fallback, tokens);
    }
  }
  return { display: trimmed, source: "local" };
}

/**
 * Generates CSS Variables dictionary for DOM injection or inline styling
 */
export function generateCssVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    '--color-background': tokens.colors.background,
    '--color-surface': tokens.colors.surface,
    '--color-surface-muted': tokens.colors.surfaceMuted,
    '--color-text': tokens.colors.text,
    '--color-text-muted': tokens.colors.textMuted,
    '--color-primary': tokens.colors.primary,
    '--color-primary-contrast': tokens.colors.primaryContrast,
    '--color-secondary': tokens.colors.secondary,
    '--color-accent': tokens.colors.accent,
    '--color-border': tokens.colors.border,
    '--font-heading': tokens.typography.headingFont,
    '--font-body': tokens.typography.bodyFont,
    '--shape-button-radius': tokens.shape.buttonRadius,
    '--shape-card-radius': tokens.shape.cardRadius || '1rem',
    '--spacing-section-padding': tokens.spacing.sectionPadding,
    '--spacing-container-width': tokens.spacing.containerWidth || '1280px',
  };
}
