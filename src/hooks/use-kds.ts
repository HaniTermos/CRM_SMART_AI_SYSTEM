import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";

export interface KitchenItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface KitchenTicket {
  id: string;
  store_id: string;
  order_id: string;
  order_number: string;
  customer_name?: string;
  table_label?: string;
  floor_id?: string;
  status: "pending" | "preparing" | "in_prep" | "ready" | "completed" | "cancelled";
  station: string;
  priority: number;
  order_notes?: string;
  items: KitchenItem[];
  created_at: string;
  started_at?: string;
  ready_at?: string;
}

export function useKitchenTickets(statusFilter?: string) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["kitchen-tickets", storeId, statusFilter],
    enabled: !!storeId,
    refetchInterval: 3000, // 3-second live polling for KDS
    queryFn: async () => {
      const res = await api.get(`/kitchen/${storeId}`, {
        params: { status: statusFilter }
      });
      return res.data.data as KitchenTicket[];
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/kitchen/${storeId}/${id}/status`, { status });
      return res.data.data as KitchenTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", storeId] });
      queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
    },
  });
}
