// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Wrench, Users, BarChart3, Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCard from "@/components/dashboard/KpiCard";
import EmptyState from "@/components/dashboard/EmptyState";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import {
  getPerfil,
  listChamados,
  listUpcomingManutencoes,
  listConformidadeItens,
} from "@/lib/api";
import type { Status, Prioridade } from "@/lib/api";

/* helpers visuais */
function cls(...x: (string | false | null | undefined)[]) {
  return x.filter(Boolean).join(" ");
}
function PriorityBadge({ p }: { p: Prioridade }) {
  const map: Record<Prioridade, string> = {
    baixa: "bg-gray-100 text-gray-700 border border-gray-200",
    media: "bg-sky-100 text-sky-700 border border-sky-200",
    alta: "bg-orange-100 text-orange-700 border border-orange-200",
    urgente: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  const label = p[0].toUpperCase() + p.slice(1);
  return <span className={cls("px-2 py-0.5 rounded-full text-xs font-medium", map[p])}>{label}</span>;
}
function StatusPill({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    aberto: "bg-gray-100 text-gray-700",
    em_andamento: "bg-indigo-100 text-indigo-700",
    concluido: "bg-green-100 text-green-700",
    cancelado: "bg-zinc-100 text-zinc-700 line-through",
  };
  const label = s.replace("_", " ");
  return <span className={cls("px-2 py-0.5 rounded-full text-xs font-medium", map[s])}>{label}</span>;
}
type ExecStatus = "pendente" | "agendada" | "executando" | "concluida" | "cancelada";
function MaintPill({ s }: { s: ExecStatus }) {
  const map: Record<ExecStatus, string> = {
    pendente: "bg-amber-100 text-amber-800",
    agendada: "bg-blue-100 text-blue-800",
    executando: "bg-violet-100 text-violet-800",
    concluida: "bg-emerald-100 text-emerald-800",
    cancelada: "bg-rose-100 text-rose-800",
  };
  return <span className={cls("px-2 py-0.5 rounded-full text-xs font-medium", map[s])}>{s}</span>;
}

/* tipos */
type Chamado = {
  id: string;
  titulo: string;
  descricao?: string | null;
  prioridade: Prioridade;
  status: Status;
  criado_em?: string;
  local?: string | null;
  categoria?: string | null;
};
type Manut = {
  id: string;
  titulo: string;
  status: ExecStatus;
  vencimento?: string | null;
  ativo_id?: string | null;
  ativo_nome?: string | null;
};

export default function Dashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [preventivas, setPreventivas] = useState<Manut[]>([]);
  const [conf, setConf] = useState<any[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const [p, c, m, ci] = await Promise.all([
        getPerfil(),
        listChamados(),
        listUpcomingManutencoes(50),
        listConformidadeItens(),
      ]);
      setPerfil(p);
      setChamados(c as Chamado[]);
      setPreventivas(m as Manut[]);
      setConf(ci);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  const abertos = useMemo(() => chamados.filter((x) => x.status === "aberto").length, [chamados]);
  const recentes = useMemo(
    () =>
      [...chamados]
        .sort((a, b) => new Date(b.criado_em ?? 0).getTime() - new Date(a.criado_em ?? 0).getTime())
        .slice(0, 4),
    [chamados]
  );
  const confResumo = useMemo(() => {
    const r = { verde: 0, amarelo: 0, vermelho: 0 };
    conf.forEach((i: any) => (r[i.status as "verde" | "amarelo" | "vermelho"] += 1));
    return r;
  }, [conf]);

  return (
    <div className="px-6 py-5 max-w-[1320px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            {perfil ? `Olá, Síndico ${perfil.nome?.split(" ")[0] ?? ""}` : "Olá"}
          </h2>
          <p className="text-slate-600 text-sm">Condomínio Residencial Vista Verde • 120 unidades</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" className="h-8">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => nav("/chamados/novo")} className="h-8">
            <Plus className="w-4 h-4 mr-2" />
            Novo chamado
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Chamados abertos"
          value={loading ? "…" : abertos}
          icon={<Wrench className="h-4 w-4" />}
          delta={{ text: "+2 vs ontem", positive: false }}
          onClick={() => nav("/chamados?status=aberto")}
        />
        <KpiCard
          title="Preventivas pendentes"
          value={loading ? "…" : preventivas.length}
          icon={<Building2 className="h-4 w-4" />}
          delta={{ text: "Próximos 30 dias", positive: true }}
          onClick={() => nav("/preventivas")}
        />
        <KpiCard
          title="Fornecedores ativos"
          value="12"
          icon={<Users className="h-4 w-4" />}
          delta={{ text: "Média 4.8 ★", positive: true }}
          onClick={() => nav("/fornecedores")}
        />
        <KpiCard
          title="Gastos do mês"
          value="R$ 8.450"
          icon={<BarChart3 className="h-4 w-4" />}
          delta={{ text: "-12% vs mês anterior", positive: true }}
          onClick={() => nav("/relatorios?view=financeiro")}
        />
      </div>

      {/* Conteúdo: 5/7 colunas, alturas mais coesas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 h-full">
          {/* Mini-calendário ocupa altura total do card */}
          <div className="h-full">
            <MiniCalendar onOpenAgenda={(iso) => nav(`/agenda?date=${iso ?? ""}`)} />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-5">
          {/* Chamados Recentes - mais compacto */}
          <Card className="h-[300px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Chamados Recentes</CardTitle>
              <CardDescription>Últimas solicitações registradas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 overflow-auto">
              {recentes.length === 0 ? (
                <EmptyState
                  title="Nenhum chamado recente"
                  description="Crie um chamado para começar a acompanhar."
                  actionText="Novo chamado"
                  onAction={() => nav("/chamados/novo")}
                />
              ) : (
                recentes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-900 truncate">{c.titulo}</div>
                      <div className="text-[12px] text-slate-600 mt-0.5">
                        <StatusPill s={c.status} />{" "}
                        {c.criado_em ? `• ${new Date(c.criado_em).toLocaleString()}` : ""}{" "}
                        {c.local ? `• ${c.local}` : ""}
                      </div>
                    </div>
                    <div className="ml-3 shrink-0">
                      <PriorityBadge p={c.prioridade} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Preventivas */}
          <Card className="min-h-[360px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Manutenções Preventivas</CardTitle>
              <CardDescription>Próximas programações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-[280px] overflow-auto pr-1">
                {preventivas.length === 0 ? (
                  <EmptyState
                    title="Sem preventivas no horizonte"
                    description="Quando houver, você verá aqui as próximas execuções."
                    actionText="Ver plano completo"
                    onAction={() => nav("/preventivas")}
                  />
                ) : (
                  preventivas.map((m) => {
                    const due = m.vencimento ? new Date(m.vencimento) : null;
                    const daysLeft =
                      due ? Math.ceil((+due - +new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24)) : null;
                    const box =
                      daysLeft === null
                        ? "border border-slate-200"
                        : daysLeft < 0
                        ? "border border-rose-300 bg-rose-50"
                        : daysLeft <= 7
                        ? "border border-amber-300 bg-amber-50"
                        : "border border-blue-200 bg-blue-50";

                    return (
                      <button
                        key={m.id}
                        className={cls(
                          "w-full text-left flex items-center justify-between p-2.5 rounded-md hover:bg-white/70 transition",
                          box
                        )}
                        onClick={() => nav(`/ativos?ativo=${m.ativo_id ?? ""}&tab=historico&manut=${m.id}`)}
                        title="Abrir detalhes do ativo na aba Histórico"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-slate-900 truncate">{m.titulo}</div>
                          <div className="text-[12px] text-slate-700">
                            {m.ativo_nome ? <>Ativo: {m.ativo_nome} • </> : null}
                            Vencimento: {m.vencimento ? new Date(m.vencimento).toLocaleDateString() : "—"}
                            {daysLeft !== null ? ` • ${daysLeft < 0 ? "Atrasada" : `Faltam ${daysLeft} dia(s)`}` : ""}
                          </div>
                        </div>
                        <div className="ml-3 shrink-0">
                          <MaintPill s={m.status as ExecStatus} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-1 text-[12px] text-slate-700">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Conformidade:
                    {` ${confResumo.verde} verde`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> {confResumo.amarelo} amarelo
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> {confResumo.vermelho} vermelho
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => nav("/preventivas")}>
                  Ver plano completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
