export type CmsSectionType =
  | "hero"
  | "featured_menu"
  | "about"
  | "gallery"
  | "testimonials"
  | "faq"
  | "contact_form"
  | "appointment"
  | "map"
  | "opening_hours"
  | "rich_text"
  | "cta"
  | "social_links"
  | "divider";

export interface MotionSettings {
  animation?: "none" | "fade" | "slide_up" | "slide_left" | "slide_right" | "zoom" | "stagger";
  duration?: number; // in seconds
  delay?: number; // in seconds
  hoverEffect?: "none" | "zoom" | "glow" | "lift";
}

export interface SectionLayoutSettings {
  width?: "contained" | "wide" | "full";
  padding_top?: "none" | "small" | "medium" | "large";
  padding_bottom?: "none" | "small" | "medium" | "large";
  alignment?: "left" | "center" | "right";
  direction?: "ltr" | "rtl";
  split_direction?: "image_left" | "image_right";
  mobile_stack?: "image_first" | "text_first";
}

export interface SectionAppearanceSettings {
  color_scheme?: "default" | "light" | "dark" | "primary" | "accent" | "surface";
  background_image?: string;
  background_overlay_opacity?: number;
  border_radius?: "none" | "small" | "medium" | "large" | "full";
  glass_effect?: boolean;
  shadow?: "none" | "sm" | "md" | "lg" | "glow";
  motion?: MotionSettings;
}

export function getMotionCssClasses(motion?: MotionSettings): string {
  if (!motion || motion.animation === "none") return "";

  const anim = motion.animation || "fade";
  const hover = motion.hoverEffect || "none";

  const animClasses: Record<string, string> = {
    fade: "animate-in fade-in duration-500",
    slide_up: "animate-in fade-in slide-in-from-bottom-4 duration-500",
    slide_left: "animate-in fade-in slide-in-from-right-4 duration-500",
    slide_right: "animate-in fade-in slide-in-from-left-4 duration-500",
    zoom: "animate-in fade-in zoom-in-95 duration-500",
    stagger: "animate-in fade-in duration-700",
  };

  const hoverClasses: Record<string, string> = {
    zoom: "transition-transform hover:scale-[1.02]",
    glow: "transition-shadow hover:shadow-xl hover:shadow-primary/20",
    lift: "transition-transform hover:-translate-y-1",
  };

  return `${animClasses[anim] || ""} ${hoverClasses[hover] || ""}`.trim();
}
