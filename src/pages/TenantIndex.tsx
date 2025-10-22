// src/pages/TenantIndex.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { supabase } from "@/lib/supabaseClient";

export default function TenantIndex() {
  const [isOwner, setIsOwner] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("is_system_owner");
      setIsOwner(!error && !!data);
    })();
  }, []);

  if (isOwner === null) return <div className="p-6">Carregando…</div>;
  if (isOwner) return <Navigate to="/owner" replace />;

  return <Dashboard />;
}
