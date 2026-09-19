/**
 * CMS V3 — Typed CSS value helpers for inspector editors
 */

export type CssUnit = "px" | "%" | "rem" | "em" | "vw" | "vh";

export type CornerValues = {
  topLeft: string;
  topRight: string;
  bottomRight: string;
  bottomLeft: string;
  linked: boolean;
};

export type BoxShadowState = {
  preset: string;
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  opacity: number;
  inset: boolean;
};

export const SHADOW_PRESETS: Record<string, string> = {
  none: "none",
  subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  small: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  medium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  large: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  floating: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  glow: "0 0 20px 4px rgb(99 102 241 / 0.35)",
};

export function parseCssLength(raw: string | undefined): { value: string; unit: CssUnit } {
  if (!raw || raw === "auto") return { value: "", unit: "px" };
  const match = String(raw).trim().match(/^(-?\d*\.?\d+)(px|%|rem|em|vw|vh)?$/);
  if (!match) return { value: "", unit: "px" };
  return { value: match[1], unit: (match[2] as CssUnit) || "px" };
}

export function formatCssLength(value: string, unit: CssUnit): string {
  if (!value) return "";
  return `${value}${unit}`;
}

export function readBorderRadiusFromStyles(styles: Record<string, unknown>): CornerValues {
  const unified = (styles.borderRadius as string) || "";
  const tl = (styles.borderTopLeftRadius as string) || "";
  const tr = (styles.borderTopRightRadius as string) || "";
  const br = (styles.borderBottomRightRadius as string) || "";
  const bl = (styles.borderBottomLeftRadius as string) || "";

  if (unified && !tl && !tr && !br && !bl) {
    return { topLeft: unified, topRight: unified, bottomRight: unified, bottomLeft: unified, linked: true };
  }

  const allSame = tl && tl === tr && tr === br && br === bl;
  return {
    topLeft: tl || unified,
    topRight: tr || unified,
    bottomRight: br || unified,
    bottomLeft: bl || unified,
    linked: allSame || (!tr && !br && !bl && !!tl),
  };
}

export function writeBorderRadiusPatch(corners: CornerValues): Record<string, unknown> {
  const { topLeft, topRight, bottomRight, bottomLeft, linked } = corners;

  if (!topLeft && !topRight && !bottomRight && !bottomLeft) {
    return {
      borderRadius: undefined,
      borderTopLeftRadius: undefined,
      borderTopRightRadius: undefined,
      borderBottomRightRadius: undefined,
      borderBottomLeftRadius: undefined,
    };
  }

  if (linked) {
    return {
      borderRadius: topLeft || undefined,
      borderTopLeftRadius: undefined,
      borderTopRightRadius: undefined,
      borderBottomRightRadius: undefined,
      borderBottomLeftRadius: undefined,
    };
  }

  return {
    borderRadius: undefined,
    borderTopLeftRadius: topLeft || undefined,
    borderTopRightRadius: topRight || undefined,
    borderBottomRightRadius: bottomRight || undefined,
    borderBottomLeftRadius: bottomLeft || undefined,
  };
}

export function boxShadowToCss(state: BoxShadowState): string {
  if (state.preset !== "custom") {
    return SHADOW_PRESETS[state.preset] || "none";
  }
  const alpha = Math.max(0, Math.min(1, state.opacity));
  const rgb = hexToRgb(state.color || "#000000");
  const inset = state.inset ? "inset " : "";
  return `${inset}${state.x || "0"}px ${state.y || "0"}px ${state.blur || "0"}px ${state.spread || "0"}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  const num = parseInt(cleaned.slice(0, 6), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function readBoxShadowFromCss(raw: string | undefined): BoxShadowState {
  const val = (raw || "none").trim();
  if (!val || val === "none") {
    return { preset: "none", x: "0", y: "4", blur: "6", spread: "0", color: "#000000", opacity: 0.1, inset: false };
  }

  for (const [key, presetVal] of Object.entries(SHADOW_PRESETS)) {
    if (key !== "custom" && presetVal === val) {
      return { preset: key, x: "0", y: "4", blur: "6", spread: "0", color: "#000000", opacity: 0.1, inset: false };
    }
  }

  const inset = val.startsWith("inset");
  const nums = val.replace(/inset\s*/i, "").match(/-?\d+\.?\d*px/g) || [];
  return {
    preset: "custom",
    x: nums[0]?.replace("px", "") || "0",
    y: nums[1]?.replace("px", "") || "0",
    blur: nums[2]?.replace("px", "") || "0",
    spread: nums[3]?.replace("px", "") || "0",
    color: "#000000",
    opacity: 0.15,
    inset,
  };
}
