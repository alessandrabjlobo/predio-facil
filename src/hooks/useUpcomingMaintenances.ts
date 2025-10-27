import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export interface UpcomingMaintenance {
  id: string;
  titulo: string;
  ativo_nome: string;
  ativo_tipo: string;
  proxima_execucao: string;
  days_until: number;
  status: 'atrasado' | 'proximo' | 'futuro';
  criticidade: 'baixa' | 'media' | 'alta';
}

export function useUpcomingMaintenances(daysAhead: number = 15) {
  const { condominio } = useCondominioAtual();

  return useQuery({
    queryKey: ['upcoming-maintenances', condominio?.id, daysAhead],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_upcoming_maintenances', { 
          p_condominio_id: condominio.id,
          p_days_ahead: daysAhead 
        });

      if (error) throw error;
      return (data || []) as UpcomingMaintenance[];
    },
    enabled: !!condominio?.id,
  });
}
