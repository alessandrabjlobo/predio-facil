import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioId } from "./useCondominioId";

export const useAssetHistory = (ativoId?: string, limit?: number) => {
  const { condominioId } = useCondominioId();

  return useQuery({
    queryKey: ["asset-history", condominioId, ativoId, limit],
    enabled: !!ativoId && !!condominioId,
    queryFn: async () => {
      if (!ativoId || !condominioId) return { data: [], count: 0 };

      let query = supabase
        .from("os")
        .select(
          `
          id,
          numero,
          titulo,
          status,
          status_validacao,
          data_abertura,
          data_conclusao,
          origem,
          prioridade,
          -- relacionamentos explícitos como você já usa nos outros hooks:
          executante:usuarios!os_executante_id_fkey(id, nome),
          plano:planos_manutencao!os_plano_id_fkey(id, titulo, periodicidade)
        `,
          { count: "exact" }
        )
        .eq("ativo_id", ativoId)
        .eq("condominio_id", condominioId) // <<< isolamento por condomínio
        .order("data_abertura", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data ?? [], count: count ?? 0 };
    },
  });
};
