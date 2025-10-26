// src/components/RequireRole.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { type Papel } from "@/lib/types";
import { getCurrentCondominioId } from "@/lib/tenant";

export default function RequireRole({
  allowed,
  children,
}: {
  allowed: Papel[];
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [temAcesso, setTemAcesso] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // pega o perfil (id interno)
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario || !mounted) return;

        const condominioAtual = getCurrentCondominioId();

        // 1) se tem condomínio atual, verifica papel nesse condomínio
        if (condominioAtual) {
          const { data: rel } = await supabase
            .from("usuarios_condominios")
            .select("papel")
            .eq("usuario_id", usuario.id)
            .eq("condominio_id", condominioAtual)
            .maybeSingle();

          const papelAtual = rel?.papel as Papel | undefined;
          if (papelAtual && allowed.includes(papelAtual)) {
            if (mounted) setTemAcesso(true);
            return;
          }
        }

        // 2) fallback: qualquer relação com papel permitido em QUALQUER condomínio
        const { data: rels } = await supabase
          .from("usuarios_condominios")
          .select("papel")
          .eq("usuario_id", usuario.id);

        const algumPapelValido = (rels ?? []).some((r) =>
          allowed.includes((r.papel as Papel) || "morador")
        );

        if (mounted) setTemAcesso(algumPapelValido);
      } catch (e: any) {
        if (mounted) setErro(e?.message ?? "Erro ao checar permissões");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [allowed]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-gray-600">
        Carregando permissões...
      </div>
    );
  }

  if (erro || !temAcesso) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
