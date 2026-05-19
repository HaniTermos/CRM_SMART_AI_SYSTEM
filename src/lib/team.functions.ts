import { api } from "./api";

type RoleEnum = "admin" | "staff" | "owner";

export const inviteTeamMember = async ({ data }: { data: { storeId: string; email: string; role: RoleEnum } }) => {
  const res = await api.post(`/team/${data.storeId}`, {
    email: data.email,
    role: data.role,
  });
  return { ok: true, userId: res.data.data.user_id };
};

export const removeTeamMember = async ({ data }: { data: { storeId: string; userId: string } }) => {
  await api.delete(`/team/${data.storeId}/${data.userId}`);
  return { ok: true };
};

export const listTeamMembers = async ({ data }: { data: { storeId: string } }) => {
  const res = await api.get(`/team/${data.storeId}`);
  return res.data.data;
};

export const updateStoreSettings = async ({ data }: { data: { storeId: string; name: string; currency: string; shipping_fee: number } }) => {
  await api.put(`/stores/${data.storeId}`, {
    name: data.name,
    currency: data.currency,
    shipping_fee: data.shipping_fee,
  });
  return { ok: true };
};
