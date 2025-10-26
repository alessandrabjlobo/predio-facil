import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCondominioId } from "@/lib/tenant";

/**
 * Retorna:
 * - roleGlobal: "owner" | "admin" | outro (se existir no perfil)
 * - roleNoCondo: papel do usuário no condomínio atual (ex.: "sindico", "morador", etc.)
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

        // Perfil global
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("id, papel")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        const papelGlobal = (perfil?.papel ?? null) as string | null;
        setRoleGlobal(papelGlobal);

        // Vínculos do usuário
        const { data: vinculos } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, papel, is_principal")
          .eq("usuario_id", perfil?.id);

        const ids = (vinculos ?? []).map(v => String(v.condominio_id));
        setCondoIds(ids);

        const currentId = getCurrentCondominioId();
        const papelAtual = (vinculos ?? []).find(v => String(v.condominio_id) === String(currentId))?.papel ?? null;
        setRoleNoCondo(papelAtual ?? null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // É admin global?
  const isAdminGlobal = useMemo(() => {
    const k = (roleGlobal ?? "").toLowerCase();
    return k === "owner" || k === "admin";
  }, [roleGlobal]);

  return { roleGlobal, roleNoCondo, isAdminGlobal, condoIds, ready };
}
