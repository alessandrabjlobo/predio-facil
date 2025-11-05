import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useManutTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["manut-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manut_templates")
        .select("*")
        .order("sistema", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: tiposAtivos, isLoading: isLoadingTipos } = useQuery({
    queryKey: ["ativo-tipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ativo_tipos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: documentoTipos, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documento-tipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documento_tipos")
        .select("*")
        .order("nome", { ascending: true});

      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn("documento_tipos table not available, returning empty array");
          return [];
        }
        throw error;
      }
      return data || [];
    },
  });

  const getTemplateDocumentos = (templateId: string) => {
    return useQuery({
      queryKey: ["template-documentos", templateId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("manut_template_documentos")
          .select("*, documento_tipos(*)")
          .eq("template_id", templateId);

        if (error) {
          if (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.warn("documento_tipos or manut_template_documentos not available, returning empty array");
            return [];
          }
          throw error;
        }
        return data || [];
      },
      enabled: !!templateId,
    });
  };

  const updateTemplateDocumentos = useMutation({
    mutationFn: async ({
      templateId,
      documentoIds,
    }: {
      templateId: string;
      documentoIds: string[];
    }) => {
      // Deletar documentos existentes
      await supabase
        .from("manut_template_documentos")
        .delete()
        .eq("template_id", templateId);

      // Inserir novos documentos
      if (documentoIds.length > 0) {
        const { error } = await supabase
          .from("manut_template_documentos")
          .insert(
            documentoIds.map((docId) => ({
              template_id: templateId,
              documento_tipo_id: docId,
              obrigatorio: true,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manut-templates"] });
      queryClient.invalidateQueries({ queryKey: ["template-documentos"] });
      toast({
        title: "Sucesso",
        description: "Documentos obrigatórios atualizados!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar documentos: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["manut-templates"] });

  return {
    templates,
    tiposAtivos,
    documentoTipos,
    isLoading: isLoading || isLoadingTipos || isLoadingDocs,
    getTemplateDocumentos,
    updateTemplateDocumentos,
    refetch,
  };
};
