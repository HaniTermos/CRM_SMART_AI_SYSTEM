import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth-context";

export type ReservationsBreakdown = {
  pending: number;
  confirmed: number;
  seated: number;
  completed: number;
  noShow: number;
  cancelled: number;
};

export type DashboardStats = {
  store: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    shipping_fee: number;
    phone: string;
    email: string;
    address: string;
    timezone: string;
    isOpen: boolean;
  };
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueComparison: number;

  todayOrders: number;
  todayTotalOrders: number;
  todayCompletedOrders: number;
  todayPendingOrders: number;
  todayCancelledOrders: number;
  yesterdayOrders: number;
  orderComparison: number;

  avgOrderValue: number;
  totalCustomers: number;

  avgPrepTime: number;
  avgTotalTicketTime: number;
  avgActivePrepTime: number;

  tonightReservations: number;
  reservationsBreakdown: ReservationsBreakdown;

  totalOrders: number;
  hasActivity: boolean;
  timezoneUsed: string;
};

export function useDashboardStats() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<DashboardStats> => {
      const res = await api.get("/stores/me/dashboard");
      return res.data.data;
    },
    staleTime: 30000,
    retry: 2,
  });
}
