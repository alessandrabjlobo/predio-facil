import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Condominio {
  id: string;
  nome: string;
  endereco: string | null;
}

export const useCondominioAtual = () => {
  const { user } = useAuth();
  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCondominio(null);
      setLoading(false);
      return;
    }

    const fetchCondominio = async () => {
      try {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (!usuario) {
          setLoading(false);
          return;
        }

        const { data: uc } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, condominios(id, nome, endereco)")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (uc && uc.condominios) {
          setCondominio(uc.condominios as unknown as Condominio);
        } else {
          setCondominio(null);
        }
      } catch (error) {
        console.error("Erro ao buscar condomínio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCondominio();
  }, [user]);

  return { condominio, loading };
};
