import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";
import { toast } from "@/hooks/use-toast";

interface ExtintorLoteData {
  quantidade: number;
  prefixo: string;
  numeroInicial: number;
  extintor_tipo: string;
  extintor_capacidade: string;
  fabricante: string;
  data_instalacao: string;
  validade_carga: string;
  validade_teste_hidrostatico: string;
  zona_localizacao: string;
  tipo_id: string;
  requer_conformidade: boolean;
}

export const useExtintores = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  const createExtintoresLote = useMutation({
    mutationFn: async (data: ExtintorLoteData) => {
      if (!condominio?.id) throw new Error("Condomínio não encontrado");

      const extintores = [];
      for (let i = 0; i < data.quantidade; i++) {
        const numeroSequencial = (data.numeroInicial + i).toString().padStart(3, '0');
        const identificador = `${data.prefixo}-${numeroSequencial}`;
        
        extintores.push({
          condominio_id: condominio.id,
          nome: `Extintor ${data.extintor_tipo} ${data.extintor_capacidade}`,
          identificador,
          tipo_id: data.tipo_id,
          fabricante: data.fabricante,
          data_instalacao: data.data_instalacao,
          extintor_tipo: data.extintor_tipo,
          extintor_capacidade: data.extintor_capacidade,
          validade_carga: data.validade_carga,
          validade_teste_hidrostatico: data.validade_teste_hidrostatico,
          zona_localizacao: data.zona_localizacao,
          requer_conformidade: data.requer_conformidade,
        });
      }

      const { data: result, error } = await supabase
        .from("ativos")
        .insert(extintores)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ativos"] });
      toast({
        title: "Sucesso",
        description: `${data.length} extintores cadastrados com sucesso!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao cadastrar extintores: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateLocalizacao = useMutation({
    mutationFn: async ({ id, local }: { id: string; local: string }) => {
      const { data, error } = await supabase
        .from("ativos")
        .update({ local })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ativos"] });
      toast({
        title: "Sucesso",
        description: "Localização atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar localização: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return { createExtintoresLote, updateLocalizacao };
};
