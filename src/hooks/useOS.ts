import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioId } from "./useCondominioId";

export function useOS() {
  const { condominioId } = useCondominioId();

  return useQuery({
    queryKey: ["os", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os")
        .select("*")
        .eq("condominio_id", condominioId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
