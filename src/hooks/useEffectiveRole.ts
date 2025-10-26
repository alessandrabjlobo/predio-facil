import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCondominioId } from "@/lib/tenant";

/**
 * Retorna:
 * - roleGlobal: "admin" do user_roles (owner do sistema)
 * - roleNoCondo: papel do usuário no condomínio atual via usuarios_condominios
 * - condoIds: lista de condomínios aos quais o usuário pertence
 * - ready: carregamento concluído
 */
export function useEffectiveRole() {
  const [roleGlobal, setRoleGlobal] = useState<string | null>(null);
  const [roleNoCondo, setRoleNoCondo] = useState<string | null>(null);
  const [condoIds, setCondoIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setReady(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRoleGlobal(null);
          setRoleNoCondo(null);
          setCondoIds([]);
          setReady(true);
          return;
        }

        // Buscar perfil do usuário
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!perfil) {
          setRoleGlobal(null);
          setRoleNoCondo(null);
          setCondoIds([]);
          setReady(true);
          return;
        }

        // Verificar se é admin global (owner) via user_roles
        const { data: globalRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", perfil.id);

        const isOwner = (globalRoles ?? []).some(r => r.role === "admin");
        setRoleGlobal(isOwner ? "admin" : null);

        // Vínculos do usuário em condomínios
        const { data: vinculos } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, papel, is_principal")
          .eq("usuario_id", perfil.id);

        const ids = (vinculos ?? []).map(v => String(v.condominio_id));
        setCondoIds(ids);

        const currentId = getCurrentCondominioId();
        const papelAtual = (vinculos ?? []).find(
          v => String(v.condominio_id) === String(currentId)
        )?.papel ?? null;
        setRoleNoCondo(papelAtual ?? null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // É admin global (owner)?
  const isAdminGlobal = useMemo(() => {
    return roleGlobal === "admin";
  }, [roleGlobal]);

  return { roleGlobal, roleNoCondo, isAdminGlobal, condoIds, ready };
}
