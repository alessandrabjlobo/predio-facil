import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUsuarios = () => {
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      console.log('[useUsuarios] Fetching usuarios...');
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("nome");

      if (error) {
        console.error('[useUsuarios] Error fetching usuarios:', error);
        throw error;
      }
      console.log('[useUsuarios] Fetched usuarios:', data?.length || 0);
      return data || [];
    },
  });

  return { usuarios, isLoading };
};
