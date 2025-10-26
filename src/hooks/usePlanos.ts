import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlanos(ativo_id?: string) {
  return useQuery({
    queryKey: ['planos', ativo_id],
    queryFn: async () => {
      let query = supabase
        .from("planos_manutencao")
        .select("*")
        .order("created_at", { ascending: false });

      if (ativo_id) {
        query = query.eq("ativo_id", ativo_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
