import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCondominios = () => {
  const queryClient = useQueryClient();

  const { data: condominios, isLoading } = useQuery({
    queryKey: ["condominios-admin"],
    queryFn: async () => {
      console.log('[useCondominios] Fetching condominios...');
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

      if (error) {
        console.error('[useCondominios] Error fetching condominios:', error);
        throw error;
      }
      console.log('[useCondominios] Fetched condominios:', data?.length || 0);
      return data || [];
    },
  });

  const createCondominio = useMutation({
    mutationFn: async (newCondominio: {
      nome: string;
      endereco?: string;
    }) => {
      const { data, error } = await supabase
        .from("condominios")
        .insert(newCondominio)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({
        title: "Sucesso",
        description: "Condomínio cadastrado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao cadastrar condomínio: ${error.message}`,
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
      toast({
        title: "Sucesso",
        description: "Síndico designado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao designar síndico: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { condominios, isLoading, createCondominio, assignSindico };
};
