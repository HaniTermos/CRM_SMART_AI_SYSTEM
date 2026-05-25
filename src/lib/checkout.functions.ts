import { api } from "./api";

export const placeOrder = async ({ data }: { data: any }) => {
  const res = await api.post(`/public/stores/${data.storeSlug}/checkout`, data);
  return res.data.data;
};
