import { api } from "./api";

export const placeOrder = async ({ data }: { data: any }) => {
  // We use a storefront-specific endpoint that resolves the storeSlug internally
  const res = await api.post(`/public/stores/${data.storeSlug}/checkout`, data);
  return res.data.data;
};
