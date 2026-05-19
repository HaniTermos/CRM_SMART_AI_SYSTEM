import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth-context";

export type MyStore = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  shipping_fee: number;
  owner_user_id: string;
};

export function useMyStore() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<MyStore | null> => {
      if (!user) return null;
      
      const res = await api.get('/stores/me');
      const stores = res.data.data;
      
      if (stores && stores.length > 0) {
        return stores[0] as MyStore;
      }
      return null;
    },
  });
}
