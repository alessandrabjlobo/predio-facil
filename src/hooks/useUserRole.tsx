import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole =
  | "owner"
  | "sindico"
  | "admin"
  | "funcionario"
  | "zelador"
  | "fornecedor"
  | "morador"
  | "conselho"
  | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [condominioId, setCondominioId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // 1) Dono do sistema?
        const { data: isOwner } = await supabase.rpc("is_system_owner");
        if (isOwner) {
          if (mounted) {
            setRole("owner");
            setLoading(false);
          }
          return;
        }

        // 2) Linha de usuário
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario?.id) {
          if (mounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // 3) Relação principal com condomínio
        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("papel, condominio_id")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (!relacao) {
          // fallback: primeira relação
          const { data: primeiraRelacao } = await supabase
            .from("usuarios_condominios")
            .select("papel, condominio_id")
            .eq("usuario_id", usuario.id)
            .limit(1)
            .maybeSingle();

          if (mounted) {
            setRole((primeiraRelacao?.papel as UserRole) || null);
            setCondominioId(primeiraRelacao?.condominio_id || null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setRole(relacao.papel as UserRole);
          setCondominioId(relacao.condominio_id);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao carregar papel do usuário:", err);
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { role, loading, condominioId };
}
