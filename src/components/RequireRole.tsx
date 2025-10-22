// src/components/RequireRole.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getPerfil, type Papel } from "@/lib/api";

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
        const perfil = await getPerfil(); // precisa existir em src/lib/api.ts
        if (!mounted) return;
        setRole(perfil?.papel ?? null);
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
