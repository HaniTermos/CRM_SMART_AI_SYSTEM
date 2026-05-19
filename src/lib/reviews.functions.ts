import { api } from "./api";

export const submitReview = async ({ data }: { data: any }) => {
  // Storefront review submission uses the slug, so the backend can resolve the store.
  const res = await api.post(`/reviews/${data.storeSlug}/submit`, data);
  return { ok: true, verified: res.data.data.verified };
};

export const listReviews = async ({ data }: { data: { storeId: string; status: string } }) => {
  const res = await api.get(`/reviews/${data.storeId}?status=${data.status}`);
  return res.data.data;
};

export const setReviewStatus = async ({ data }: { data: { storeId: string; id: string; status: string } }) => {
  await api.patch(`/reviews/${data.storeId}/${data.id}/status`, { status: data.status });
  return { ok: true };
};

export const deleteReview = async ({ data }: { data: { storeId: string; id: string } }) => {
  await api.delete(`/reviews/${data.storeId}/${data.id}`);
  return { ok: true };
};
