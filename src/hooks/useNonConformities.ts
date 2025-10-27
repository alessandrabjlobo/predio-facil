import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export interface NonConformity {
  ativo_id: string;
  ativo_nome: string;
  tipo_nome: string;
  nbr_codigo: string;
  dias_atrasado: number;
  gravidade: 'media' | 'alta' | 'critica';
}

export function useNonConformities() {
  const { condominio } = useCondominioAtual();

  return useQuery({
    queryKey: ['non-conformities', condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_non_conformities', { p_condominio_id: condominio.id });

      if (error) throw error;
      return (data || []) as NonConformity[];
    },
    enabled: !!condominio?.id,
  });
}
