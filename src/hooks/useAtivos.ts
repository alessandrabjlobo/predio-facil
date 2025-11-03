import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCondominioId } from "./useCondominioId";

export const useAtivos = () => {
  const condominioId = useCondominioId();
  const queryClient = useQueryClient();

  const { data: ativos, isLoading } = useQuery({
    queryKey: ["ativos", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      if (!condominioId) return [];
      const { data, error } = await supabase
        .from("ativos")
        .select("*, tipo_id, ativo_tipos(nome), is_ativo")
        .eq("condominio_id", condominioId)
        .order("is_ativo", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createAtivo = useMutation({
    mutationFn: async (newAtivo: {
      nome: string;
      descricao?: string;
      local?: string;
      tipo_id?: string;
      modelo?: string;
      fabricante?: string;
      torre?: string;
      tipo_uso?: string;
      andar?: string;
      identificador?: string;
      numero_serie?: string;
      data_instalacao?: string;
      requer_conformidade?: boolean;
      observacoes?: string;
    }) => {
      if (!condominioId) throw new Error("Condomínio não encontrado");
      const { data, error } = await supabase
        .from("ativos")
        .insert({ ...newAtivo, condominio_id: condominioId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ativos", condominioId] });
      toast({ title: "Sucesso", description: "Ativo cadastrado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao cadastrar ativo: ${error?.message ?? "Falha desconhecida"}`,
        variant: "destructive",
      });
    },
  });

  const updateAtivo = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from("ativos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ativos", condominioId] });
      toast({ title: "Sucesso", description: "Ativo atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteAtivo = useMutation({
    mutationFn: async (ativoId: string) => {
      const { error } = await supabase.from("ativos").delete().eq("id", ativoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ativos", condominioId] });
      toast({ title: "Sucesso", description: "Ativo excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  return { ativos, isLoading, createAtivo, updateAtivo, deleteAtivo };
};
