import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssetHistory = (ativoId?: string, limit?: number) => {
  return useQuery({
    queryKey: ["asset-history", ativoId, limit],
    queryFn: async () => {
      if (!ativoId) return { data: [], count: 0 };

      let query = supabase
        .from("os")
        .select(`
          id,
          numero,
          titulo,
          status,
          status_validacao,
          data_abertura,
          data_conclusao,
          origem,
          prioridade,
          executante:executante_id(nome),
          plano:plano_id(titulo, periodicidade)
        `, { count: 'exact' })
        .eq("ativo_id", ativoId)
        .order("data_abertura", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!ativoId,
  });
};
