import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useManutencaoActions() {
  const queryClient = useQueryClient();
  
  const concluir = useMutation({
    mutationFn: async ({ id, anexo }: { id: string; anexo?: File }) => {
      // Upload de anexo se existir
      if (anexo) {
        const fileName = `${id}_${Date.now()}_${anexo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("manutencoes")
          .upload(fileName, anexo);
        
        if (uploadError) throw uploadError;

        // Atualizar caminho do anexo
        await supabase
          .from("manutencoes")
          .update({ anexo_path: fileName })
          .eq("id", id);
      }

      // Concluir manutenção
      const { error } = await supabase
        .from("manutencoes")
        .update({
          status: "concluida",
          executada_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      toast({ title: 'Manutenção concluída com sucesso!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao concluir manutenção', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
  
  const remarcar = useMutation({
    mutationFn: async ({ id, novaData }: { id: string; novaData: string }) => {
      const { error } = await supabase
        .from("manutencoes")
        .update({ vencimento: novaData })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      toast({ title: 'Data remarcada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao remarcar', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
  
  return { concluir, remarcar };
}
