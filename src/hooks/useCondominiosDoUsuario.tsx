// src/hooks/useCondominiosDoUsuario.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  condominio_id: string;
  papel: string;
  condominios: { nome: string } | null;
};

export function useCondominiosDoUsuario() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("usuarios_condominios")
        .select(
          // força o relacionamento 1:1 usando o nome da FK
          "condominio_id, papel, condominios:condominios!usuarios_condominios_condominio_id_fkey (nome)"
        )
        .order("condominio_id", { ascending: true });

      // Normaliza para objeto (caso venha array por algum motivo)
      const norm =
        (data ?? []).map((r: any) => ({
          condominio_id: r.condominio_id,
          papel: r.papel,
          condominios: Array.isArray(r.condominios)
            ? r.condominios[0] ?? null
            : r.condominios ?? null,
        })) as Row[];

      setRows(error ? [] : norm);
      setLoading(false);
    })();
  }, []);

  return { rows, loading };
}
