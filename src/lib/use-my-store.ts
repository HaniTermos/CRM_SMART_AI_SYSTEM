import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      // Find first store the user is a member of
      const { data: roleRow, error: roleErr } = await supabase
        .from("user_roles")
        .select("store_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (roleErr) throw roleErr;
      if (!roleRow?.store_id) return null;

      const { data: store, error: storeErr } = await supabase
        .from("stores")
        .select("id, name, slug, currency, shipping_fee, owner_user_id")
        .eq("id", roleRow.store_id)
        .single();

      if (storeErr) throw storeErr;
      return store as MyStore;
    },
  });
}
