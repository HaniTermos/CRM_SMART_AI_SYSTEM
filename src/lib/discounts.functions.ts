import { api } from "./api";

export const listDiscounts = async ({ data }: { data: { storeId: string } }) => {
  const res = await api.get(`/discounts/${data.storeId}`);
  return res.data.data;
};

export const createDiscount = async ({ data }: { data: any }) => {
  await api.post(`/discounts/${data.storeId}`, data);
  return { ok: true };
};

export const toggleDiscount = async ({ data }: { data: { storeId: string; id: string; active: boolean } }) => {
  await api.patch(`/discounts/${data.storeId}/${data.id}/toggle`, { active: data.active });
  return { ok: true };
};

export const deleteDiscount = async ({ data }: { data: { storeId: string; id: string } }) => {
  await api.delete(`/discounts/${data.storeId}/${data.id}`);
  return { ok: true };
};

export const validateDiscount = async ({ data }: { data: { storeSlug: string; code: string; subtotal: number; phone?: string; email?: string } }) => {
  try {
    const res = await api.post(`/public/stores/${data.storeSlug}/discounts/validate`, data);
    return { ok: true, ...res.data.data };
  } catch (error: any) {
    return { ok: false, error: error.response?.data?.error || "Validation failed" };
  }
};
