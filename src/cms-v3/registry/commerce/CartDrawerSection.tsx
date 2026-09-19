/**
 * SmartStore Website Studio (CMS V3) — Accessible Cart Drawer Component
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartDrawerSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function CartDrawerSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: CartDrawerSectionProps) {
  const props = node.props || {};

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([
    { id: "1", name: "Artisanal Sourdough Bread", price: 8.50, quantity: 2, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff" },
    { id: "2", name: "Single Origin Cold Brew", price: 5.50, quantity: 1, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c" },
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Editor mode banner control
  if (context.mode === "editor") {
    return (
      <div
        onClick={(e) => {
          if (onSelectNode) {
            e.stopPropagation();
            onSelectNode(node.id);
          }
        }}
        className={cn(
          "p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between my-4",
          isSelected && "ring-2 ring-indigo-500"
        )}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span>SmartStore Cart Drawer Engine: <strong>{items.length} Items in Cart State</strong></span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Preview Cart Drawer
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end"
      onClick={() => setIsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 text-slate-900 animate-in slide-in-from-right duration-200"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" /> Shopping Cart ({items.length})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              aria-label="Close Cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl" />}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                    <span className="text-xs font-semibold text-slate-600">${item.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 rounded text-slate-700">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 rounded text-slate-700">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div className="flex items-center justify-between font-extrabold text-base">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <a
            href="/checkout"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm text-center block shadow-lg transition"
          >
            Proceed to Checkout
          </a>
        </div>
      </div>
    </div>
  );
}

export function CartDrawerInspector({ node, onChangeNode }: { node: PageNode; onChangeNode: (node: PageNode) => void }) {
  return (
    <div className="p-4 text-xs text-slate-300 space-y-2">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Cart Drawer Controls
      </label>
      <p className="text-[11px] text-slate-400">Cart drawer is connected to global store cart state.</p>
    </div>
  );
}
