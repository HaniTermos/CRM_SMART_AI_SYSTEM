import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "./use-my-store";

export type Alert = {
  id: string;
  kind: "pending_order" | "low_stock" | "reengage";
  title: string;
  detail: string;
  href: string;
  createdAt: string; // ISO
};

const LOW_STOCK_THRESHOLD = 5;

export function useAlerts() {
  const { data: store } = useMyStore();

  return useQuery({
    queryKey: ["alerts", store?.id],
    enabled: !!store?.id,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Alert[]> => {
      const storeId = store!.id;
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [pendingRes, lowStockRes, reengageRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, total, created_at, shipping_address")
          .eq("store_id", storeId)
          .eq("status", "pending")
          .gte("created_at", dayAgo)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("products")
          .select("id, name, stock, status")
          .eq("store_id", storeId)
          .eq("status", "active")
          .lt("stock", LOW_STOCK_THRESHOLD)
          .order("stock", { ascending: true })
          .limit(25),
        supabase
          .from("customers")
          .select("id, name, phone, segment, total_orders, total_spent, last_order_at")
          .eq("store_id", storeId)
          .in("segment", ["vip", "active"])
          .lt("last_order_at", monthAgo)
          .gte("last_order_at", twoMonthsAgo)
          .order("total_spent", { ascending: false })
          .limit(25),
      ]);

      if (pendingRes.error) throw pendingRes.error;
      if (lowStockRes.error) throw lowStockRes.error;
      if (reengageRes.error) throw reengageRes.error;

      const out: Alert[] = [];

      for (const o of pendingRes.data ?? []) {
        const addr = (o.shipping_address ?? {}) as { name?: string };
        out.push({
          id: `pending:${o.id}`,
          kind: "pending_order",
          title: `New order ${o.order_number}`,
          detail: `${addr.name ?? "Customer"} · ${store?.currency ?? ""} ${Number(o.total).toFixed(2)}`,
          href: `/orders/${o.id}`,
          createdAt: o.created_at,
        });
      }

      for (const p of lowStockRes.data ?? []) {
        out.push({
          id: `lowstock:${p.id}`,
          kind: "low_stock",
          title: `Low stock: ${p.name}`,
          detail: p.stock === 0 ? "Out of stock" : `Only ${p.stock} left`,
          href: `/products/${p.id}`,
          createdAt: new Date().toISOString(),
        });
      }

      for (const c of reengageRes.data ?? []) {
        out.push({
          id: `reengage:${c.id}`,
          kind: "reengage",
          title: `Re-engage ${c.name ?? c.phone}`,
          detail: `${c.segment} · last ordered ${c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}`,
          href: `/customers/${c.id}`,
          createdAt: c.last_order_at ?? new Date().toISOString(),
        });
      }

      return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  });
}

const READ_KEY = (storeId: string) => `alerts-read:${storeId}`;

export function getReadIds(storeId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY(storeId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setReadIds(storeId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY(storeId), JSON.stringify([...ids]));
  window.dispatchEvent(new CustomEvent("alerts-read-changed"));
}
