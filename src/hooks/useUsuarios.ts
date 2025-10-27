import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Role = "admin" | "conselho" | "fornecedor" | "funcionario" | "morador" | "sindico" | "zelador";
type Papel = Role;

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
      globalRole?: Role; // admin global opcional
    }) => {
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

      // aguarda trigger criar perfil
      await new Promise((r) => setTimeout(r, 1200));

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (perfilError || !perfil) {
        throw new Error("Perfil não foi criado automaticamente");
      }

      if (payload.globalRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: perfil.id,
            role: payload.globalRole,
          });
        if (roleError) throw roleError;
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
        description: error?.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateUsuario = useMutation({
    mutationFn: async (args: {
      id: string;
      email?: string;
      cpf?: string | null;
      nome?: string;
    }) => {
      const { id, ...patch } = args;
      const { error } = await supabase.from("usuarios").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Usuário atualizado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const deleteUsuario = useMutation({
    mutationFn: async (id: string) => {
      const { data: usuario, error: uErr } = await supabase
        .from("usuarios")
        .select("auth_user_id")
        .eq("id", id)
        .maybeSingle();

      if (uErr) throw uErr;
      if (!usuario?.auth_user_id) throw new Error("Usuário não encontrado");

      // limpar vínculos e roles (segurança extra além de cascata)
      await supabase.from("usuarios_condominios").delete().eq("usuario_id", id);
      await supabase.from("user_roles").delete().eq("user_id", id);

      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Usuário excluído!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error?.message || "Sem permissão para excluir.",
        variant: "destructive",
      });
    },
  });

  const assignRole = useMutation({
    mutationFn: async (params: { user_id: string; role: Role }) => {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", params.user_id)
        .eq("role", params.role)
        .maybeSingle();

      if (existing) throw new Error("Esta role já está atribuída a este usuário");

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: params.user_id, role: params.role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Sucesso", description: "Role atribuída!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir role",
        description: error?.message || "Sem permissão para atribuir role.",
        variant: "destructive",
      });
    },
  });

  const removeRole = useMutation({
    mutationFn: async (params: { user_id: string; role: Role }) => {
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
        description: error?.message || "Sem permissão para remover role.",
        variant: "destructive",
      });
    },
  });

  const linkUsuarioCondominio = useMutation({
    mutationFn: async (params: {
      usuario_id: string;
      condominio_id: string;
      papel: Papel;
      is_principal?: boolean;
    }) => {
      // Verificar se já existe o vínculo
      const { data: existing } = await supabase
        .from("usuarios_condominios")
        .select("*")
        .eq("usuario_id", params.usuario_id)
        .eq("condominio_id", params.condominio_id)
        .maybeSingle();

      if (existing) throw new Error("Usuário já vinculado a este condomínio");

      const { error } = await supabase.from("usuarios_condominios").insert({
        usuario_id: params.usuario_id,
        condominio_id: params.condominio_id,
        papel: params.papel,
        is_principal: params.is_principal ?? false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Usuário vinculado ao condomínio!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao vincular usuário",
        description: error?.message || "Sem permissão para vincular.",
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
      queryClient.invalidateQueries({ queryKey: ["condominios-admin"] });
      toast({ title: "Sucesso", description: "Vínculo removido!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover vínculo",
        description: error?.message || "Sem permissão para remover vínculo.",
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
