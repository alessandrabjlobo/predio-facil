import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "./useCondominioAtual";

export const useUsuariosCondominio = () => {
  const { condominio } = useCondominioAtual();

  const { data: zeladores, isLoading } = useQuery({
    queryKey: ["usuarios-condominio", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .from("usuarios_condominios")
        .select("usuario_id, usuarios(id, nome, email)")
        .eq("condominio_id", condominio.id)
        .in("papel", ["zelador", "admin"]);

      if (error) throw error;
      return data?.map(uc => uc.usuarios).filter(Boolean) || [];
    },
    enabled: !!condominio?.id,
  });

  return { zeladores, isLoading };
};
