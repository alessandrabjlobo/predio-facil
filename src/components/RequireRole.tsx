// src/components/RequireRole.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { type Papel } from "@/lib/api";

/**
 * Restringe acesso por papel do usuário.
 * Ex.: <RequireRole allowed={['sindico','funcionario']}> ... </RequireRole>
 */
export default function RequireRole({
  allowed,
  children,
}: {
  allowed: Papel[];
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Papel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Buscar usuário
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario || !mounted) return;

        // Buscar papel principal
        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("papel")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (!mounted) return;
        setRole(relacao?.papel as Papel ?? null);
      } catch (e: any) {
        if (!mounted) return;
        setErro(e?.message ?? "Erro ao carregar perfil");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-gray-600">
        Carregando permissões...
      </div>
    );
  }

  if (erro || !role || !allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
