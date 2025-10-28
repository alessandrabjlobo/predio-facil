import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOSCost = (osId: string) => {
  return useQuery({
    queryKey: ["os-cost", osId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os")
        .select("custo_previsto, custo_aprovado, custo_final, status_validacao")
        .eq("id", osId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!osId,
  });
};

export const useCondominioTotalCosts = (condominioId: string) => {
  return useQuery({
    queryKey: ["condominio-costs", condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os")
        .select("custo_final, status_validacao")
        .eq("condominio_id", condominioId)
        .eq("status_validacao", "aprovada");

      if (error) throw error;

      const totalAprovado = data?.reduce((sum, os) => sum + (os.custo_final || 0), 0) || 0;

      return {
        totalAprovado,
        osAprovadas: data?.length || 0,
      };
    },
    enabled: !!condominioId,
  });
};
