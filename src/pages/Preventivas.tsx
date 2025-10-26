import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, RefreshCcw, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUpcomingManutencoes } from "@/lib/api";
import { Page } from "@/components/layout/CheckPage";

type ExecStatus = "pendente" | "agendada" | "executando" | "concluida" | "cancelada";
type Manut = {
  id: string;
  titulo: string;
  status: ExecStatus;
  vencimento?: string | null;
  ativo_id?: string | null;
  ativo_nome?: string | null;
};

function cls(...x: (string | false | null | undefined)[]) {
  return x.filter(Boolean).join(" ");
}
function StatusPill({ s }: { s: ExecStatus }) {
  const map: Record<ExecStatus, string> = {
    pendente: "bg-amber-100 text-amber-800",
    agendada: "bg-blue-100 text-blue-800",
    executando: "bg-violet-100 text-violet-800",
    concluida: "bg-emerald-100 text-emerald-800",
    cancelada: "bg-rose-100 text-rose-800",
  };
  return <span className={cls("px-2 py-0.5 rounded-full text-xs font-medium", map[s])}>{s}</span>;
}

export default function Preventivas() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<Manut[]>([]);
  const [q, setQ] = useState("");

  const range = Number(params.get("range") || 30);
  const statusQS = (params.get("status") as ExecStatus | null) || null;

  async function fetchData() {
    setLoading(true);
    try {
      const data = (await listUpcomingManutencoes(200)) as Manut[];
      setItens(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date(new Date().toDateString());
    const max = new Date(now);
    max.setDate(max.getDate() + (isFinite(range) ? range : 30));

    return itens
      .filter((m) => {
        if (m.vencimento) {
          const d = new Date(m.vencimento);
          if (d > max) return false;
        }
        if (statusQS && m.status !== statusQS) return false;
        const txt = `${m.titulo ?? ""} ${m.ativo_nome ?? ""}`.toLowerCase();
        if (q.trim() && !txt.includes(q.trim().toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => {
        const ad = a.vencimento ? +new Date(a.vencimento) : Infinity;
        const bd = b.vencimento ? +new Date(b.vencimento) : Infinity;
        return ad - bd;
      });
  }, [itens, q, range, statusQS]);

  return (
    <Page>
      <Page.Header
        icon={CalendarDays}
        title="Manutenções Preventivas"
        subtitle="Filtre por status, horizonte de dias e busque por título/ativo."
        actions={
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCcw className={cls("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Próximas programações</CardTitle>
          <CardDescription>Visualização em lista com destaque para vencimentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Horizonte:</span>
              {([7, 30, 60, 90] as const).map((d) => {
                const active = d === range;
                return (
                  <Button
                    key={d}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="h-7"
                    onClick={() => nav(`/preventivas?range=${d}${statusQS ? `&status=${statusQS}` : ""}`)}
                  >
                    {d} dias
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 ml-2">Status:</span>
              {(["pendente", "agendada", "executando", "concluida", "cancelada"] as ExecStatus[]).map((s) => {
                const active = statusQS === s;
                return (
                  <Button
                    key={s}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="h-7 capitalize"
                    onClick={() =>
                      nav(`/preventivas?range=${range}${active ? "" : `&status=${s}`}`)
                    }
                  >
                    {s}
                  </Button>
                );
              })}
              {statusQS && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-slate-600"
                  onClick={() => nav(`/preventivas?range=${range}`)}
                >
                  Limpar status
                </Button>
              )}
            </div>

            <div className="ml-auto relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-8 h-8 w-[240px]"
                placeholder="Buscar por título ou ativo…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="text-sm text-slate-600 border rounded-md p-4 bg-slate-50">
              Nenhuma preventiva encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {filtered.map((m) => {
                const due = m.vencimento ? new Date(m.vencimento) : null;
                const daysLeft =
                  due ? Math.ceil((+due - +new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24)) : null;
                const warn =
                  daysLeft === null
                    ? "border-transparent"
                    : daysLeft < 0
                    ? "bg-rose-50"
                    : daysLeft <= 7
                    ? "bg-amber-50"
                    : "";

                return (
                  <div
                    key={m.id}
                    className={cls(
                      "flex items-center justify-between p-3 hover:bg-white transition",
                      warn
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {m.titulo}
                      </div>
                      <div className="text-xs text-slate-600">
                        {m.ativo_nome ? <>Ativo: {m.ativo_nome} • </> : null}
                        Vencimento: {m.vencimento ? new Date(m.vencimento).toLocaleDateString() : "—"}
                        {daysLeft !== null ? ` • ${daysLeft < 0 ? "Atrasada" : `Faltam ${daysLeft} dia(s)`}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusPill s={m.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          nav(`/ativos?ativo=${m.ativo_id ?? ""}&tab=historico&manut=${m.id}`)
                        }
                        title="Abrir histórico do ativo"
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
