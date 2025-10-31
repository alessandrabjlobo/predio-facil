import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCondominioId } from "./useCondominioId";

export const useChamados = () => {
  const { condominioId } = useCondominioId();
  const queryClient = useQueryClient();

  const { data: chamados, isLoading } = useQuery({
    queryKey: ["chamados", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      if (!condominioId) return [];
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .eq("condominio_id", condominioId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createChamado = useMutation({
    mutationFn: async (novo: {
      titulo: string;
      descricao?: string;
      prioridade: string;
      categoria?: string;
      local?: string;
    }) => {
      if (!condominioId) throw new Error("Condomínio não encontrado");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("chamados")
        .insert({
          ...novo,
          condominio_id: condominioId,
          criado_por: usuario?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamados", condominioId] });
      toast({ title: "Sucesso", description: "Chamado criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar chamado: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { chamados, isLoading, createChamado };
};
