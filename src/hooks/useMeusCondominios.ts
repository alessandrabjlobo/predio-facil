import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useMeusCondominios = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lista, isLoading } = useQuery({
    queryKey: ["meus-condominios", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as any[];

      // Buscar id interno do usuário
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!usuario) return [] as any[];

      const { data, error } = await supabase
        .from("usuarios_condominios")
        .select(`
          condominio_id,
          is_principal,
          condominios ( id, nome, endereco )
        `)
        .eq("usuario_id", usuario.id)
        .order("is_principal", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const setPrincipal = useMutation({
    mutationFn: async (condominioId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      // Primeiro, desmarcar todos como principal
      await supabase
        .from("usuarios_condominios")
        .update({ is_principal: false })
        .eq("usuario_id", usuario.id);

      // Depois marcar apenas o selecionado (trigger também garantirá isso)
      const { error } = await supabase
        .from("usuarios_condominios")
        .update({ is_principal: true })
        .eq("usuario_id", usuario.id)
        .eq("condominio_id", condominioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-condominios"] });
      toast({ title: "Condomínio selecionado", description: "Contexto atualizado." });
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  return { lista, isLoading, setPrincipal };
};
