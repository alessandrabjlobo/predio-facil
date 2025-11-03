import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioId } from "./useCondominioId";

export function useKpisManutencao() {
  const condominioId = useCondominioId();

  const osPipeline = useQuery({
    queryKey: ["v_os_pipeline", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_os_pipeline")
        .select("*")
        .eq("condominio_id", condominioId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const chamadosPipeline = useQuery({
    queryKey: ["v_chamados_pipeline", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_chamados_pipeline")
        .select("*")
        .eq("condominio_id", condominioId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const osResumo = useQuery({
    queryKey: ["v_os_resumo", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_os_resumo")
        .select("*")
        .eq("condominio_id", condominioId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  return { osPipeline, chamadosPipeline, osResumo };
}
