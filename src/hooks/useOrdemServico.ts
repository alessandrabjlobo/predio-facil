import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";
import { toast } from "@/hooks/use-toast";

export const useOrdemServico = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  /**
   * 🧾 BUSCA LISTA DE ORDENS DE SERVIÇO
   */
  const { data: ordens, isLoading } = useQuery({
    queryKey: ["ordens-servico", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];

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
        .eq("condominio_id", condominio.id)
        .order("data_abertura", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
  });

  /**
   * 🧱 CRIAÇÃO DE ORDEM DE SERVIÇO (via RPC criar_os)
   */
  const createOS = useMutation({
    mutationFn: async ({
      planoId,
      ativoId,
      titulo,
      descricao,
      tipo = "preventiva",
      prioridade = "media",
      dataPrevista,
      slaDias = 30,
    }: {
      planoId?: string;
      ativoId: string;
      titulo: string;
      descricao?: string;
      tipo?: string;
      prioridade?: string;
      dataPrevista?: string;
      slaDias?: number;
    }) => {
      if (!condominio?.id) throw new Error("Condomínio não encontrado");

      // Buscar usuário autenticado (solicitante)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      // Log de depuração para o Supabase
      console.log("📦 Enviando RPC criar_os", {
        condominio_id: condominio.id,
        plano_id: planoId,
        ativo_id: ativoId,
        responsavel_id: usuario.id,
        titulo,
        descricao,
        tipo,
        prioridade,
        dataPrevista,
      });

      // 🚀 Chamada RPC corrigida
      const { data, error } = await supabase.rpc("criar_os", {
        p_condominio_id: condominio.id,
        p_plano_id: planoId || null,
        p_ativo_id: ativoId,
        p_responsavel_id: usuario.id,
        p_titulo: titulo,
        p_descricao: descricao || "",
        p_prioridade: prioridade,
        p_tipo_os: tipo,
        p_data_prevista: dataPrevista || null,
      });

      if (error) {
        console.error("❌ Erro Supabase RPC criar_os:", error);
        throw new Error(error.message || "Erro desconhecido ao criar OS");
      }

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast({
        title: "Sucesso",
        description: "Ordem de Serviço criada com sucesso!",
      });
    },

    onError: (error) => {
      console.error("❌ Erro ao criar OS:", error);
      toast({
        title: "Erro",
        description: `Erro ao criar OS: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  /**
   * 🔄 ATUALIZA STATUS DA ORDEM
   */
  const updateOSStatus = useMutation({
    mutationFn: async ({
      osId,
      status,
      observacoes,
    }: {
      osId: string;
      status: string;
      observacoes?: string;
    }) => {
      const updates: any = { status };

      if (status === "em_execucao") {
        updates.data_abertura = new Date().toISOString();
      } else if (status === "concluida") {
        updates.data_conclusao = new Date().toISOString();
      } else if (status === "fechada") {
        updates.data_fechamento = new Date().toISOString();
      }

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
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast({
        title: "Sucesso",
        description: "Status da OS atualizado!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  /**
   * 👷‍♂️ ATRIBUI EXECUTOR À OS
   */
  const assignExecutor = useMutation({
    mutationFn: async ({
      osId,
      executorNome,
      executorContato,
    }: {
      osId: string;
      executorNome: string;
      executorContato: string;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast({
        title: "Sucesso",
        description: "Executor atribuído à OS!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atribuir executor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  /**
   * ✅ VALIDAÇÃO DE OS (síndico aprova ou reprova)
   */
  const validateOS = useMutation({
    mutationFn: async ({
      osId,
      aprovado,
      observacoes,
    }: {
      osId: string;
      aprovado: boolean;
      observacoes?: string;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["conformidade-itens"] });
      toast({
        title: "Sucesso",
        description: "OS validada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao validar OS: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  /**
   * 🔁 EXPORTAÇÃO
   */
  return {
    ordens,
    isLoading,
    createOS,
    updateOSStatus,
    assignExecutor,
    validateOS,
  };
};
