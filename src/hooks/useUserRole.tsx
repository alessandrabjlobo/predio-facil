import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/lib/types";

/**
 * Retorna:
 * - role: "admin" (global) ou papel no condomínio (sindico, zelador, etc.) ou null
 * - loading: boolean
 * - condominioId: condomínio principal (ou primeiro encontrado)
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [condominioId, setCondominioId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) {
            setRole(null);
            setCondominioId(null);
            setLoading(false);
          }
          return;
        }

        // Linha do usuário na tabela "usuarios"
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!perfil?.id) {
          if (mounted) {
            setRole(null);
            setCondominioId(null);
            setLoading(false);
          }
          return;
        }

        // Verifica role global (admin) na user_roles
        const { data: globalRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", perfil.id);

        const isAdminGlobal = (globalRoles ?? []).some(r => r.role === "admin");
        if (isAdminGlobal) {
          if (mounted) {
            setRole("admin");
            setCondominioId(null);
            setLoading(false);
          }
          return;
        }

        // Caso não seja admin global, busca papel em condomínio (principal)
        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("papel, condominio_id")
          .eq("usuario_id", perfil.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (relacao) {
          if (mounted) {
            setRole((relacao.papel as UserRole) || null);
            setCondominioId(relacao.condominio_id ?? null);
            setLoading(false);
          }
          return;
        }

        // Fallback: pega o primeiro vínculo
        const { data: primeiraRelacao } = await supabase
          .from("usuarios_condominios")
          .select("papel, condominio_id")
          .eq("usuario_id", perfil.id)
          .limit(1)
          .maybeSingle();

        if (mounted) {
          setRole((primeiraRelacao?.papel as UserRole) || null);
          setCondominioId(primeiraRelacao?.condominio_id || null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao carregar papel do usuário:", err);
        if (mounted) {
          setRole(null);
          setCondominioId(null);
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, []);

  return { role, loading, condominioId };
}

export type { UserRole };
