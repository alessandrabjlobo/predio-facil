import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export interface EventoCalendario {
  id: string;
  titulo: string;
  data_evento: string;
  tipo: string;
  periodicidade: string;
  ativo_nome: string;
  ativo_tipo: string;
  status_visual: "executado" | "atrasado" | "iminente" | "agendado";
  ultima_execucao: string | null;
  status_conformidade: string | null;
  requer_conformidade: boolean;
}

export const useCalendarioManutencoes = () => {
  const { condominio } = useCondominioAtual();

  const { data: eventos, isLoading } = useQuery({
    queryKey: ["calendario-manutencoes", condominio?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendario_manutencoes")
        .select("*")
        .eq("condominio_id", condominio?.id)
        .order("data_evento", { ascending: true });

      if (error) throw error;
      return data as EventoCalendario[];
    },
    enabled: !!condominio?.id,
  });

  // KPIs
  const kpis = {
    totalMes: eventos?.filter(e => {
      const data = new Date(e.data_evento);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length || 0,
    
    atrasadas: eventos?.filter(e => e.status_visual === "atrasado").length || 0,
    
    proximos7Dias: eventos?.filter(e => e.status_visual === "iminente").length || 0,
    
    taxaConformidade: eventos && eventos.length > 0
      ? Math.round((eventos.filter(e => e.status_visual === "executado").length / eventos.length) * 100)
      : 0,
  };

  // Próximas manutenções (próximos 7 dias)
  const proximasManutencoes = eventos
    ?.filter(e => ["iminente", "agendado"].includes(e.status_visual))
    .slice(0, 5) || [];

  // Alertas críticos
  const alertasCriticos = eventos
    ?.filter(e => e.status_visual === "atrasado" && e.requer_conformidade)
    .slice(0, 5) || [];

  return {
    eventos: eventos || [],
    isLoading,
    kpis,
    proximasManutencoes,
    alertasCriticos,
  };
};
