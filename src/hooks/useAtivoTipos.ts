import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAtivoTipos = () => {
  const queryClient = useQueryClient();

  const { data: tipos, isLoading } = useQuery({
    queryKey: ["ativo-tipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ativo_tipos")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["ativo-tipos"] });

  return { tipos, isLoading, refetch };
};
