import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NBRRequisito {
  id: string;
  nbr_codigo: string;
  nbr_titulo: string;
  ativo_tipo_slug: string;
  requisito_descricao: string;
  periodicidade_minima: string;
  responsavel_sugerido?: string;
  checklist_items?: any;
  created_at: string;
}

export const useNBRRequisitos = () => {
  return useQuery({
    queryKey: ["nbr-requisitos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nbr_requisitos")
        .select("*")
        .order("nbr_codigo", { ascending: true });

      if (error) throw error;
      return (data || []) as NBRRequisito[];
    },
  });
};

export const useNBRRequisitosByTipo = (ativoTipoSlug?: string) => {
  return useQuery({
    queryKey: ["nbr-requisitos", ativoTipoSlug],
    queryFn: async () => {
      if (!ativoTipoSlug) return [];
      
      const { data, error } = await supabase
        .from("nbr_requisitos")
        .select("*")
        .eq("ativo_tipo_slug", ativoTipoSlug)
        .order("periodicidade_minima", { ascending: true });

      if (error) throw error;
      return (data || []) as NBRRequisito[];
    },
    enabled: !!ativoTipoSlug,
  });
};