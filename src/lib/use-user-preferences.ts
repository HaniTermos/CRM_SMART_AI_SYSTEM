import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth-context";

export type DashboardTheme = "light" | "dark" | "system";
export type NavMode = "dock" | "sidebar";
export type Density = "compact" | "comfortable";
export type DefaultDateRange = "7d" | "30d" | "90d" | "12m";

export type UserPreferences = {
  id: string;
  user_id: string;
  dashboard_theme: DashboardTheme;
  nav_mode: NavMode;
  density: Density;
  reduced_motion: boolean;
  default_date_range: DefaultDateRange;
  default_dashboard_page: string;
  created_at: string;
  updated_at: string;
};

export function useUserPreferences() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["user-preferences", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<UserPreferences> => {
      const res = await api.get("/users/me/preferences");
      return res.data.data;
    },
    staleTime: Infinity,
  });
}

export function useUpdateUserPreferences() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const res = await api.patch("/users/me/preferences", updates);
      return res.data.data as UserPreferences;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-preferences", user?.id] });
    },
  });
}
