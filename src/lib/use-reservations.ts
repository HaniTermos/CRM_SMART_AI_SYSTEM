import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useMyStore } from "./use-my-store";

export type Reservation = {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string | null;
  guests: number;
  date: string;
  time: string;
  floor_id: string | null;
  table_label: string | null;
  status: "pending" | "confirmed" | "seated" | "completed" | "no_show" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useReservations(date?: string, status?: string) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["reservations", storeId, date, status],
    enabled: !!storeId,
    queryFn: async (): Promise<Reservation[]> => {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (status) params.set("status", status);
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/reservations/${storeId}${q}`);
      return res.data.data;
    },
    staleTime: 30000,
    retry: 2,
  });
}
