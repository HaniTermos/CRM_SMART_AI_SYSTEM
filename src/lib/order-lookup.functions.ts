import { api } from "./api";

export const lookupOrder = async ({ data }: { data: any }) => {
  try {
    const res = await api.post(`/public/stores/${data.storeSlug}/orders/lookup`, data);
    return { ok: true, ...res.data.data };
  } catch (err: any) {
    return { ok: false, error: err.response?.data?.error || "Lookup failed" };
  }
};
