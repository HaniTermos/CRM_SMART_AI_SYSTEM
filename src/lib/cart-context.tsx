import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const storageKey = (slug: string) => `cart:${slug}`;

export function CartProvider({ storeSlug, children }: { storeSlug: string; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug));
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, [storeSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(items));
    } catch {}
  }, [items, storeSlug]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.product_id === item.product_id);
          if (existing) {
            return prev.map((p) =>
              p.product_id === item.product_id ? { ...p, quantity: p.quantity + qty } : p,
            );
          }
          return [...prev, { ...item, quantity: qty }];
        }),
      remove: (productId) => setItems((prev) => prev.filter((p) => p.product_id !== productId)),
      setQty: (productId, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.product_id !== productId)
            : prev.map((p) => (p.product_id === productId ? { ...p, quantity: qty } : p)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
