import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAtivoTipos = () => {
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
  });

  return { tipos, isLoading };
};
