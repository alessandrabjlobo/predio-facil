import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCondominiosDoUsuario } from "@/hooks/useCondominiosDoUsuario";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";

export default function Header() {
  const [email, setEmail] = useState<string>("");
  const nav = useNavigate();
  const { rows, loading } = useCondominiosDoUsuario();
  const ids = useMemo(() => rows.map(r => r.condominio_id), [rows]);
  const [current, setCurrent] = useState<string | null>(getCurrentCondominioId());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => {
    // se não há current ou current não está em ids, seleciona o primeiro disponível
    if (!loading) {
      if (!current || (ids.length && !ids.includes(current))) {
        const fallback = ids[0] ?? null;
        if (fallback) {
          setCurrent(fallback);
          setCurrentCondominioId(fallback);
        }
      }
    }
  }, [loading, ids.join(","), current]);

  async function sair() {
    await supabase.auth.signOut();
    nav("/login");
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* lado esquerdo: seletor */}
      <div className="flex items-center gap-3">
        <div className="font-semibold">Condomínio</div>
        <select
          className="border rounded px-2 py-1 text-sm"
          disabled={loading || rows.length === 0}
          value={current ?? ""}
          onChange={(e) => {
            setCurrent(e.target.value);
            setCurrentCondominioId(e.target.value);
            // opcional: recarregar a rota atual
          }}
        >
          {rows.map((r) => (
            <option key={r.condominio_id} value={r.condominio_id}>
              {r.condominios?.nome ?? r.condominio_id} ({r.papel})
            </option>
          ))}
        </select>
      </div>

      {/* lado direito: usuário */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">{email}</span>
        <button onClick={sair} className="rounded-md border px-3 py-1 hover:bg-gray-50">
          Sair
        </button>
      </div>
    </header>
  );
}
