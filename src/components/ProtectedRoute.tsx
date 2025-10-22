// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

/**
 * Exige sessão autenticada.
 * - Checa sessão atual.
 * - Assina mudanças de auth.
 * - Redireciona para /login se não houver.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const location = useLocation();

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

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
