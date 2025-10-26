import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExecStatus } from "@/lib/types";

export function useManutencoes(filters?: {
  status?: ExecStatus;
  ativo_id?: string;
  condominio_id?: string;
}) {
  return useQuery({
    queryKey: ['manutencoes', filters],
    queryFn: async () => {
      let query = supabase
        .from("manutencoes")
        .select(`
          *,
          ativos!inner(id, nome, tipo_id),
          planos_manutencao(id, titulo)
        `)
        .order("vencimento", { ascending: true });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.ativo_id) {
        query = query.eq("ativo_id", filters.ativo_id);
      }
      if (filters?.condominio_id) {
        query = query.eq("ativos.condominio_id", filters.condominio_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
