import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";
import { toast } from "@/hooks/use-toast";

export const useConformidadeItens = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  const { data: itens, isLoading } = useQuery({
    queryKey: ["conformidade-itens", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .from("conformidade_itens")
        .select(`
          *,
          ativos!inner (nome, tipo_id, is_ativo, ativo_tipos(nome, sistema_manutencao)),
          planos_manutencao (titulo, tipo, periodicidade)
        `)
        .eq("condominio_id", condominio.id)
        .eq("ativos.is_ativo", true)
        .order("proximo", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
  });

  const marcarComoExecutado = useMutation({
    mutationFn: async ({ 
      itemId, 
      observacoes,
      gerarOS = true,
    }: { 
      itemId: string; 
      observacoes?: string;
      gerarOS?: boolean;
    }) => {
      console.log('[marcarComoExecutado] Iniciando para item:', itemId);
      
      // Buscar o usuario_id do usuário atual para auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) throw userError;
      
      // Buscar o item atual completo com informações relacionadas
      const { data: item, error: fetchError } = await supabase
        .from("conformidade_itens")
        .select(`
          *,
          ativo:ativos(id, nome, condominio_id),
          plano:planos_manutencao(id, titulo, tipo)
        `)
        .eq("id", itemId)
        .single();

      if (fetchError) {
        console.error('[marcarComoExecutado] Erro ao buscar item:', fetchError);
        throw fetchError;
      }

      console.log('[marcarComoExecutado] Item encontrado:', item);

      // Se gerarOS = true, criar Ordem de Serviço
      if (gerarOS && item.ativo && item.plano) {
        // Gerar número da OS
        const { data: numero, error: numeroError } = await supabase
          .rpc("generate_os_numero", { p_condominio_id: item.condominio_id });

        if (numeroError) {
          console.error('[marcarComoExecutado] Erro ao gerar número OS:', numeroError);
          throw numeroError;
        }

        // Calcular data prevista baseada na periodicidade
        const hoje = new Date();
        const dataPrevista = new Date(hoje);
        if (item.periodicidade) {
          const periodicidadeStr = String(item.periodicidade);
          const match = periodicidadeStr.match(/(\d+)\s*days?/);
          if (match) {
            dataPrevista.setDate(hoje.getDate() + parseInt(match[1]));
          }
        }

        // Criar OS
        const { error: osError } = await supabase
          .from("os")
          .insert({
            condominio_id: item.condominio_id,
            numero,
            titulo: `${item.plano.titulo} - ${item.ativo.nome}`,
            descricao: observacoes || `Manutenção ${item.plano.tipo} programada`,
            status: "aberta",
            origem: item.plano.tipo,
            prioridade: "media",
            ativo_id: item.ativo.id,
            plano_id: item.plano_id,
            solicitante_id: usuario.id,
            data_abertura: hoje.toISOString(),
            data_prevista: dataPrevista.toISOString().split('T')[0],
            sla_vencimento: dataPrevista.toISOString().split('T')[0],
          });

        if (osError) {
          console.error('[marcarComoExecutado] Erro ao criar OS:', osError);
          throw osError;
        }

        console.log('[marcarComoExecutado] OS criada com sucesso:', numero);
      }

      // Calcular próxima execução
      const hoje = new Date();
      const proximaData = new Date(hoje);
      
      // Adicionar periodicidade (assumindo que está em dias)
      if (item?.periodicidade) {
        const periodicidadeStr = String(item.periodicidade);
        const match = periodicidadeStr.match(/(\d+)\s*days?/);
        if (match) {
          proximaData.setDate(hoje.getDate() + parseInt(match[1]));
        }
      }

      const updates = {
        ultimo: hoje.toISOString().split('T')[0],
        proximo: proximaData.toISOString().split('T')[0],
        status: 'verde' as const,
        observacoes,
        updated_at: new Date().toISOString(),
        executado_por: usuario.id,
      };

      console.log('[marcarComoExecutado] Tentando atualizar com:', updates);

      // Atualizar item de conformidade
      const { data, error: updateError } = await supabase
        .from("conformidade_itens")
        .update(updates)
        .eq("id", itemId)
        .select();

      if (updateError) {
        console.error('[marcarComoExecutado] Erro ao atualizar:', updateError);
        throw updateError;
      }

      console.log('[marcarComoExecutado] Sucesso! Dados atualizados:', data);
      return { itemId, osGerada: gerarOS };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conformidade-itens"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast({
        title: "Sucesso",
        description: data.osGerada 
          ? "OS criada e manutenção agendada!"
          : "Manutenção marcada como executada!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao marcar manutenção: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { itens, isLoading, marcarComoExecutado };
};
