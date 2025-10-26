// src/pages/DashboardAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  DollarSign,
  ShieldCheck,
  FileText,
  Plus,
  ClipboardList,
  Wrench,
  Package,
  AlertTriangle,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// ✅ seus componentes de dashboard (já existem no projeto)
import KpiCard from "@/components/dashboard/KpiCard";
import MiniCalendar from "@/components/dashboard/MiniCalendar";

// ✅ tema do calendário (já existe no projeto)
import "@/styles/fullcalendar-theme.css";

// (opcional) se você já tem essas funções no seu lib/api, os imports abaixo funcionam;
// caso contrário, os fallbacks dentro do useEffect asseguram que a tela carregue mesmo assim.
let api: any = {};
try {
  api = require("@/lib/api");
} catch {
  // segue com fallbacks
}

type OSItem = {
  id: string;
  titulo: string;
  descricao?: string | null;
  status?: "aberta" | "em andamento" | "concluida" | "cancelada";
  previsao?: string | null;
  ativo_nome?: string | null;
  executor?: string | null;
};

type Manutencao = {
  id: string;
  titulo: string;
  data: string; // ISO date
  status?: "agendado" | "atrasado" | "executado" | "iminente";
};

export default function DashboardAdmin() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [condominioNome, setCondominioNome] = useState("Condomínio");

  // KPIs
  const [stats, setStats] = useState({
    usuarios: 0,
    sindicos: 0,
    ativos: 0,
    gastos: "R$ 0",
  });

  // Listas
  const [osRecentes, setOsRecentes] = useState<OSItem[]>([]);
  const [alertas, setAlertas] = useState<{ id: string; titulo: string; severidade: "alta" | "media" | "baixa" }[]>([]);
  const [proximas, setProximas] = useState<Manutencao[]>([]);

  // Eventos do calendário (derivado de "proximas")
  const eventos = useMemo(
    () =>
      proximas.map((p) => ({
        id: p.id,
        title: p.titulo,
        start: p.data,
        extendedProps: { status: p.status ?? "agendado" as const },
      })),
    [proximas]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // pega usuario.id na tabela "usuarios"
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario) return;

        // pega condomínio principal + nome
        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, condominios(nome)")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        const condoId = relacao?.condominio_id ?? null;
        const nome = (relacao as any)?.condominios?.nome ?? "Condomínio";
        setCondominioNome(nome);

        // ---- KPIs ----
        if (condoId) {
          const [usuariosRes, ativosRes] = await Promise.all([
            supabase.from("usuarios_condominios").select("id", { count: "exact" }).eq("condominio_id", condoId),
            supabase.from("ativos").select("id", { count: "exact" }).eq("condominio_id", condoId),
          ]);

          setStats({
            usuarios: usuariosRes?.count ?? 0,
            sindicos: 3, // TODO: contar papéis de síndico quando sua view/tabela estiver pronta
            ativos: ativosRes?.count ?? 0,
            gastos: "R$ 85.450", // TODO: virar soma real de despesas do mês
          });
        }

        // ---- Listas (usa lib/api se existir; senão, fallbacks) ----
        // OS Recentes
        if (api?.listOS) {
          const todas: OSItem[] = await api.listOS({ limit: 6 });
          setOsRecentes(todas.slice(0, 6));
        } else {
          setOsRecentes([
            { id: "OS-1023", titulo: "Troca de filtro bomba JN-02", status: "em andamento", previsao: new Date().toISOString(), ativo_nome: "Bomba JN-02" },
            { id: "OS-1022", titulo: "Lubrificação exaustor G2", status: "aberta", previsao: null, ativo_nome: "Exaustor G2" },
            { id: "OS-1021", titulo: "Inspeção quadro QGF", status: "concluida", previsao: new Date().toISOString(), ativo_nome: "QGF Principal" },
          ]);
        }

        // Próximas manutenções / calendário
        if (api?.listUpcomingManutencoes) {
          const prox = await api.listUpcomingManutencoes(7);
          setProximas(
            prox.map((p: any) => ({
              id: p.id,
              titulo: p.titulo ?? "Manutenção",
              data: p.data_prevista ?? p.start,
              status: p.status ?? "agendado",
            }))
          );
        } else {
          const base = new Date();
          setProximas([
            { id: "M-1", titulo: "Revisão elevador bloco A", data: new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 9, 0).toISOString(), status: "agendado" },
            { id: "M-2", titulo: "Teste gerador", data: new Date(base.getFullYear(), base.getMonth(), base.getDate() + 2, 14, 0).toISOString(), status: "iminente" },
          ]);
        }

        // Alertas prioritários (ex.: atrasadas)
        if (api?.listAtrasadas) {
          const atrasadas = await api.listAtrasadas();
          setAlertas(
            atrasadas.map((a: any) => ({
              id: a.id,
              titulo: a.titulo ?? "Manutenção atrasada",
              severidade: "alta",
            }))
          );
        } else {
          setAlertas([{ id: "A-1", titulo: "Inspeção SPDA atrasada", severidade: "alta" }]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-[1320px] mx-auto space-y-6">
      {/* Título + Ações rápidas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Visão Geral do Condomínio</h2>
          <p className="text-muted-foreground text-sm">{condominioNome}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => nav("/os")}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
          <Button variant="outline" onClick={() => nav("/ativos")}>
            <Package className="w-4 h-4 mr-2" />
            Novo Ativo
          </Button>
          <Button variant="outline" onClick={() => nav("/conformidade")}>
            <ShieldCheck className="w-4 h-4 mr-2" />
            Nova Conformidade
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Usuários" value={loading ? "…" : stats.usuarios} hint="Total cadastrados" icon="users" />
        <KpiCard title="Síndicos" value={loading ? "…" : stats.sindicos} hint="Administradores ativos" icon="shield" />
        <KpiCard title="Ativos" value={loading ? "…" : stats.ativos} hint="Equipamentos cadastrados" icon="package" />
        <KpiCard title="Gastos" value={stats.gastos} hint="Mês atual" icon="money" />
      </div>

      {/* Corpo principal: Calendário + Alertas / Próximas */}
      <div className="grid grid-cols-12 gap-4">
        {/* Calendário */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle>Calendário (semana)</CardTitle>
            <CardDescription>Manutenções agendadas</CardDescription>

            {/* Chips de status */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-blue-100 text-blue-700">● Agendado</span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-yellow-100 text-yellow-800">● Iminente</span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-red-100 text-red-700">● Atrasado</span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-green-100 text-green-700">● Executado</span>
            </div>
          </CardHeader>
          <CardContent>
            <MiniCalendar onOpenAgenda={(iso) => nav(`/agenda${iso ? `?date=${iso}` : ''}`)} view="listWeek" events={eventos} />
          </CardContent>
        </Card>

        {/* Coluna lateral */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Alertas Prioritários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertas.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum alerta crítico</p>
              ) : (
                <ul className="space-y-2">
                  {alertas.map((a) => (
                    <li key={a.id} className="text-sm">
                      <span className="font-medium">{a.titulo}</span>
                      <span className="ml-2 inline-flex items-center text-red-600">● {a.severidade}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Próximas Manutenções
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proximas.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma manutenção próxima</p>
              ) : (
                <ul className="space-y-2">
                  {proximas.map((p) => (
                    <li key={p.id} className="text-sm">
                      <span className="font-medium">{p.titulo}</span>
                      <span className="ml-2 text-gray-500">
                        {new Date(p.data).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* OS recentes + Acesso rápido a relatórios / conformidade */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* OS Recentes */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Ordens de Serviço Recentes</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            {osRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma OS recente.</p>
            ) : (
              <div className="overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">OS</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Ativo</th>
                      <th className="px-4 py-2 text-left">Executor</th>
                      <th className="px-4 py-2 text-left">Prevista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {osRecentes.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-2">
                          <div className="font-medium">{r.titulo}</div>
                          <div className="text-xs text-gray-500">{r.id}</div>
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge status={r.status ?? "aberta"} />
                        </td>
                        <td className="px-4 py-2">{r.ativo_nome ?? "-"}</td>
                        <td className="px-4 py-2">{r.executor ?? "-"}</td>
                        <td className="px-4 py-2">
                          {r.previsao ? new Date(r.previsao).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acesso rápido */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Relatórios e páginas-chave</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={() => nav("/relatorios")} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Relatório de Manutenções
            </Button>
            <Button className="w-full justify-start" onClick={() => nav("/relatorios")} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Relatório Financeiro
            </Button>
            <Button className="w-full justify-start" onClick={() => nav("/conformidade")} variant="outline">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Status de Conformidade
            </Button>
            <Button className="w-full justify-start" onClick={() => nav("/os")} variant="outline">
              <ClipboardList className="w-4 h-4 mr-2" />
              Gerenciar OS
            </Button>
            <Button className="w-full justify-start" onClick={() => nav("/ativos")} variant="outline">
              <Wrench className="w-4 h-4 mr-2" />
              Gestão de Ativos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Badge de status igual ao usado nas telas de OS */
function StatusBadge({ status }: { status: "aberta" | "em andamento" | "concluida" | "cancelada" }) {
  const map: Record<string, string> = {
    aberta: "bg-gray-100 text-gray-700",
    "em andamento": "bg-yellow-100 text-yellow-800",
    concluida: "bg-green-100 text-green-700",
    cancelada: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status]}`}>{status}</span>;
}
