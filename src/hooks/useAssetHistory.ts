import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssetHistory = (ativoId?: string) => {
  return useQuery({
    queryKey: ["asset-history", ativoId],
    queryFn: async () => {
      if (!ativoId) return [];

      const { data, error } = await supabase
        .from("os")
        .select(`
          id,
          numero,
          titulo,
          status,
          status_validacao,
          data_abertura,
          data_conclusao,
          executante:executante_id(nome),
          plano:plano_id(titulo, periodicidade)
        `)
        .eq("ativo_id", ativoId)
        .order("data_abertura", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!ativoId,
  });
};
