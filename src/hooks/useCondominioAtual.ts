// src/hooks/useCondominioAtual.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Condominio {
  id: string;
  nome: string;
  endereco: string | null;
}

const LS_ID = "condominioAtualId";
const LS_NOME = "condominioAtualNome";

export const useCondominioAtual = () => {
  const { user } = useAuth();
  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [loading, setLoading] = useState(true);

  const selecionar = useCallback((id: string, nome: string) => {
    localStorage.setItem(LS_ID, id);
    localStorage.setItem(LS_NOME, nome);
    setCondominio({ id, nome, endereco: null }); // endereco pode ser carregado depois
  }, []);

  const limpar = useCallback(() => {
    localStorage.removeItem(LS_ID);
    localStorage.removeItem(LS_NOME);
    setCondominio(null);
  }, []);

  useEffect(() => {
    let vivo = true;

    const boot = async () => {
      setLoading(true);

      try {
        // 1) Se houver override em localStorage, use já (UX imediato)
        const lsId = localStorage.getItem(LS_ID);
        const lsNome = localStorage.getItem(LS_NOME);
        if (lsId && lsNome) {
          if (vivo) setCondominio({ id: lsId, nome: lsNome, endereco: null });
        }

        // 2) Se não logado: encerra
        if (!user) {
          if (vivo) setLoading(false);
          return;
        }

        // 3) Busca o id do usuário (public.usuarios) pelo auth_user_id
        const { data: usuario, error: eUser } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (eUser || !usuario) {
          if (vivo) setLoading(false);
          return;
        }

        // 4) Tenta pegar o principal do banco
        const { data: uc, error: eUc } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, condominios(id, nome, endereco)")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (!vivo) return;

        if (!eUc && uc?.condominios) {
          const c = uc.condominios as unknown as Condominio;

          // Se NÃO havia override, grava o principal no estado e sincroniza no LS
          if (!lsId || !lsNome) {
            localStorage.setItem(LS_ID, c.id);
            localStorage.setItem(LS_NOME, c.nome);
            setCondominio(c);
          } else {
            // Havia override: mantém a escolha do usuário,
            // mas se o endereço vier do banco e for o mesmo id, atualize o campo
            if (condominio?.id === c.id) {
              setCondominio(c);
            }
          }
        } else {
          // Não há principal no banco → se também não havia override, fica null
          if (!lsId || !lsNome) {
            setCondominio(null);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar condomínio:", err);
      } finally {
        if (vivo) setLoading(false);
      }
    };

    boot();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { condominio, loading, selecionar, limpar };
};
