import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export const useAtivosOptimized = () => {
  const { condominio } = useCondominioAtual();

  return useQuery({
    queryKey: ["ativos-optimized", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];

      const { data, error } = await supabase
        .from("ativos")
        .select(`
          id,
          nome,
          local,
          tipo_id,
          requer_conformidade,
          status_conformidade,
          is_ativo,
          ativo_tipos(id, nome, slug, criticidade)
        `)
        .eq("condominio_id", condominio.id)
        .eq("is_ativo", true)
        .order("nome");

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
    staleTime: 30000, // 30 seconds
  });
};
