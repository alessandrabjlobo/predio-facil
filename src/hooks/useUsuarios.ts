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
      // se houver vínculos em usuarios_condominios, remova-os antes
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

  return { usuarios, isLoading, updateUsuario, deleteUsuario };
};
