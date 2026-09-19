/**
 * SmartStore Website Studio (CMS V3) — Product Spotlight Section
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { ShoppingBag, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSpotlightSectionProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

export function ProductSpotlightSection({
  node,
  context,
  onSelectNode,
  isSelected,
}: ProductSpotlightSectionProps) {
  const props = node.props || {};
  const [selectedVariant, setSelectedVariant] = useState("500g Whole Bean");
  const [added, setAdded] = useState(false);

  const product = {
    name: (props.productName as string) || "Signature Espresso Blend",
    price: (props.price as string) || "$18.50",
    description: (props.description as string) || "Rich dark chocolate notes with caramel finish and velvety crema.",
    image: (props.imageUrl as string) || "https://images.unsplash.com/photo-1517701604599-bb29b565090c",
    variants: ["250g Ground", "500g Whole Bean", "1kg Bulk Bag"],
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn(
        "cms-v3-product-spotlight max-w-7xl mx-auto py-12 px-4 sm:px-6 my-6 bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 items-center",
        isSelected && "ring-2 ring-indigo-500 ring-offset-2"
      )}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
            <span className="text-xs font-bold text-slate-300 ml-1.5">5.0 (48 reviews)</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{product.name}</h2>
          <span className="text-2xl font-extrabold text-indigo-400 block">{product.price}</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>

        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400">Select Option:</span>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariant(v);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition border",
                  selectedVariant === v
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition flex items-center justify-center gap-2"
        >
          {added ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingBag className="w-4 h-4" />}
          <span>{added ? "Added to Cart!" : `Add ${selectedVariant} to Order`}</span>
        </button>
      </div>
    </section>
  );
}

export function ProductSpotlightInspector({ node, onChangeNode }: { node: PageNode; onChangeNode: (node: PageNode) => void }) {
  const props = node.props || {};

  const updateProp = (key: string, value: unknown) => {
    onChangeNode({ ...node, props: { ...node.props, [key]: value } });
  };

  return (
    <div className="p-4 space-y-4 text-xs text-slate-300">
      <label className="font-bold text-slate-200 flex items-center gap-1.5">
        <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Product Spotlight Controls
      </label>
      <div>
        <span className="text-[11px] text-slate-400">Product Name</span>
        <input
          type="text"
          value={(props.productName as string) || "Signature Espresso Blend"}
          onChange={(e) => updateProp("productName", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        />
      </div>
      <div>
        <span className="text-[11px] text-slate-400">Price Display</span>
        <input
          type="text"
          value={(props.price as string) || "$18.50"}
          onChange={(e) => updateProp("price", e.target.value)}
          className="w-full mt-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
        />
      </div>
    </div>
  );
}
