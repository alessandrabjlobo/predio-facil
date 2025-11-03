// src/hooks/useCondominioId.ts
import { useEffect, useState } from "react";

const KEY = "currentCondominioId";

function getId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Retorna SEMPRE o valor diretamente: string | null
 * - string quando há condomínio selecionado
 * - null quando não há
 *
 * Observação: este hook não retorna setter. A troca do condomínio
 * é feita via evento customizado "condominio:changed" + localStorage.
 */
export function useCondominioId() {
  const [condominioId, setCondominioId] = useState<string | null>(getId());

  useEffect(() => {
    const sync = () => setCondominioId(getId());

    // reage quando o Switcher dispara window.dispatchEvent(new Event("condominio:changed"))
    window.addEventListener("condominio:changed", sync);

    // reage a mudanças em outras abas
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("condominio:changed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return condominioId;
}
