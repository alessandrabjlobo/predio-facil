import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";
import { toast } from "@/hooks/use-toast";

export const usePlanosManutencao = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  const { data: planos, isLoading, refetch } = useQuery({
    queryKey: ["planos-manutencao", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .from("planos_manutencao")
        .select(`
          *,
          ativo:ativos(id, nome, tipo_id)
        `)
        .eq("condominio_id", condominio.id)
        .order("proxima_execucao", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
  });

  const createPlano = useMutation({
    mutationFn: async (newPlano: {
      titulo: string;
      ativo_id: string;
      periodicidade: string;
      proxima_execucao: string;
      tipo: "preventiva" | "corretiva";
      is_legal?: boolean;
      checklist?: any;
    }) => {
      if (!condominio?.id) throw new Error("Condomínio não encontrado");

      const { data, error } = await supabase
        .from("planos_manutencao")
        .insert([{
          titulo: newPlano.titulo,
          ativo_id: newPlano.ativo_id,
          periodicidade: newPlano.periodicidade,
          proxima_execucao: newPlano.proxima_execucao,
          tipo: newPlano.tipo,
          is_legal: newPlano.is_legal,
          checklist: newPlano.checklist,
          condominio_id: condominio.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-manutencao"] });
      toast({
        title: "Sucesso",
        description: "Plano de manutenção criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar plano: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { planos, isLoading, refetch, createPlano };
};
