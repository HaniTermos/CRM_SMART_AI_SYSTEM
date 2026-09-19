import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth-context";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type NotificationItem = {
  id: string;
  store_id: string | null;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function useNotifications({ unreadOnly = false, limit = 50 } = {}) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id, unreadOnly, limit],
    enabled: !!user && !loading,
    queryFn: async (): Promise<NotificationItem[]> => {
      const res = await api.get("/notifications", {
        params: { unread_only: unreadOnly, limit },
      });
      return res.data.data;
    },
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationCount() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<number> => {
      const res = await api.get("/notifications/unread-count");
      return res.data.data.count;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data.data as NotificationItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count", user?.id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch("/notifications/read-all");
      return res.data.data as { marked: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count", user?.id] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count", user?.id] });
    },
  });
}
