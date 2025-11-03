import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioId } from "./useCondominioId";

export interface EventoCalendario {
  id: string;
  titulo: string;
  data_evento: string; // ISO
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
  const condominioId = useCondominioId();

  const { data: eventos, isLoading } = useQuery({
    queryKey: ["calendario-manutencoes", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      if (!condominioId) return [] as EventoCalendario[];

      const { data, error } = await supabase
        .from("calendario_manutencoes")
        .select("*")
        .eq("condominio_id", condominioId)
        .order("data_evento", { ascending: true });

      if (error) throw error;
      return (data ?? []) as EventoCalendario[];
    },
  });

  // ---- KPIs (client-side) ----
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const totalMes =
    eventos?.filter((e) => {
      const d = new Date(e.data_evento);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }).length ?? 0;

  const atrasadas = eventos?.filter((e) => e.status_visual === "atrasado").length ?? 0;

  const proximos7Dias =
    eventos?.filter((e) => e.status_visual === "iminente").length ?? 0;

  const taxaConformidade =
    eventos && eventos.length > 0
      ? Math.round(
          (eventos.filter((e) => e.status_visual === "executado").length /
            eventos.length) *
            100
        )
      : 0;

  // Próximas manutenções (limit 5) — iminentes ou agendadas
  const proximasManutencoes =
    eventos
      ?.filter((e) => ["iminente", "agendado"].includes(e.status_visual))
      .slice(0, 5) ?? [];

  // Alertas críticos (limit 5) — atrasadas e que exigem conformidade
  const alertasCriticos =
    eventos
      ?.filter((e) => e.status_visual === "atrasado" && e.requer_conformidade)
      .slice(0, 5) ?? [];

  return {
    eventos: eventos ?? [],
    isLoading,
    kpis: {
      totalMes,
      atrasadas,
      proximos7Dias,
      taxaConformidade,
    },
    proximasManutencoes,
    alertasCriticos,
  };
};
