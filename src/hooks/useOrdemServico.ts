import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";
import { toast } from "@/hooks/use-toast";

export const useOrdemServico = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  const { data: ordens, isLoading } = useQuery({
    queryKey: ["ordens-servico", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .from("os")
        .select(`
          *,
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

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      // Gerar número da OS
      const { data: numero, error: numeroError } = await supabase
        .rpc("generate_os_numero", { p_condominio_id: condominio.id });

      if (numeroError) throw numeroError;

      const dataAbertura = new Date();
      const slaVencimento = dataPrevista 
        ? new Date(dataPrevista)
        : new Date(dataAbertura.getTime() + slaDias * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("os")
        .insert({
          condominio_id: condominio.id,
          numero,
          titulo,
          descricao,
          status: "aberta",
          origem: tipo,
          prioridade,
          ativo_id: ativoId,
          plano_id: planoId,
          solicitante_id: usuario.id,
          data_abertura: dataAbertura.toISOString(),
          data_prevista: dataPrevista,
          sla_vencimento: slaVencimento.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
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
      toast({
        title: "Erro",
        description: `Erro ao criar OS: ${error.message}`,
        variant: "destructive",
      });
    },
  });

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

  return {
    ordens,
    isLoading,
    createOS,
    updateOSStatus,
    assignExecutor,
    validateOS,
  };
};
