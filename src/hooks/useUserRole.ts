import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "admin" | "sindico" | "zelador" | "morador" | "fornecedor" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        console.log('[useUserRole] Checking role for auth_user_id:', user.id);
        const { data: isAdmin, error } = await supabase.rpc('has_role_auth', {
          _auth_user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error("[useUserRole] Erro ao verificar role:", error);
          console.error("[useUserRole] Error details:", JSON.stringify(error, null, 2));
          setRole(null);
        } else {
          console.log('[useUserRole] has_role_auth result:', isAdmin);
          console.log('[useUserRole] Setting role to:', isAdmin ? 'admin' : 'sindico');
          setRole(isAdmin ? 'admin' : 'sindico');
        }
      } catch (error) {
        console.error("[useUserRole] Erro ao buscar role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchRole();
  }, [user]);

  return { role, loading };
};
