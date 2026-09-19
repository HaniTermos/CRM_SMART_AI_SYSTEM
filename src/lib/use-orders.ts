import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useMyStore } from "./use-my-store";

export type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type AdminOrder = {
  id: string;
  store_id: string;
  customer_id: string;
  order_number: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  payment_status?: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  table_label?: string;
  floor_id?: string;
  shipping_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_phone?: string;
  items?: OrderItem[];
};

export function useOrders() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["orders", storeId],
    enabled: !!storeId,
    refetchInterval: 30000,
    queryFn: async (): Promise<AdminOrder[]> => {
      const res = await api.get(`/orders/${storeId}`);
      return res.data.data;
    },
  });
}
