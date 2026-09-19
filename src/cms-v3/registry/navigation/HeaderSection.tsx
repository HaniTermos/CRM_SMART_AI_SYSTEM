/**
 * SmartStore Website Studio (CMS V3) — Header Navigation Component
 */

import React, { useState, useEffect } from "react";
import { PageNode, RenderContext, NavigationItem, HeaderConfig } from "../../types/cms-v3";
import { ShoppingCart, Menu, ChevronDown, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
  onOpenMobileMenu?: () => void;
}

export function HeaderSection({
  node,
  context,
  onSelectNode,
  isSelected,
  onOpenMobileMenu,
}: HeaderSectionProps) {
  const props = node.props || {};
  const styles = node.styles?.base || {};
  const config = (props.config as HeaderConfig) || {
    variant: "logo-left-nav-right",
    logoText: "SmartStore",
    navigationItems: [
      { id: "nav-1", label: "Home", type: "page", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 1 },
      { id: "nav-2", label: "Menu", type: "page", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 2 },
      { id: "nav-3", label: "About Us", type: "page", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 3 },
      { id: "nav-4", label: "Contact", type: "page", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 4 },
    ],
    primaryCta: { label: "Order Online", action: "order", url: "/menu" },
    sticky: true,
    transparentAtTop: false,
    shrinkOnScroll: true,
    mobileMenu: "drawer",
    appearance: {},
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    if (!config.shrinkOnScroll && !config.sticky) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [config.shrinkOnScroll, config.sticky]);

  const navItems = config.navigationItems || [];
  const logoText = (props.logoText as string) || (config as any).logoText || "SmartStore";
  const logoUrl = (props.logoUrl as string) || config.logoUrl;

  return (
    <header
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-header-section w-full transition-all duration-300 z-40",
        config.sticky && "sticky top-0 left-0 right-0 shadow-xs",
        config.transparentAtTop && !isScrolled ? "bg-transparent text-white" : "bg-white border-b border-slate-200 text-slate-900",
        isScrolled && config.shrinkOnScroll ? "py-2.5" : "py-4",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={config.logoAlt || logoText} className="h-9 w-auto object-contain" />
          ) : (
            <span className="font-extrabold text-lg tracking-tight text-indigo-600">{logoText}</span>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
          {navItems
            .filter((item: NavigationItem) => item.visibleDesktop !== false)
            .map((item: NavigationItem) => {
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => hasChildren && setActiveDropdownId(item.id)}
                  onMouseLeave={() => hasChildren && setActiveDropdownId(null)}
                >
                  <a
                    href={item.href || "#"}
                    className="hover:text-indigo-600 transition flex items-center gap-1 py-1"
                  >
                    <span>{item.label}</span>
                    {hasChildren && <ChevronDown className="w-3 h-3 text-slate-400" />}
                  </a>

                  {/* Dropdown Menu */}
                  {hasChildren && activeDropdownId === item.id && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs space-y-1 z-50">
                      {item.children!.map((child: NavigationItem) => (
                        <a
                          key={child.id}
                          href={child.href || "#"}
                          className="block px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Actions (Cart & Primary CTA & Mobile Menu Trigger) */}
        <div className="flex items-center gap-3">
          {/* Cart CTA Button */}
          <a
            href={context.storeId ? `/shop/${context.storeId}/cart` : "#"}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition relative"
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </a>

          {/* Primary CTA */}
          {config.primaryCta && (
            <a
              href={config.primaryCta.url || "/menu"}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition"
            >
              <span>{config.primaryCta.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Mobile Menu Trigger Button */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
