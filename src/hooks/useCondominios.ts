import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCondominios = () => {
  const queryClient = useQueryClient();

  const { data: condominios, isLoading } = useQuery({
    queryKey: ["condominios-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condominios")
        .select(`
          *,
          usuarios_condominios(
            usuario_id,
            papel,
            is_principal,
            usuarios(id, nome, email)
          )
        `)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const createCondominio = useMutation({
    mutationFn: async (payload: {
      nome: string;
      endereco?: string | null;
      unidades?: number | null;
      cnpj?: string | null;
      sindico_id?: string | null; // opcional: se vier, já vincula
    }) => {
      const { sindico_id, ...dados } = payload;
      const { data: novo, error } = await supabase
        .from("condominios")
        .insert(dados)
        .select()
        .single();
      if (error) throw error;

      if (sindico_id) {
        const { error: e2 } = await supabase
          .from("usuarios_condominios")
          .insert({
            usuario_id: sindico_id,
            condominio_id: novo.id,
            papel: "sindico",
            is_principal: true,
          });
        if (e2) throw e2;
      }
      return novo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Condomínio cadastrado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao cadastrar condomínio: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateCondominio = useMutation({
    mutationFn: async (args: {
      id: string;
      patch: {
        nome?: string | null;
        endereco?: string | null;
        unidades?: number | null;
        cnpj?: string | null;
      };
    }) => {
      const { id, patch } = args;
      const { error } = await supabase.from("condominios").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Condomínio atualizado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar condomínio: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteCondominio = useMutation({
    mutationFn: async (id: string) => {
      // remova vínculos (se FK não fizer cascade)
      await supabase.from("usuarios_condominios").delete().eq("condominio_id", id);
      const { error } = await supabase.from("condominios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Condomínio excluído!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir condomínio: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const assignSindico = useMutation({
    mutationFn: async (params: {
      usuario_id: string;
      condominio_id: string;
      is_principal?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("usuarios_condominios")
        .insert({
          usuario_id: params.usuario_id,
          condominio_id: params.condominio_id,
          papel: "sindico",
          is_principal: params.is_principal ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Síndico atribuído!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atribuir síndico: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    condominios,
    isLoading,
    createCondominio,
    updateCondominio,
    deleteCondominio,
    assignSindico,
  };
};
