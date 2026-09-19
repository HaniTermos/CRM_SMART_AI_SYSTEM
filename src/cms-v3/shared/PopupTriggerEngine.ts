/**
 * SmartStore Website Studio (CMS V3) — Shared Popup Trigger Engine
 */

import { PopupConfig, RenderContext } from "../types/cms-v3";

export class PopupTriggerEngine {
  /**
   * Checks if popup is dismissed in localStorage
   */
  static isDismissed(popupId: string): boolean {
    if (typeof window === "undefined") return false;
    const item = localStorage.getItem(`cms_v3_popup_dismissed_${popupId}`);
    return Boolean(item);
  }

  /**
   * Persists dismissal in localStorage
   */
  static setDismissed(popupId: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(`cms_v3_popup_dismissed_${popupId}`, Date.now().toString());
  }

  /**
   * Evaluates active schedule window
   */
  static isScheduledActive(startTime?: string, endTime?: string): boolean {
    if (!startTime && !endTime) return true;
    const now = new Date();
    if (startTime && new Date(startTime) > now) return false;
    if (endTime && new Date(endTime) < now) return false;
    return true;
  }

  /**
   * Attaches listeners for popup triggers (time_delay, exit_intent, scroll_depth)
   * Note: Editor mode bypasses auto-triggers to prevent editor interference.
   */
  static listenForTrigger(
    config: PopupConfig,
    context: RenderContext,
    onTrigger: () => void
  ): () => void {
    // 1. Do NOT auto-execute popup triggers in editor mode
    if (context.mode === "editor") {
      return () => {};
    }

    if (this.isDismissed(config.id)) {
      return () => {};
    }

    if (!this.isScheduledActive(config.startTime, config.endTime)) {
      return () => {};
    }

    let timeoutId: NodeJS.Timeout | null = null;

    // Time Delay Trigger
    if (config.triggerType === "time_delay") {
      const delay = (config.delaySeconds || 5) * 1000;
      timeoutId = setTimeout(() => {
        onTrigger();
      }, delay);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    // Exit Intent Trigger (mouseleave at top of viewport)
    if (config.triggerType === "exit_intent") {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          onTrigger();
          window.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
      window.addEventListener("mouseleave", handleMouseLeave);
      return () => window.removeEventListener("mouseleave", handleMouseLeave);
    }

    // Scroll Depth Trigger
    if (config.triggerType === "scroll_depth") {
      const targetRatio = (config.scrollPercentage || 50) / 100;
      const handleScroll = () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0 && window.scrollY / total >= targetRatio) {
          onTrigger();
          window.removeEventListener("scroll", handleScroll);
        }
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }

    return () => {};
  }
}
