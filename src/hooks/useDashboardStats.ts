import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export const useDashboardStats = () => {
  const { condominio } = useCondominioAtual();

  return useQuery({
    queryKey: ["dashboard-stats", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return null;

      const [chamadosRes, ativosRes, conformidadesRes] = await Promise.all([
        supabase
          .from("chamados")
          .select("id, prioridade, status")
          .eq("condominio_id", condominio.id),
        supabase
          .from("ativos")
          .select("id")
          .eq("condominio_id", condominio.id),
        supabase
          .from("conformidade_itens")
          .select("id, status")
          .eq("condominio_id", condominio.id),
      ]);

      const chamadosAbertos = chamadosRes.data?.filter(c => c.status === "aberto").length || 0;
      const chamadosUrgentes = chamadosRes.data?.filter(c => c.prioridade === "alta" && c.status !== "concluído").length || 0;
      const ativosTotal = ativosRes.data?.length || 0;
      const conformidadesOK = conformidadesRes.data?.filter(c => c.status === "verde").length || 0;
      const conformidadesTotal = conformidadesRes.data?.length || 0;

      return {
        chamadosAbertos,
        chamadosUrgentes,
        ativosTotal,
        conformidadesOK,
        conformidadesTotal,
      };
    },
    enabled: !!condominio?.id,
  });
};
