import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";

export interface FloorElement {
  id?: string;
  type: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  label: string;
  capacity: number;
  color_tag: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface FloorLayout {
  id: string;
  floor_id: string;
  name: string;
  is_default: boolean;
  elements?: FloorElement[];
}

export interface Floor {
  id: string;
  store_id: string;
  name: string;
  order_index: number;
  is_active: boolean;
  layouts?: FloorLayout[];
}

export function useFloors() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["floors", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/floors/${storeId}`);
      return res.data.data as Floor[];
    },
  });
}

export function useFloor(floorId: string | null) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["floor", storeId, floorId],
    enabled: !!storeId && !!floorId,
    queryFn: async () => {
      if (!floorId) return null;
      const res = await api.get(`/floors/${storeId}/${floorId}`);
      return res.data.data as Floor;
    },
  });
}

export function useSaveLayout() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useMutation({
    mutationFn: async ({
      floorId,
      layoutId,
      elements,
    }: {
      floorId: string;
      layoutId: string;
      elements: Omit<FloorElement, "id">[];
    }) => {
      const res = await api.post(
        `/floors/${storeId}/${floorId}/layouts/${layoutId}/save`,
        { elements }
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["floor", storeId, vars.floorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["floors", storeId],
      });
    },
  });
}

export function useCreateFloor() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post(`/floors/${storeId}`, {
        name,
        order_index: 0,
      });
      return res.data.data as Floor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors", storeId] });
    },
  });
}