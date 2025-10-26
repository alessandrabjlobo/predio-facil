// src/hooks/useUsuarios.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useUsuarios = () => {
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  // ✅ NOVA: criar usuário (apenas linha na tabela `usuarios`)
  const createUsuario = useMutation({
    mutationFn: async (payload: {
      nome?: string | null;
      email: string;
      papel?: string | null; // "sindico" | "admin" | "owner" | "morador"
    }) => {
      const { data, error } = await supabase
        .from("usuarios")
        .insert({
          nome: payload.nome ?? null,
          email: payload.email,
          papel: payload.papel ?? "sindico",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário criado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar usuário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateUsuario = useMutation({
    mutationFn: async (args: {
      id: string;
      patch: { nome?: string | null; email?: string | null; papel?: string | null };
    }) => {
      const { id, patch } = args;
      const { error } = await supabase.from("usuarios").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário atualizado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar usuário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteUsuario = useMutation({
    mutationFn: async (id: string) => {
      // Remover vínculos antes, se existirem
      await supabase.from("usuarios_condominios").delete().eq("usuario_id", id);
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário excluído!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir usuário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { usuarios, isLoading, createUsuario, updateUsuario, deleteUsuario };
};
