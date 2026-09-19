import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useMyStore } from "./use-my-store";

export type Pipeline = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Stage = {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Deal = {
  id: string;
  store_id: string;
  pipeline_id: string;
  stage_id: string;
  customer_id: string | null;
  title: string;
  value: number;
  status: "open" | "won" | "lost";
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string | null;
};

const STAGE_COLORS = ["#8B5CF6", "#3B82F6", "#00E0FF", "#F59E0B", "#EF4444", "#03CF94"];

export function useCrmPipelines() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["crm-pipelines", storeId],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<Pipeline[]> => {
      const res = await api.get(`/crm/${storeId}/pipelines`);
      return res.data.data;
    },
  });
}

export function useCrmStages(pipelineId: string | undefined) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["crm-stages", storeId, pipelineId],
    enabled: !!storeId && !!pipelineId,
    staleTime: 60000,
    queryFn: async (): Promise<Stage[]> => {
      const res = await api.get(`/crm/${storeId}/pipelines/${pipelineId}/stages`);
      return res.data.data;
    },
  });
}

export function useCrmDeals(pipelineId: string | undefined) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["crm-deals", storeId, pipelineId],
    enabled: !!storeId,
    staleTime: 30000,
    queryFn: async (): Promise<Deal[]> => {
      const q = pipelineId ? `?pipelineId=${pipelineId}` : "";
      const res = await api.get(`/crm/${storeId}/deals${q}`);
      return res.data.data;
    },
  });
}

export function getStageColor(index: number) {
  return STAGE_COLORS[index % STAGE_COLORS.length];
}
