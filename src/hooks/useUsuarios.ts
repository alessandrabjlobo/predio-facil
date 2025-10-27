import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useUsuarios() {
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          *,
          user_roles(role),
          usuarios_condominios(
            condominio_id,
            papel,
            is_principal,
            condominios(id, nome)
          )
        `)
        .order("email");
      if (error) throw error;
      return data || [];
    },
  });

  const createUsuario = useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      metadata?: { nome?: string };
      globalRole?: string; // NOVO: role global opcional
    }) => {
      // 1. Criar usuário no Auth com metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: payload.metadata || {},
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Aguardar criação do perfil via trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Buscar perfil criado
      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (perfilError || !perfil) {
        throw new Error("Perfil não foi criado automaticamente");
      }

      // 4. Atribuir role global se fornecida
      if (payload.globalRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: perfil.id,
            role: payload.globalRole as any,
          });

        if (roleError) {
          console.error("Erro ao atribuir role:", roleError);
        }
      }

      return perfil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário criado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUsuario = useMutation({
    mutationFn: async (args: {
      id: string;
      patch: {
        email?: string;
        cpf?: string;
        nome?: string;
      };
    }) => {
      const { id, patch } = args;
      const { error } = await supabase
        .from("usuarios")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário atualizado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUsuario = useMutation({
    mutationFn: async (id: string) => {
      // 1. Buscar auth_user_id
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("auth_user_id")
        .eq("id", id)
        .single();

      if (!usuario?.auth_user_id) {
        throw new Error("Usuário não encontrado");
      }

      // 2. Remover vínculos (CASCADE vai limpar automaticamente, mas fazemos explicitamente)
      await supabase.from("usuarios_condominios").delete().eq("usuario_id", id);
      await supabase.from("user_roles").delete().eq("user_id", id);

      // 3. Deletar perfil (trigger vai deletar auth.users automaticamente)
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário excluído!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignRole = useMutation({
    mutationFn: async (params: { user_id: string; role: string }) => {
      // Primeiro, verificar se já existe
      const { data: existing } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", params.user_id)
        .eq("role", params.role)
        .maybeSingle();

      if (existing) {
        throw new Error("Esta role já está atribuída a este usuário");
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: params.user_id, role: params.role as any });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Role atribuída!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeRole = useMutation({
    mutationFn: async (params: { user_id: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", params.user_id)
        .eq("role", params.role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Role removida!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const linkUsuarioCondominio = useMutation({
    mutationFn: async (params: { 
      usuario_id: string; 
      condominio_id: string; 
      papel: string;
      is_principal?: boolean;
    }) => {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from("usuarios_condominios")
        .select("*")
        .eq("usuario_id", params.usuario_id)
        .eq("condominio_id", params.condominio_id)
        .maybeSingle();

      if (existing) {
        throw new Error("Usuário já vinculado a este condomínio");
      }

      const { error } = await supabase
        .from("usuarios_condominios")
        .insert({
          usuario_id: params.usuario_id,
          condominio_id: params.condominio_id,
          papel: params.papel as any,
          is_principal: params.is_principal || false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário vinculado ao condomínio!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao vincular usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unlinkUsuarioCondominio = useMutation({
    mutationFn: async (params: { usuario_id: string; condominio_id: string }) => {
      const { error } = await supabase
        .from("usuarios_condominios")
        .delete()
        .eq("usuario_id", params.usuario_id)
        .eq("condominio_id", params.condominio_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Vínculo removido!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover vínculo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { 
    usuarios, 
    isLoading, 
    createUsuario, 
    updateUsuario, 
    deleteUsuario,
    assignRole,
    removeRole,
    linkUsuarioCondominio,
    unlinkUsuarioCondominio,
  };
}
