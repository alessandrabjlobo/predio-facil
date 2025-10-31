// src/hooks/useOrdemServico.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCondominioId } from "./useCondominioId";

type ChecklistItem = {
  id?: string;
  titulo?: string;
  item?: string;
  descricao?: string;
  obrigatorio?: boolean;
  ok?: boolean;
  obs?: string;
};

export const useOrdemServico = () => {
  const { condominioId } = useCondominioId();
  const queryClient = useQueryClient();

  const { data: ordens, isLoading } = useQuery({
    queryKey: ["ordens-servico", condominioId],
    enabled: !!condominioId,
    queryFn: async () => {
      if (!condominioId) return [];
      const { data, error } = await supabase
        .from("os")
        .select(`
          id, numero, titulo, descricao, status, status_validacao, origem, prioridade,
          data_abertura, data_prevista, sla_vencimento, data_conclusao,
          custo_previsto, custo_aprovado, custo_final,
          executor_nome, executor_contato, tipo_executor,
          centro_custo, local, pdf_path, checklist,
          ativo:ativos(id, nome, tipo_id, local),
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

  const createOS = useMutation({
    mutationFn: async ({
      planoId,
      ativoId,
      titulo,
      descricao,
      tipo = "preventiva",
      prioridade = "media",
      dataPrevista,                    // YYYY-MM-DD (opcional)
      slaDias,                         // number | undefined
      tipoExecutor = "externo",        // 'interno' | 'externo'
      executanteId,                    // quando interno
      executorNome,                    // quando externo
      executorContato,                 // quando externo
      custoPrevisto,
      centroCusto,
      local,
      checklistCustom,
    }: {
      planoId?: string;
      ativoId: string;
      titulo: string;
      descricao?: string;
      tipo?: "preventiva" | "corretiva" | string;
      prioridade?: string;
      dataPrevista?: string;
      slaDias?: number;
      tipoExecutor?: "interno" | "externo" | string;
      executanteId?: string;
      executorNome?: string;
      executorContato?: string;
      custoPrevisto?: number;
      centroCusto?: string;
      local?: string;
      checklistCustom?: ChecklistItem[];
    }) => {
      if (!condominioId) throw new Error("Condomínio não encontrado");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario, error: eUsuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (eUsuario || !usuario?.id) throw new Error("Usuário não encontrado");

      // 1) Resolver checklist: plano -> custom -> tipo do ativo
      let checklist: ChecklistItem[] = [];

      if (planoId) {
        const { data: plano } = await supabase
          .from("planos_manutencao")
          .select("checklist")
          .eq("id", planoId)
          .maybeSingle();
        if (plano?.checklist && Array.isArray(plano.checklist)) {
          checklist = plano.checklist as ChecklistItem[];
        }
      }

      if (!checklist?.length && checklistCustom?.length) {
        checklist = checklistCustom;
      }

      if (!checklist?.length) {
        const { data: ativo } = await supabase
          .from("ativos")
          .select("tipo_id")
          .eq("id", ativoId)
          .maybeSingle();
        if (ativo?.tipo_id) {
          const { data: tipoAtivo } = await supabase
            .from("ativo_tipos")
            .select("checklist_default")
            .eq("id", ativo.tipo_id)
            .maybeSingle();
          if (tipoAtivo?.checklist_default && Array.isArray(tipoAtivo.checklist_default)) {
            checklist = tipoAtivo.checklist_default as ChecklistItem[];
          }
        }
      }

      // 2) Calcular SLA: prioridade p/ dataPrevista; se não vier, usar slaDias (default 30)
      let slaVencimento: string;
      if (dataPrevista) {
        slaVencimento = dataPrevista;
      } else {
        const base = new Date();
        const dias = typeof slaDias === "number" && Number.isFinite(slaDias) ? slaDias : 30;
        base.setDate(base.getDate() + dias);
        slaVencimento = base.toISOString().slice(0, 10);
      }

      // 3) Mapear origem válida
      const origem = (tipo === "preventiva" || tipo === "corretiva") ? tipo : "corretiva";

      // 4) Tentar RPC (se existir no projeto)
      const tryRpc = await supabase.rpc("criar_os_detalhada", {
        p_condominio_id: condominioId,
        p_ativo_id: ativoId,
        p_titulo: titulo,
        p_plano_id: planoId ?? null,
        p_descricao: descricao ?? "",
        p_tipo_manutencao: origem,             // compatível c/ p_tipo_os
        p_prioridade: prioridade ?? "media",
        p_tipo_executor: tipoExecutor ?? "externo",
        p_executor_nome: executorNome ?? null,
        p_executor_contato: executorContato ?? null,
        p_data_prevista: dataPrevista ?? null,
        p_checklist_items: checklist ?? [],
        p_nbr_referencias: null
      });

      if (!tryRpc.error && tryRpc.data) {
        return tryRpc.data;
      }

      // 5) Fallback INSERT direto
      const insertPayload: any = {
        condominio_id: condominioId,
        plano_id: planoId ?? null,
        ativo_id: ativoId,
        solicitante_id: usuario.id,
        titulo,
        descricao: descricao ?? "",
        status: "aberta",
        origem,
        prioridade: prioridade ?? "media",
        tipo_executor: (tipoExecutor === "interno" || tipoExecutor === "externo") ? tipoExecutor : "externo",
        data_abertura: new Date().toISOString(),
        data_prevista: dataPrevista ?? null,
        sla_vencimento: slaVencimento,
        custo_previsto: typeof custoPrevisto === "number" ? custoPrevisto : null,
        centro_custo: centroCusto ?? null,
        local: local ?? null,
        checklist: checklist ?? [],
      };

      // se for interno e existir coluna executante_id, grava:
      if (insertPayload.tipo_executor === "interno" && executanteId) {
        insertPayload.executante_id = executanteId;
      }

      // se for externo, grava nome/contato
      if (insertPayload.tipo_executor === "externo") {
        insertPayload.executor_nome = executorNome ?? null;
        insertPayload.executor_contato = executorContato ?? null;
      }

      const { data, error } = await supabase
        .from("os")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico", condominioId] });
      toast({ title: "Sucesso", description: "Ordem de Serviço criada com checklist e campos completos!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar OS: ${error?.message ?? "Falha desconhecida"}`,
        variant: "destructive",
      });
    },
  });

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

  const assignExecutor = useMutation({
    mutationFn: async ({ osId, executorNome, executorContato }:
      { osId: string; executorNome: string; executorContato: string }) => {
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

  const validateOS = useMutation({
    mutationFn: async ({ osId, aprovado, observacoes }:
      { osId: string; aprovado: boolean; observacoes?: string }) => {
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
