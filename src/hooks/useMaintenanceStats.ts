import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export interface MaintenanceStats {
  total_ativos: number;
  planos_preventivos: number;
  os_abertas: number;
  conformidade_percent: number;
}

export function useMaintenanceStats() {
  const { condominio } = useCondominioAtual();

  return useQuery({
    queryKey: ['maintenance-stats', condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return null;
      
      const { data, error } = await supabase
        .rpc('get_maintenance_stats', { p_condominio_id: condominio.id });

      if (error) throw error;
      return data?.[0] as MaintenanceStats || {
        total_ativos: 0,
        planos_preventivos: 0,
        os_abertas: 0,
        conformidade_percent: 0
      };
    },
    enabled: !!condominio?.id,
  });
}
