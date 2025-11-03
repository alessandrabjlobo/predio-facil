// src/context/CondominioAtualContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";

type Condominio = {
  id: string;
  nome: string | null;
};

type UCRow = {
  condominio_id: string;
  is_principal: boolean | null;
  condominios: Condominio | null;
};

type Ctx = {
  lista: Condominio[];
  condominioAtualId: string | null;
  condominioAtual: Condominio | null;
  setCondominioAtualId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
};

const CondominioAtualContext = createContext<Ctx | null>(null);

export function CondominioAtualProvider({ children }: { children: React.ReactNode }) {
  const [lista, setLista] = useState<Condominio[]>([]);
  const [condominioAtualId, setCondominioAtualIdState] = useState<string | null>(
    getCurrentCondominioId()
  );
  const [loading, setLoading] = useState<boolean>(!getCurrentCondominioId());
  const [error, setError] = useState<string | null>(null);

  // setter unificado: atualiza estado, persiste e avisa o app
  function setCondominioAtualId(id: string | null) {
    setCondominioAtualIdState(id);
    if (id) setCurrentCondominioId(id);
    else setCurrentCondominioId("");
    // dispara evento global para os hooks ouvirem e refetcharem
    window.dispatchEvent(new Event("condominio:changed"));
  }

  // Carrega lista do usuário e decide seleção inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const authId = auth?.user?.id;
        if (!authId) throw new Error("Usuário não autenticado.");

        // pega usuarios.id
        const { data: usuario, error: eUsuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", authId)
          .maybeSingle();
        if (eUsuario) throw eUsuario;
        if (!usuario?.id) throw new Error("Perfil de usuário não encontrado.");

        // lista de condomínios do usuário
        const { data: rels, error: eRels } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, is_principal, condominios(id, nome)")
          .eq("usuario_id", usuario.id);
        if (eRels) throw eRels;

        const listaConds = (rels ?? [])
          .map((r: any) => r.condominios)
          .flat()
          .filter(Boolean) as Condominio[];

        if (!mounted) return;
        setLista(listaConds);

        // Seleção:
        // 1) usa o salvo (se ainda fizer parte da lista)
        const saved = getCurrentCondominioId();
        if (saved && listaConds.some((c) => c.id === saved)) {
          setCondominioAtualIdState(saved);
          return;
        }

        // 2) senão, usa principal
        const principal = (rels ?? []).find((r: any) => r.is_principal);
        if (principal?.condominio_id && listaConds.some((c) => c.id === principal.condominio_id)) {
          setCondominioAtualId(principal.condominio_id);
          return;
        }

        // 3) senão, primeiro da lista (ou null)
        const first = listaConds[0]?.id ?? null;
        setCondominioAtualId(first ?? null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Erro ao carregar condomínios do usuário.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Mantém o contexto sincronizado com mudanças externas (Switcher, outras abas)
  useEffect(() => {
    const sync = () => setCondominioAtualIdState(getCurrentCondominioId());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentCondominioId") sync();
    };
    window.addEventListener("condominio:changed", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("condominio:changed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const condominioAtual = useMemo(
    () => lista.find((c) => c.id === condominioAtualId) ?? null,
    [lista, condominioAtualId]
  );

  const value: Ctx = {
    lista,
    condominioAtualId,
    condominioAtual,
    setCondominioAtualId,
    loading,
    error,
  };

  return (
    <CondominioAtualContext.Provider value={value}>
      {children}
    </CondominioAtualContext.Provider>
  );
}

export function useCondominioAtual() {
  const ctx = useContext(CondominioAtualContext);
  if (!ctx) throw new Error("useCondominioAtual deve ser usado dentro de CondominioAtualProvider");
  return ctx;
}
