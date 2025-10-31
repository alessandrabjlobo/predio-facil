// src/hooks/useCondominioAtual.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";

export interface Condominio {
  id: string;
  nome: string;
  endereco: string | null;
}

export const useCondominioAtual = () => {
  const { user } = useAuth();
  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      setLoading(true);
      setErro(null);

      try {
        if (!user) {
          if (ativo) { setCondominio(null); setLoading(false); }
          return;
        }

        // 1) pega usuarios.id a partir do auth_user_id
        const { data: usuario, error: eUser } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (eUser || !usuario) {
          if (ativo) setCondominio(null);
          return;
        }

        // 2) lista todos os condomínios do usuário (ordena p/ trazer o principal primeiro)
        const { data: rels, error: eRels } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, is_principal, condominios(id, nome, endereco)")
          .eq("usuario_id", usuario.id)
          .order("is_principal", { ascending: false })
          .order("created_at", { ascending: true });

        if (eRels) throw eRels;

        const lista = (rels ?? []).map((r: any) => ({
          id: r.condominios?.id ?? r.condominio_id,
          nome: r.condominios?.nome ?? "Condomínio",
          endereco: r.condominios?.endereco ?? null,
          is_principal: !!r.is_principal,
        }));

        if (!ativo) return;

        // 3) tenta usar o salvo no localStorage
        const salvoId = getCurrentCondominioId();
        let escolhido =
          (salvoId && lista.find((c) => c.id === salvoId)) ||
          lista[0] ||
          null; // primeiro é o principal por causa da ordenação

        if (escolhido) {
          // garante que o localStorage ficou coerente
          if (salvoId !== escolhido.id) setCurrentCondominioId(escolhido.id);
          setCondominio({
            id: escolhido.id,
            nome: escolhido.nome,
            endereco: escolhido.endereco,
          });
        } else {
          setCondominio(null);
        }
      } catch (e: any) {
        if (ativo) setErro(e?.message ?? "Falha ao buscar condomínio");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    // permite “avisar” o app que o condomínio mudou (dispatcher no Switcher)
    const onChanged = () => {
      // força nova leitura
      setLoading(true);
      setTimeout(() => setLoading(false), 0);
    };
    window.addEventListener("condominio:changed", onChanged);

    return () => {
      ativo = false;
      window.removeEventListener("condominio:changed", onChanged);
    };
  }, [user]);

  return { condominio, loading, erro };
};
