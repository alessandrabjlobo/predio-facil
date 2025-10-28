import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export const usePlanosOptimized = () => {
  const { condominio } = useCondominioAtual();

  return useQuery({
    queryKey: ["planos-optimized", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];

      const { data, error } = await supabase
        .from("planos_manutencao")
        .select(`
          id,
          titulo,
          tipo,
          periodicidade,
          proxima_execucao,
          is_legal,
          ativo_id,
          ativos(id, nome, tipo_id)
        `)
        .eq("condominio_id", condominio.id)
        .order("proxima_execucao", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
    staleTime: 30000, // 30 seconds
  });
};
