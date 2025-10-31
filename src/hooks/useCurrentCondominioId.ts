import { useEffect, useState } from "react";
import { getCurrentCondominioId } from "@/lib/tenant";

export function useCurrentCondominioId() {
  const [condominioId, setCondominioId] = useState<string | null>(getCurrentCondominioId());

  useEffect(() => {
    const sync = () => setCondominioId(getCurrentCondominioId());

    // disparado pelo Switcher após trocar o principal
    window.addEventListener("condominio:changed", sync);
    // mudança por outra aba / storage
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentCondominioId") sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("condominio:changed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return condominioId;
}
