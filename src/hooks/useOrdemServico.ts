// src/hooks/useOrdemServico.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCondominioId } from "./useCondominioId";

export const useOrdemServico = () => {
  const { condominioId } = useCondominioId();
  const queryClient = useQueryClient();

  /** 🧾 LISTAGEM DE OS */
  const { data: ordens, isLoading } = useQuery({
    queryKey: ["ordens-servico", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      if (!condominioId) return [];
      const { data, error } = await supabase
        .from("os")
        .select(`
          id,
          numero,
          titulo,
          descricao,
          status,
          status_validacao,
          origem,
          prioridade,
          data_abertura,
          data_prevista,
          data_conclusao,
          custo_previsto,
          custo_aprovado,
          custo_final,
          executor_nome,
          executor_contato,
          ativo:ativos(id, nome, tipo_id),
          plano:planos_manutencao(id, titulo, tipo, checklist),
          solicitante:usuarios!os_solicitante_id_fkey(id, nome),
          executante:usuarios!os_executante_id_fkey(id, nome)
        `)
        .eq("condominio_id", condominioId)
        .order("data_abertura", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  /** 🧱 CRIAR OS (RPC estável + fallback) */
  const createOS = useMutation({
    mutationFn: async ({
      planoId,
      ativoId,
      titulo,
      descricao,
      tipo = "preventiva", // 'preventiva' | 'corretiva'
      prioridade = "media",
      dataPrevista,
    }: {
      planoId?: string;
      ativoId: string;
      titulo: string;
      descricao?: string;
      tipo?: "preventiva" | "corretiva" | string;
      prioridade?: string;
      dataPrevista?: string;
    }) => {
      if (!condominioId) throw new Error("Condomínio não encontrado");

      // usuário autenticado -> pega usuarios.id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario, error: eUsuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (eUsuario || !usuario?.id) throw new Error("Usuário não encontrado");

      // 🚀 Chama a nova RPC estável: public.os_create
      console.log("📦 RPC os_create payload:", {
        p_condominio_id: condominioId,
        p_ativo_id: ativoId,
        p_responsavel_id: usuario.id,
        p_titulo: titulo,
        p_plano_id: planoId ?? null,
        p_descricao: descricao ?? "",
        p_prioridade: prioridade ?? "media",
        p_tipo_os: tipo ?? "corretiva",
        p_data_prevista: dataPrevista ?? null,
      });

      const rpc = await supabase.rpc("os_create", {
        p_condominio_id: condominioId,
        p_ativo_id: ativoId,
        p_responsavel_id: usuario.id,
        p_titulo: titulo,
        p_plano_id: planoId ?? null,
        p_descricao: descricao ?? "",
        p_prioridade: prioridade ?? "media",
        p_tipo_os: (tipo === "preventiva" || tipo === "corretiva") ? tipo : "corretiva",
        p_data_prevista: dataPrevista ?? null,
      });

      if (!rpc.error) {
        // os_create retorna o uuid da nova OS
        return rpc.data;
      }

      // ⚠️ Se a função não existir / 404, cai no fallback
      const msg = rpc.error.message?.toLowerCase() ?? "";
      const isMissing =
        (rpc as any).status === 404 ||
        msg.includes("not found") ||
        msg.includes("does not exist");

      if (!isMissing) {
        console.error("❌ Erro RPC os_create:", rpc.error);
        throw new Error(rpc.error.message || "Erro ao criar OS (RPC)");
      }

      console.warn("↩️ RPC os_create ausente: usando fallback INSERT em public.os");

      // ✅ Fallback compatível com seu schema:
      // - status inicial 'aberta' (válido no CHECK)
      // - origem = 'preventiva' | 'corretiva'
      // - NÃO inserir coluna inexistente (tipo_os NÃO existe)
      const origemValidada = (tipo === "preventiva" || tipo === "corretiva") ? tipo : "corretiva";

      const { data, error } = await supabase
        .from("os")
        .insert({
          condominio_id: condominioId,
          plano_id: planoId ?? null,
          ativo_id: ativoId,
          titulo,
          descricao: descricao ?? "",
          status: "aberta",
          prioridade: prioridade ?? "media",
          origem: origemValidada,
          data_abertura: new Date().toISOString(),
          data_prevista: dataPrevista ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro INSERT fallback em os:", error);
        throw error;
      }
      return data?.id ?? null;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico", condominioId] });
      toast({ title: "Sucesso", description: "Ordem de Serviço criada com sucesso!" });
    },

    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar OS: ${error?.message ?? "Falha desconhecida"}`,
        variant: "destructive",
      });
    },
  });

  /** 🔄 ATUALIZAR STATUS */
  const updateOSStatus = useMutation({
    mutationFn: async ({ osId, status }: { osId: string; status: string }) => {
      const updates: any = { status };
      if (status === "em_execucao") updates.data_abertura = new Date().toISOString();
      else if (status === "concluida") updates.data_conclusao = new Date().toISOString();
      else if (status === "fechada") updates.data_fechamento = new Date().toISOString();

      const { data, error } = await supabase
        .from("os")
        .update(updates)
        .eq("id", osId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico", condominioId] });
      toast({ title: "Sucesso", description: "Status da OS atualizado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  /** 👷‍♂️ ATRIBUIR EXECUTOR */
  const assignExecutor = useMutation({
    mutationFn: async ({
      osId,
      executorNome,
      executorContato,
    }: { osId: string; executorNome: string; executorContato: string }) => {
      const { data, error } = await supabase
        .from("os")
        .update({
          executor_nome: executorNome,
          executor_contato: executorContato,
          status: "em_execucao",
        })
        .eq("id", osId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico", condominioId] });
      toast({ title: "Sucesso", description: "Executor atribuído à OS!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atribuir executor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  /** ✅ VALIDAR OS */
  const validateOS = useMutation({
    mutationFn: async ({
      osId,
      aprovado,
      observacoes,
    }: { osId: string; aprovado: boolean; observacoes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (!usuario) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("os")
        .update({
          status: aprovado ? "concluida" : "aguardando_validacao",
          validado_por: usuario.id,
          validado_em: new Date().toISOString(),
          observacoes_validacao: observacoes || null,
        })
        .eq("id", osId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico", condominioId] });
      queryClient.invalidateQueries({ queryKey: ["conformidade-itens", condominioId] });
      toast({ title: "Sucesso", description: "OS validada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao validar OS: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { ordens, isLoading, createOS, updateOSStatus, assignExecutor, validateOS };
};
