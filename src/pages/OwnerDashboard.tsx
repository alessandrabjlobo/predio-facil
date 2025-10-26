import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RequireOwner from "@/components/RequireOwner";
import { Link } from "react-router-dom";

type C = { id: string; nome: string; endereco: string | null; created_at: string };

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ condos: 0, usuarios: 0, ativos: 0, osAbertas: 0 });
  const [recent, setRecent] = useState<C[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // counts
      const [{ count: c1 }, { count: c2 }, { count: c3 }, osQuery] = await Promise.all([
        supabase.from("condominios").select("id", { count: "exact", head: true }),
        supabase.from("usuarios").select("id", { count: "exact", head: true }),
        supabase.from("ativos").select("id", { count: "exact", head: true }),
        supabase.from("os").select("id", { count: "exact", head: true }).neq("status", "concluida_ok").neq("status", "cancelada"),
      ]);

      const { data: lastCondos } = await supabase
        .from("condominios")
        .select("id, nome, endereco, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setCounts({
        condos: c1 ?? 0,
        usuarios: c2 ?? 0,
        ativos: c3 ?? 0,
        osAbertas: osQuery.count ?? 0,
      });
      setRecent(lastCondos ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <RequireOwner>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard do Dono</h1>
          <Link to="/condos/new" className="btn border rounded-xl px-4 py-2 hover:bg-gray-50">+ Novo condomínio</Link>
        </header>

        {loading ? (
          <div>Carregando…</div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Stat title="Condomínios" value={counts.condos} />
              <Stat title="Usuários" value={counts.usuarios} />
              <Stat title="Ativos" value={counts.ativos} />
              <Stat title="OS abertas" value={counts.osAbertas} />
            </section>

            <section className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Últimos condomínios</h2>
              </div>
              <ul className="divide-y">
                {recent.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.nome}</div>
                      <div className="text-sm text-gray-600">{c.endereco ?? "—"}</div>
                      <div className="text-xs text-gray-400">
                        Criado em {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Link to={`/condos/${c.id}/edit`} className="text-indigo-600 hover:underline text-sm">
                      Editar
                    </Link>
                  </li>
                ))}
                {recent.length === 0 && <li className="py-3 text-sm text-gray-500">Nada ainda.</li>}
              </ul>
            </section>
          </>
        )}
      </div>
    </RequireOwner>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
