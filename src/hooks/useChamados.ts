import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";
import { toast } from "@/hooks/use-toast";

export const useChamados = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  const { data: chamados, isLoading } = useQuery({
    queryKey: ["chamados", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .eq("condominio_id", condominio.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
  });

  const createChamado = useMutation({
    mutationFn: async (newChamado: {
      titulo: string;
      descricao?: string;
      prioridade: string;
      categoria?: string;
      local?: string;
    }) => {
      if (!condominio?.id) throw new Error("Condomínio não encontrado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data, error } = await supabase
        .from("chamados")
        .insert({
          ...newChamado,
          condominio_id: condominio.id,
          criado_por: usuario?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamados"] });
      toast({
        title: "Sucesso",
        description: "Chamado criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar chamado: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { chamados, isLoading, createChamado };
};
