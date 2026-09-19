/**
 * SmartStore Website Studio (CMS V3) — Commerce & Content Sections
 */

import React, { useState, useEffect } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { resolveComponentNode } from "../../renderer/contracts";
import { cn } from "@/lib/utils";
import { ChevronDown, ShoppingBag, Star, HelpCircle, Image as ImageIcon } from "lucide-react";

interface SectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

// 1. Product Grid Section
export function ProductGridSection({ node, context, onSelectNode, isSelected }: SectionProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const s = resolution.resolvedStyles;

  const title = (p.title as string) || "Featured Products";
  const subtitle = (p.subtitle as string) || "Explore our best selling menu & store items";
  const columns = Number(p.columns || 3);

  const sampleProducts = [
    { id: "1", name: "Artisanal Sourdough Bread", price: "$8.50", category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff" },
    { id: "2", name: "Butter Croissant 4-Pack", price: "$12.00", category: "Pastry", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a" },
    { id: "3", name: "Single Origin Cold Brew", price: "$5.50", category: "Coffee", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c" },
  ];

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-7xl mx-auto space-y-8", isSelected && "ring-2 ring-indigo-500")}
    >
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>

      <div className={cn("grid gap-6", columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
        {sampleProducts.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition">
            <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{item.category}</span>
              <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
              <div className="flex items-center justify-between pt-2">
                <span className="font-extrabold text-slate-900">{item.price}</span>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Order Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// 2. Story / About Section
export function StoryAboutSection({ node, context, onSelectNode, isSelected }: SectionProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;

  const eyebrow = (p.eyebrow as string) || "Our Passion";
  const title = (p.title as string) || "Crafting Memories Since 2018";
  const story = (p.story as string) || "We believe in honest ingredients, traditional techniques, and genuine hospitality.";
  const imageUrl = (p.imageUrl as string) || "https://images.unsplash.com/photo-1556910103-1c02745aae4d";

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center", isSelected && "ring-2 ring-indigo-500")}
    >
      <div className="space-y-4">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{eyebrow}</span>
        <h2 className="text-3xl font-extrabold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{story}</p>
      </div>
      <img src={imageUrl} alt={title} className="w-full h-80 object-cover rounded-2xl shadow-lg border border-slate-200" />
    </section>
  );
}

// 3. FAQ Accordion Section
export function FaqAccordionSection({ node, context, onSelectNode, isSelected }: SectionProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const title = (p.title as string) || "Frequently Asked Questions";
  const items = Array.isArray(p.items) ? p.items : [
    { question: "What are your opening hours?", answer: "We are open Monday through Sunday from 7:00 AM to 9:00 PM." },
    { question: "Do you offer vegan and gluten-free options?", answer: "Yes! We have dedicated vegan pastries and gluten-free sourdough options daily." },
    { question: "Can I place catering orders online?", answer: "Absolutely. You can use our online form or contact us 48 hours in advance." }
  ];

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-3xl mx-auto space-y-6", isSelected && "ring-2 ring-indigo-500")}
    >
      <h2 className="text-2xl font-extrabold text-slate-900 text-center">{title}</h2>
      <div className="space-y-3">
        {items.map((faq: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full p-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between"
            >
              <span>{faq.question}</span>
              <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", openIdx === idx && "rotate-180")} />
            </button>
            {openIdx === idx && (
              <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// 4. Testimonials Section
export function TestimonialsSection({ node, context, onSelectNode, isSelected }: SectionProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;

  const reviews = [
    { author: "Sarah M.", text: "The best sourdough in town. Incredible texture and crust!", rating: 5 },
    { author: "David K.", text: "Fantastic coffee and friendly staff. My favorite morning spot.", rating: 5 },
  ];

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-5xl mx-auto space-y-6 text-center", isSelected && "ring-2 ring-indigo-500")}
    >
      <h2 className="text-2xl font-extrabold text-slate-900">Loved by Our Community</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 text-left">
            <div className="flex gap-1 text-amber-400">
              {[...Array(r.rating)].map((_, idx) => (
                <Star key={idx} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 italic">"{r.text}"</p>
            <span className="text-xs font-bold text-slate-900 block">— {r.author}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
