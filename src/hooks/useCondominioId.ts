// src/hooks/useCondominioId.ts
import { useEffect, useState } from "react";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";
import { supabase } from "@/integrations/supabase/client";

type Maybe<T> = T | null;

export function useCondominioId() {
  const [condominioId, setCondominioId] = useState<Maybe<string>>(getCurrentCondominioId());
  const [loading, setLoading] = useState(!condominioId);

  // Fallback: se não houver nada salvo, tenta descobrir o principal do usuário logado
  useEffect(() => {
    if (condominioId) return;

    (async () => {
      try {
        const {
          data: me,
        } = await supabase
          .from("usuarios")
          .select("id, auth_user_id")
          .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
          .single();

        if (!me) { setLoading(false); return; }

        const { data: uc } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id")
          .eq("usuario_id", me.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (uc?.condominio_id) {
          setCondominioId(uc.condominio_id);
          setCurrentCondominioId(uc.condominio_id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [condominioId]);

  // Escuta troca feita no Switcher
  useEffect(() => {
    const h = () => {
      const id = getCurrentCondominioId();
      setCondominioId(id);
    };
    window.addEventListener("condominio:changed", h);
    return () => window.removeEventListener("condominio:changed", h);
  }, []);

  return { condominioId, setCondominioId, loading };
}
