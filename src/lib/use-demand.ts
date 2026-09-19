import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useMyStore } from "./use-my-store";

export type DemandInsight = {
  id: string;
  store_id: string;
  customer_id: string | null;
  kind: "product_demand";
  summary: string;
  next_action: string;
  email_subject: string;
  email_body: string;
  recommendations: {
    score: number;
    suggested_price: number;
    confidence: "High" | "Medium" | "Low";
    positioning: string | null;
    target_segments: string[];
    risks: string[];
  };
  model: string;
  created_at: string;
};

export function useDemandHistory() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["demand-history", storeId],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<DemandInsight[]> => {
      const res = await api.get(`/ai/${storeId}/demand-history`);
      return res.data.data;
    },
  });
}

export function useScoreDemand() {
  const { data: store } = useMyStore();
  const storeId = store?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ idea, targetPrice }: { idea: string; targetPrice?: number }) => {
      const res = await api.post(`/ai/${storeId}/demand`, { idea, targetPrice });
      return res.data.data as DemandInsight;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demand-history", storeId] });
    },
  });
}
