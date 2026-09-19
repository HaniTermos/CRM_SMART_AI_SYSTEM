/**
 * SmartStore Website Studio (CMS V3) — Accessible Mobile Navigation Drawer Component
 */

import React, { useEffect, useRef } from "react";
import { PageNode, RenderContext, NavigationItem } from "../../types/cms-v3";
import { X, ChevronRight, Phone, MessageSquare, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDrawerSectionProps {
  isOpen: boolean;
  onClose: () => void;
  items?: NavigationItem[];
  phone?: string;
  whatsapp?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function MobileDrawerSection({
  isOpen,
  onClose,
  items = [
    { id: "m1", label: "Home", type: "page", href: "/", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 1 },
    { id: "m2", label: "Menu Catalog", type: "page", href: "/menu", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 2 },
    { id: "m3", label: "About Us", type: "page", href: "/about", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 3 },
    { id: "m4", label: "Contact Us", type: "page", href: "/contact", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 4 },
  ],
  phone = "+1 (555) 019-2834",
  whatsapp,
  triggerRef,
}: MobileDrawerSectionProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // 1. Body Scroll Lock & Cleanup
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 2. Escape Key Listener & Focus Trap & Focus Restoration
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        triggerRef?.current?.focus();
        return;
      }

      // Focus Trap inside open drawer dialog
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto text-slate-900 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <span className="font-extrabold text-base text-indigo-600">SmartStore</span>
          <button
            onClick={() => {
              onClose();
              triggerRef?.current?.focus();
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            aria-label="Close Mobile Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="py-6 space-y-2 flex-1">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href || "#"}
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-slate-800 font-bold text-sm transition"
            >
              <span>{item.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}
        </nav>

        {/* Footer Contact Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Call Us: {phone}</span>
            </a>
          )}
          <a
            href="/menu"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Online Now</span>
          </a>
        </div>
      </div>
    </div>
  );
}
