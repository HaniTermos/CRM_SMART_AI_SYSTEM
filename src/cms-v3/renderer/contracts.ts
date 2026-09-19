/**
 * SmartStore Website Studio (CMS V3) — Renderer Contracts & Interfaces
 */

import { ThemeTokens, PageNode, ComponentDefinition, ResponsiveOverrides, BehaviorConfig } from '../types/cms-v3';
import { getComponentDefinition } from '../registry';

export type RenderContext = {
  mode: 'editor' | 'preview' | 'public';
  device: 'desktop' | 'tablet' | 'mobile';
  direction: 'ltr' | 'rtl';
  theme: ThemeTokens;
  storeId?: string;
  preview: boolean;
  activeState?: 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'scrolled';
  reducedMotion?: boolean;
};

export type ComponentResolution = {
  definition: ComponentDefinition | null;
  variantKey: string;
  resolvedProps: Record<string, unknown>;
  resolvedStyles: Record<string, unknown>;
  activeBehaviors: BehaviorConfig | null;
  isValid: boolean;
  warnings: string[];
};

export function resolveComponentNode(node: PageNode, context: RenderContext): ComponentResolution {
  const warnings: string[] = [];
  const definition = getComponentDefinition(node.component);

  if (!definition && node.kind !== 'global-symbol') {
    warnings.push(`Component '${node.component}' is not registered in V3 registry.`);
  }

  const variantKey = node.variant || definition?.variants[0]?.key || 'default';
  
  // Merge default props with node props
  const resolvedProps = {
    ...(definition?.defaultProps || {}),
    ...(node.props || {})
  };

  // Merge default styles with node base styles
  let resolvedStyles: Record<string, unknown> = {
    ...(definition?.defaultStyles || {}),
    ...(node.styles?.base || {})
  };

  // Resolve responsive styles for active device
  if (node.styles?.responsive) {
    const responsiveStyles = resolveResponsiveStyles(node.styles.responsive, context.device);
    resolvedStyles = { ...resolvedStyles, ...responsiveStyles };
  }

  // Resolve active interactive state styles (for editor preview)
  if (context.activeState && context.activeState !== 'default' && node.styles?.states?.[context.activeState]) {
    resolvedStyles = { ...resolvedStyles, ...node.styles.states[context.activeState] };
  }

  // Resolve behavior (with reduced motion safeguards)
  let activeBehaviors = node.behaviors || null;
  if (activeBehaviors && context.reducedMotion && activeBehaviors.reducedMotion === 'disable') {
    activeBehaviors = { ...activeBehaviors, entrance: undefined };
  }

  return {
    definition,
    variantKey,
    resolvedProps,
    resolvedStyles,
    activeBehaviors,
    isValid: warnings.length === 0,
    warnings
  };
}

export function resolveResponsiveStyles(
  responsive: ResponsiveOverrides,
  device: 'desktop' | 'tablet' | 'mobile'
): Record<string, unknown> {
  const desktop = responsive.desktop || {};
  if (device === 'desktop') return desktop;

  const tablet = { ...desktop, ...(responsive.tablet || {}) };
  if (device === 'tablet') return tablet;

  const mobile = { ...tablet, ...(responsive.mobile || {}) };
  return mobile;
}
