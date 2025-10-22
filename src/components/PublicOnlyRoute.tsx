// src/components/PublicOnlyRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

/**
 * Bloqueia páginas públicas (login/signup) para quem já está autenticado.
 */
export default function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(!!data.session);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-gray-600">
        Verificando sessão...
      </div>
    );
  }

  if (hasSession) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
