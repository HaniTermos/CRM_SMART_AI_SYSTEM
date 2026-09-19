import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";

export interface Reservation {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone?: string;
  guests: number;
  date: string;
  time: string;
  floor_id?: string;
  table_label?: string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show";
  notes?: string;
  created_at: string;
}

export function useReservations(filters?: { date?: string; status?: string }) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["reservations", storeId, filters?.date, filters?.status],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/reservations/${storeId}`, { params: filters });
      return res.data.data as Reservation[];
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useMutation({
    mutationFn: async (data: Omit<Reservation, "id" | "store_id" | "created_at">) => {
      const res = await api.post(`/reservations/${storeId}`, data);
      return res.data.data as Reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", storeId] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reservation> & { id: string }) => {
      const res = await api.put(`/reservations/${storeId}/${id}`, updates);
      return res.data.data as Reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", storeId] });
    },
  });
}
