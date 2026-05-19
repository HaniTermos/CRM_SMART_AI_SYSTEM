import { api } from "./api";

type Reason = "manual" | "restock" | "correction" | "damage" | "return";

export const adjustStock = async ({ data }: { data: {
  storeId: string;
  productId: string;
  delta: number;
  reason: Reason;
  note: string | null;
} }) => {
  const res = await api.post(`/inventory/${data.storeId}/adjust`, {
    product_id: data.productId,
    delta: data.delta,
    reason: data.reason,
    note: data.note,
  });
  return { ok: true, newStock: res.data.data.stock };
};

export const listInventory = async ({ data }: { data: { storeId: string } }) => {
  // Fetch both products and inventory adjustments using standard REST endpoints
  const [productsRes, adjustmentsRes] = await Promise.all([
    api.get(`/products/${data.storeId}`),
    api.get(`/inventory/${data.storeId}`)
  ]);
  
  return {
    products: productsRes.data.data || [],
    adjustments: adjustmentsRes.data.data || []
  };
};
