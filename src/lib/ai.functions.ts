import { api } from "./api";

export const generateCustomerInsight = async ({ data }: { data: { storeId: string; customerId: string } }) => {
  const res = await api.post(`/ai/${data.storeId}/customer/${data.customerId}/generate`);
  return res.data.data;
};
