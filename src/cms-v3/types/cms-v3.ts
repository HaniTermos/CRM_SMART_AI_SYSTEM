/**
 * SmartStore Website Studio (CMS V3) — Authoritative Type Definitions & Contracts
 */

export type DocumentValidationError = {
  path: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

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

export type ThemeTokens = {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryContrast: string;
    secondary: string;
    accent: string;
    border: string;
    focus?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: 'compact' | 'normal' | 'large';
    headingWeight: number;
    bodyWeight: number;
    lineHeight: number;
    letterSpacing: string;
  };
  shape: {
    radiusSmall?: string;
    radiusMedium?: string;
    radiusLarge?: string;
    buttonRadius: string;
    cardRadius?: string;
  };
  spacing: {
    sectionPadding: string;
    containerWidth?: string;
  };
  direction: 'ltr' | 'rtl';
};

export type ResponsiveOverrides = {
  desktop?: Record<string, unknown>;
  tablet?: Record<string, unknown>;
  mobile?: Record<string, unknown>;
};

export type ComponentStateStyles = {
  hover?: Record<string, unknown>;
  focus?: Record<string, unknown>;
  active?: Record<string, unknown>;
  disabled?: Record<string, unknown>;
  scrolled?: Record<string, unknown>;
};

export type AnimationConfig = {
  type: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'flip-up' | 'bounce' | 'blur-in' | 'hover-lift' | 'hover-scale';
  durationMs: number;  // 100 to 2000
  delayMs: number;     // 0 to 3000
  easing: 'linear' | 'ease-out' | 'ease-in-out' | 'cubic-bezier(0.16, 1, 0.3, 1)';
  staggerIndex?: number; // 0 to 50
  scale?: number;
  translateYPx?: number;
  shadowStep?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
};

export type InteractionRule = {
  trigger: 'click' | 'hover' | 'viewport_enter';
  action: 'scroll_to_anchor' | 'open_modal' | 'trigger_quick_order' | 'toggle_accordion' | 'copy_text' | 'open_url';
  targetId?: string;
  payload?: Record<string, unknown>;
};

export type BehaviorConfig = {
  entrance?: AnimationConfig;
  hover?: {
    scale?: number;
    translateYPx?: number;
    shadowStep?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
    durationMs?: number;
  };
  scroll?: {
    parallaxSpeed?: number;
    stickyPosition?: 'top' | 'bottom';
    stickyOffsetPx?: number;
    headerShrinkBlur?: boolean;
  };
  interactions?: InteractionRule[];
  reducedMotion?: 'disable' | 'simplify' | 'keep';
};

export type PageNode = {
  id: string;
  kind: 'page' | 'section' | 'container' | 'element' | 'global-symbol';
  component: string;
  variant?: string;
  symbolId?: string;
  overrideMode?: 'synced' | 'detached';
  children: string[];

  props: Record<string, unknown>;

  styles: {
    base?: Record<string, unknown>;
    states?: ComponentStateStyles;
    responsive?: ResponsiveOverrides;
  };

  behaviors?: BehaviorConfig;

  visibility?: {
    desktop?: boolean;
    tablet?: boolean;
    mobile?: boolean;
  };
};

export type PageDocument = {
  versionNumber: number;
  rootNodeId: string;
  nodes: Record<string, PageNode>;
  themeOverride?: Partial<ThemeTokens>;
};

export type ComponentVariant = {
  key: string;
  label: string;
  description?: string;
  previewImage?: string;
  defaultProps?: Record<string, unknown>;
  defaultStyles?: Record<string, unknown>;
};

export type ComponentCapabilities = {
  content: boolean;
  style: boolean;
  layout: boolean;
  states: boolean;
  responsive: boolean;
  motion: boolean;
  interactions: boolean;
  visibility: boolean;
  accessibility: boolean;
  advanced: boolean;
};

export type ComponentDefinition = {
  key: string;
  label: string;
  category: 'layout' | 'hero' | 'commerce' | 'content' | 'media' | 'social_proof' | 'forms' | 'location' | 'navigation';
  type: 'atom' | 'molecule' | 'section' | 'container';

  variants: ComponentVariant[];

  propsSchema: Record<string, unknown>;
  stylesSchema: Record<string, unknown>;
  behaviorsSchema: Record<string, unknown>;

  capabilities: ComponentCapabilities;

  defaultProps: Record<string, unknown>;
  defaultStyles: Record<string, unknown>;

  supportsChildren: boolean;
  supportsResponsive: boolean;
  supportsStates: boolean;
  supportsMotion?: boolean;
  supportsInteractions?: boolean;
  supportsAccessibility?: boolean;

  editorRenderer: string;
  publicRenderer: string;
  thumbnailRenderer?: string;

  status: 'implemented' | 'partial' | 'planned' | 'deprecated';
};

