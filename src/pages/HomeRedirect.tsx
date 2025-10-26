import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCondominioId } from "@/lib/tenant";
import type { Papel } from "@/lib/types";

export default function HomeRedirect() {
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setTo("/login");
          return;
        }

        // Papel global (owner/admin têm passe livre)
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("id,papel")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        const papelGlobal = (perfil?.papel || "").toLowerCase() as Papel | "";
        if (papelGlobal === "owner" || papelGlobal === "admin") {
          if (mounted) setTo("/admin");
          return;
        }

        // Papel por condomínio atual (ou principal)
        let papel: string | null = null;
        if (perfil?.id) {
          const current = getCurrentCondominioId();
          if (current) {
            const { data: relacao } = await supabase
              .from("usuarios_condominios")
              .select("papel")
              .eq("usuario_id", perfil.id)
              .eq("condominio_id", current)
              .maybeSingle();
            papel = relacao?.papel ?? null;
          } else {
            const { data: principal } = await supabase
              .from("usuarios_condominios")
              .select("papel")
              .eq("usuario_id", perfil.id)
              .eq("is_principal", true)
              .maybeSingle();
            papel = principal?.papel ?? null;
          }
        }

        // Roteamento simples
        const p = (papel || "").toLowerCase();
        if (["sindico", "funcionario", "zelador", "conselho", "morador", "fornecedor"].includes(p)) {
          if (mounted) setTo("/dashboard/sindico");
          return;
        }

        // Fallback
        if (mounted) setTo("/dashboard/sindico");
      } catch {
        if (mounted) setTo("/dashboard/sindico");
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!to) {
    return <div className="p-8 text-center text-muted-foreground">Redirecionando…</div>;
  }
  return <Navigate to={to} replace />;
}
