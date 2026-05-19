import { api } from "./api";

export const scoreProductIdea = async ({ data }: { data: any }) => {
  const res = await api.post(`/ai/${data.storeId}/demand`, data);
  return res.data.data;
};
