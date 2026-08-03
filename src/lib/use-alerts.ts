import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "./use-my-store";

export type Alert = {
  id: string;
  kind: "pending_order" | "low_stock" | "reengage";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
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
      const res = await api.get(`/stores/${storeId}/alerts`);
      return res.data.data;
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
