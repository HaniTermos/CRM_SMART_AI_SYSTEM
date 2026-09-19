/**
 * CMS V3 — Portals inspector popovers to document.body so they are never clipped
 * by the sidebar overflow chain.
 */

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface InspectorPortalProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose?: () => void;
  align?: "left" | "right";
  width?: number;
  children: React.ReactNode;
}

export function InspectorPortal({
  open,
  anchorRef,
  onClose,
  align = "right",
  width = 288,
  children,
}: InspectorPortalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportPadding = 8;
    let left = align === "right" ? rect.right - width : rect.left;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));
    const top = Math.min(rect.bottom + 8, window.innerHeight - viewportPadding);
    setPosition({ top, left });
  }, [anchorRef, align, width]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || !onClose) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      const portalRoot = document.getElementById("cms-inspector-portal-root");
      if (portalRoot?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      id="cms-inspector-portal-root"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width,
        zIndex: 9999,
        maxHeight: `calc(100vh - ${position.top}px - 12px)`,
        overflowY: "auto",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