export type ComponentReadiness = {
  key: string;
  registered: boolean;
  visibleInLibrary: boolean;
  rendersInEditor: boolean;
  rendersPublicly: boolean;
  dedicatedInspector: boolean;
  genericInspector: boolean;
  draftPersistence: boolean;
  publishedPersistence: boolean;
  responsiveEditing: boolean;
  stateEditing: boolean;
  motionEditing: boolean;
  interactionEditing: boolean;
  accessibilityEditing: boolean;
  tested: boolean;
  status: 'complete' | 'partial' | 'planned' | 'broken';
};

export type GlobalSymbolReference = {
  id: string;
  name: string;
  symbolType: 'header' | 'footer' | 'section' | 'card';
  version: number;
  nodeData: PageNode;
};

export type NavigationItem = {
  id: string;
  label: string;
  type: 'page' | 'external' | 'anchor' | 'action' | 'dropdown';
  pageId?: string;
  href?: string;
  action?: string;
  children?: NavigationItem[];
  visibleDesktop: boolean;
  visibleTablet: boolean;
  visibleMobile: boolean;
  position: number;
};

export type HeaderConfig = {
  variant: 'logo-left-nav-right' | 'logo-left-nav-center' | 'centered-logo' | 'transparent-overlay' | 'glass-sticky' | 'menu-first';
  logoMediaId?: string;
  logoUrl?: string;
  logoAlt?: string;
  navigationItems: NavigationItem[];
  primaryCta?: { label: string; action: string; url?: string };
  sticky: boolean;
  transparentAtTop: boolean;
  shrinkOnScroll: boolean;
  mobileMenu: 'drawer' | 'fullscreen' | 'bottom-sheet';
  appearance: Record<string, unknown>;
};

export type FooterConfig = {
  variant: 'compact' | 'multi-column' | 'newsletter-first' | 'dark-luxury' | 'minimal' | 'contact-hours-first';
  columns: Array<{ id: string; title: string; items: NavigationItem[] }>;
  contact?: Record<string, unknown>;
  socialLinks?: Array<{ platform: string; url: string; label: string }>;
  legalLinks?: NavigationItem[];
  copyright?: string;
  appearance: Record<string, unknown>;
};

export type AnnouncementConfig = {
  id: string;
  message: string;
  promoCode?: string;
  ctaText?: string;
  ctaUrl?: string;
  dismissible?: boolean;
  tickerMode?: boolean;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  appearance?: Record<string, unknown>;
};

export type VideoConfig = {
  provider: 'youtube' | 'vimeo' | 'mp4';
  videoUrl: string;
  posterImageUrl?: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  aspectRatio: '16/9' | '4/3' | '1/1';
  modalLightbox: boolean;
};

export type PopupConfig = {
  id: string;
  title: string;
  bodyText: string;
  triggerType: 'exit_intent' | 'time_delay' | 'scroll_depth' | 'click_trigger';
  delaySeconds?: number;
  scrollPercentage?: number;
  promoCode?: string;
  ctaText?: string;
  ctaUrl?: string;
  dismissible: boolean;
  startTime?: string;
  endTime?: string;
  appearance: Record<string, unknown>;
};

export type CountdownConfig = {
  targetDate: string;
  title: string;
  expiredMessage: string;
  ctaText?: string;
  ctaUrl?: string;
};

export type GlobalSiteRegionNode = {
  id: string;
  kind: 'global-symbol';
  symbolId: string;
  region: 'header' | 'footer' | 'mobile-drawer';
  overrideMode: 'synced' | 'detached';
};

export type CmsV3Site = {
  id: string;
  storeId: string;
  activeThemeId: string | null;
  draftThemeId: string | null;
  cmsV3Enabled: boolean;
  globalTokens: Partial<ThemeTokens>;
  seoSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CmsV3Page = {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  pageType: 'home' | 'menu' | 'about' | 'contact' | 'faq' | 'custom' | 'reservations' | 'appointments';
  publishedVersionId: string | null;
  draftVersionId: string | null;
  isPublished: boolean;
  seoMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CmsV3PageVersion = {
  id: string;
  pageId: string;
  storeId: string;
  versionNumber: number;
  status: 'draft' | 'published' | 'archived';
  componentTree: PageDocument;
  themeOverride?: Partial<ThemeTokens>;
  changeSummary?: string;
  createdBy?: string;
  createdAt: string;
};

export type AiOperation =
  | { type: 'add_node'; parentId?: string; component: string; variant?: string; props: Record<string, unknown>; styles?: Record<string, unknown>; behaviors?: Record<string, unknown> }
  | { type: 'update_content'; nodeId: string; patch: Record<string, unknown> }
  | { type: 'update_styles'; nodeId: string; patch: Record<string, unknown> }
  | { type: 'update_behaviors'; nodeId: string; patch: Record<string, unknown> }
  | { type: 'move_node'; nodeId: string; targetIndex: number }
  | { type: 'delete_node'; nodeId: string }
  | { type: 'create_page'; title: string; slug: string; pageType: string; initialNodes: PageNode[] };
