/**
 * SmartStore Website Studio (CMS V3) — Footer Navigation Component
 */

import React from "react";
import { PageNode, RenderContext, FooterConfig } from "../../types/cms-v3";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function FooterSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: FooterSectionProps) {
  const props = node.props || {};
  const styles = node.styles?.base || {};
  const config = (props.config as FooterConfig) || {
    variant: "multi-column",
    columns: [
      {
        id: "col-1",
        title: "Quick Links",
        items: [
          { id: "f1", label: "Home", type: "page", href: "/", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 1 },
          { id: "f2", label: "Menu Catalog", type: "page", href: "/menu", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 2 },
          { id: "f3", label: "About Us", type: "page", href: "/about", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 3 },
        ],
      },
      {
        id: "col-2",
        title: "Customer Support",
        items: [
          { id: "f4", label: "Contact Us", type: "page", href: "/contact", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 1 },
          { id: "f5", label: "FAQ & Help", type: "page", href: "/faq", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 2 },
          { id: "f6", label: "Table Reservation", type: "page", href: "/reservations", visibleDesktop: true, visibleTablet: true, visibleMobile: true, position: 3 },
        ],
      },
    ],
    contact: {
      address: "123 Culinary Avenue",
      phone: "+1 (555) 019-2834",
      email: "info@smartstore.ai",
      hours: "Mon-Sun 7:00 AM - 9:00 PM",
    },
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com", label: "Instagram" },
      { platform: "facebook", url: "https://facebook.com", label: "Facebook" },
    ],
    copyright: "© 2026 SmartStore AI. All rights reserved.",
    appearance: {},
  };

  const columns = config.columns || [];
  const contact = config.contact || {};
  const copyright = (props.copyright as string) || config.copyright || "© 2026 SmartStore AI";

  return (
    <footer
      role="contentinfo"
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-footer-section bg-slate-900 text-slate-300 py-12 border-t border-slate-800 text-xs",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Store Profile & Contact Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="font-extrabold text-base text-white tracking-tight">SmartStore</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Delivering exceptional culinary experiences with artisanal quality.
          </p>

          <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
            {Boolean(contact.address) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{String(contact.address)}</span>
              </div>
            )}
            {Boolean(contact.phone) && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <a href={`tel:${contact.phone}`} className="hover:text-white transition">
                  {String(contact.phone)}
                </a>
              </div>
            )}
            {Boolean(contact.hours) && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{String(contact.hours)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Link Columns */}
        {columns.map((col: any) => (
          <div key={col.id} className="space-y-3">
            <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider">{col.title}</h4>
            <ul className="space-y-2 text-[11px]">
              {col.items.map((item: any) => (
                <li key={item.id}>
                  <a href={item.href || "#"} className="hover:text-indigo-400 transition">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Social & Badges */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider">Connect & Follow</h4>
          <div className="flex gap-2">
            {(config.socialLinks || []).map((social: any, i: number) => (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] font-semibold"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
        <span>{copyright}</span>
        <div className="flex items-center gap-1">
          <span>Powered with</span>
          <Heart className="w-3 h-3 text-red-500 fill-current inline" />
          <span>by SmartStore AI</span>
        </div>
      </div>
    </footer>
  );
}
