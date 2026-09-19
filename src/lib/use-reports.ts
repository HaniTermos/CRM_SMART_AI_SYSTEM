import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useMyStore } from "./use-my-store";

export type ReportDashboardMetrics = {
  totalRevenue: number;
  activeOrders: number;
  lowStockAlerts: number;
  totalCustomers: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    customer_name: string;
  }>;
  products: number;
  categories: number;
  categoryNames: string[];
  orders: number;
  customers: number;
};

export type ReportOrderWithItems = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
};

export function useReportMetrics() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["report-metrics", storeId],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<ReportDashboardMetrics> => {
      const res = await api.get(`/reports/${storeId}/dashboard`);
      return res.data.data;
    },
  });
}

export function useReportOrdersWithItems() {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["report-orders-with-items", storeId],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<ReportOrderWithItems[]> => {
      const res = await api.get(`/reports/${storeId}/orders-with-items`);
      return res.data.data;
    },
  });
}

export type ReportCategoryItem = {
  name: string;
  revenue: number;
  quantity: number;
};

export type ReportChannelItem = {
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
};

export function useReportRevenueByCategory(days = 90) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["report-revenue-by-category", storeId, days],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<ReportCategoryItem[]> => {
      const res = await api.get(`/reports/${storeId}/revenue-by-category?days=${days}`);
      return res.data.data;
    },
  });
}

export function useReportSalesByChannel(days = 90) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["report-sales-by-channel", storeId, days],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<ReportChannelItem[]> => {
      const res = await api.get(`/reports/${storeId}/sales-by-channel?days=${days}`);
      return res.data.data;
    },
  });
}

export type HourlyDensityItem = {
  day_of_week: number;
  hour: number;
  orders: number;
};

export function useReportHourlyDensity(weeks = 4) {
  const { data: store } = useMyStore();
  const storeId = store?.id;

  return useQuery({
    queryKey: ["report-hourly-density", storeId, weeks],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<HourlyDensityItem[]> => {
      const res = await api.get(`/reports/${storeId}/hourly-density?weeks=${weeks}`);
      return res.data.data;
    },
  });
}
