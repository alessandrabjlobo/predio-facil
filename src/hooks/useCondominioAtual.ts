// src/hooks/useCondominioAtual.ts
import { useCondominioAtual as useCtx } from "@/context/CondominioAtualContext";

export interface Condominio {
  id: string;
  nome: string | null;
  endereco?: string | null;
}

export const useCondominioAtual = () => {
  const { condominioAtual, loading, error } = useCtx();

  return {
    condominio: condominioAtual as (Condominio | null),
    loading,
    erro: error,
  };
};
