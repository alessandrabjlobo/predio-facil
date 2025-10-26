import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { type Papel } from "@/lib/types";
import { getCurrentCondominioId } from "@/lib/tenant";

/**
 * Restringe acesso por papel do usuário dentro de um condomínio.
 * - owner/admin têm passe livre (acesso global)
 * - demais papéis são avaliados pelo condomínio atual (ou vínculo principal)
 *
 * Ex.: <RequireRole allowed={['sindico','funcionario']}> ... </RequireRole>
 */
export default function RequireRole({
  allowed,
  children,
}: {
  allowed: Papel[];
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setPermitido(false);
          return;
        }

        // 2) Perfil global (para owner/admin)
        const { data: perfil, error: ePerfil } = await supabase
          .from("usuarios")
          .select("id, papel")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (ePerfil) throw ePerfil;

        const papelGlobal = (perfil?.papel || "").toLowerCase() as Papel | "";
        // Passe livre para owner/admin
        if (papelGlobal === "owner" || papelGlobal === "admin") {
          if (mounted) {
            setPermitido(true);
            setLoading(false);
          }
          return;
        }

        // 3) Papel no condomínio atual OU vínculo principal
        const condoId = getCurrentCondominioId();

        let papelNoCondo: string | null = null;

        if (perfil?.id) {
          if (condoId) {
            // papel específico do condomínio selecionado
            const { data: relacaoByCondo } = await supabase
              .from("usuarios_condominios")
              .select("papel")
              .eq("usuario_id", perfil.id)
              .eq("condominio_id", condoId)
              .maybeSingle();

            papelNoCondo = (relacaoByCondo?.papel as string | undefined) ?? null;
          } else {
            // fallback: vínculo principal
            const { data: relacaoPrincipal } = await supabase
              .from("usuarios_condominios")
              .select("papel")
              .eq("usuario_id", perfil.id)
              .eq("is_principal", true)
              .maybeSingle();

            papelNoCondo = (relacaoPrincipal?.papel as string | undefined) ?? null;
          }
        }

        // 4) Checagem final com lista allowed
        const papelEfetivo = (papelNoCondo || "").toLowerCase() as Papel | "";
        const allowedLower = allowed.map((p) => (p || "").toLowerCase());
        const ok = !!papelEfetivo && allowedLower.includes(papelEfetivo);

        if (mounted) setPermitido(ok);
      } catch (_e) {
        if (mounted) setPermitido(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [allowed]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-gray-600">
        Carregando permissões...
      </div>
    );
  }

  if (!permitido) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
