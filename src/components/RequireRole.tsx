import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Papel } from "@/lib/types";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";

export default function RequireRole({
  allowed,
  children,
}: {
  allowed: Papel[];
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [temAcesso, setTemAcesso] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) {
          setLoading(false);
          return;
        }

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario || !mounted) {
          setLoading(false);
          return;
        }

        let condominioAtual = getCurrentCondominioId();

        // Se não houver condomínio salvo, buscar o principal
        if (!condominioAtual) {
          const { data: principal } = await supabase
            .from("usuarios_condominios")
            .select("condominio_id")
            .eq("usuario_id", usuario.id)
            .eq("is_principal", true)
            .maybeSingle();

          if (principal?.condominio_id) {
            setCurrentCondominioId(principal.condominio_id);
            condominioAtual = principal.condominio_id;
          }
        }

        // Verificar papel no condomínio atual
        if (condominioAtual) {
          const { data: rel } = await supabase
            .from("usuarios_condominios")
            .select("papel")
            .eq("usuario_id", usuario.id)
            .eq("condominio_id", condominioAtual)
            .maybeSingle();

          const papelAtual = rel?.papel as Papel | undefined;
          if (papelAtual && allowed.includes(papelAtual)) {
            if (mounted) {
              setTemAcesso(true);
              setLoading(false);
            }
            return; // ✅ CRITICAL: Return immediately to prevent redirect loop
          }
        }

        // Fallback: verificar qualquer vínculo com papel permitido
        const { data: rels } = await supabase
          .from("usuarios_condominios")
          .select("papel")
          .eq("usuario_id", usuario.id);

        const algumPapelValido = (rels ?? []).some((r) =>
          allowed.includes((r.papel as Papel) || "morador")
        );

        if (mounted) {
          setTemAcesso(algumPapelValido);
          setLoading(false);
        }
      } catch (e: any) {
        console.error("Erro ao checar permissões:", e);
        if (mounted) {
          setTemAcesso(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [allowed]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  if (!temAcesso) {
    return (
      <div className="w-full h-full flex items-center justify-center p-10">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Acesso negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página com seu papel atual.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
