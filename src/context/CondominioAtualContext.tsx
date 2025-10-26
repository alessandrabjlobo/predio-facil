import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
const STORAGE_KEY = "condominioAtualId";

export function CondominioAtualProvider({ children }: { children: React.ReactNode }) {
  const [lista, setLista] = useState<Condominio[]>([]);
  const [condominioAtualId, setCondominioAtualIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // aplica mudança + persiste
  function setCondominioAtualId(id: string | null) {
    setCondominioAtualIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");

        // pega usuario.id em "usuarios"
        const { data: usuario, error: eUsuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
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
          .map((r: UCRow) => r.condominios)
          .filter(Boolean) as Condominio[];

        if (!mounted) return;
        setLista(listaConds);

        // decide seleção:
        // 1) se há storage e ainda faz parte da lista, usa
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && listaConds.some((c) => c.id === stored)) {
          setCondominioAtualIdState(stored);
        } else {
          // 2) senão, usa principal
          const principal = (rels ?? []).find((r: UCRow) => r.is_principal);
          if (principal?.condominio_id && listaConds.some((c) => c.id === principal.condominio_id)) {
            setCondominioAtualIdState(principal.condominio_id);
            localStorage.setItem(STORAGE_KEY, principal.condominio_id);
          } else {
            // 3) senão, primeiro da lista ou null
            const first = listaConds[0]?.id ?? null;
            setCondominioAtualIdState(first);
            if (first) localStorage.setItem(STORAGE_KEY, first);
          }
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Erro ao carregar condomínios do usuário.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
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
