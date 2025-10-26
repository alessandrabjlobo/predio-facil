// src/pages/Chamados.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { listChamados, updateChamado } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCcw, LayoutList, LayoutGrid } from "lucide-react";

type Status = "aberto" | "em_andamento" | "concluido" | "cancelado";
type Prioridade = "baixa" | "media" | "alta" | "urgente";

const ALL = "__all"; // sentinela para "Todos"

type ViewMode = "list" | "cards";

export default function Chamados() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // filtros
  const [filtroStatus, setFiltroStatus] = useState<Status | undefined>(undefined);
  const [query, setQuery] = useState("");

  // visualização: padrão = lista
  const [view, setView] = useState<ViewMode>("list");

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const data = await listChamados();
      setItems(data ?? []);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar chamados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      await carregar();

      // Realtime
      channel = supabase
        .channel("realtime:chamados")
        .on("postgres_changes", { event: "*", schema: "public", table: "chamados" }, () => {
          carregar();
        })
        .subscribe();
    })();

    return () => {
      channel?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers
  function isOS(c: any) {
    const cat = String(c.categoria ?? "").toLowerCase().trim();
    const titulo = String(c.titulo ?? "");
    return cat === "manutencao" || /^OS\s*[–-]/i.test(titulo);
  }

  const filtrados = useMemo(() => {
    let data = items as any[];
    if (filtroStatus) data = data.filter((c) => c.status === filtroStatus);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      data = data.filter((c) =>
        [c.titulo, c.descricao, c.local, c.categoria]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q))
      );
    }
    return data;
  }, [items, filtroStatus, query]);

  // Particiona entre OS e Chamados
  const { os, chamados } = useMemo(() => {
    const osArr = [] as any[];
    const chamadosArr = [] as any[];
    for (const c of filtrados) (isOS(c) ? osArr : chamadosArr).push(c);
    return { os: osArr, chamados: chamadosArr };
  }, [filtrados]);

  async function changeStatus(id: string, alvo: Status) {
    try {
      setSavingId(id);
      await updateChamado(id, { status: alvo });
      // otimista
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: alvo } : c)));
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao atualizar status");
    } finally {
      setSavingId(null);
    }
  }

  function badgeStatus(s: Status) {
    const map: Record<Status, string> = {
      aberto: "bg-blue-50 text-blue-700 border border-blue-200",
      em_andamento: "bg-amber-50 text-amber-700 border border-amber-200",
      concluido: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      cancelado: "bg-red-50 text-red-700 border border-red-200",
    };
    return <span className={`text-xs px-2 py-1 rounded ${map[s]}`}>{s.replace("_", " ")}</span>;
  }

  function badgePrioridade(p: Prioridade) {
    const map: Record<Prioridade, string> = {
      baixa: "bg-gray-100 text-gray-700",
      media: "bg-sky-100 text-sky-700",
      alta: "bg-orange-100 text-orange-700",
      urgente: "bg-rose-100 text-rose-700",
    };
    return <span className={`text-xs px-2 py-1 rounded ${map[p]}`}>{p}</span>;
  }

  function StatusButtons({ c }: { c: any }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant={c.status === "aberto" ? "default" : "outline"}
          size="sm"
          disabled={savingId === c.id}
          onClick={() => changeStatus(c.id, "aberto")}
        >
          {savingId === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          aberto
        </Button>

        <Button
          variant={c.status === "em_andamento" ? "default" : "outline"}
          size="sm"
          disabled={savingId === c.id}
          onClick={() => changeStatus(c.id, "em_andamento")}
        >
          {savingId === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          em andamento
        </Button>

        <Button
          variant={c.status === "concluido" ? "default" : "outline"}
          size="sm"
          disabled={savingId === c.id}
          onClick={() => changeStatus(c.id, "concluido")}
        >
          {savingId === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          concluído
        </Button>

        <Button
          variant={c.status === "cancelado" ? "default" : "outline"}
          size="sm"
          disabled={savingId === c.id}
          onClick={() => changeStatus(c.id, "cancelado")}
        >
          {savingId === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          cancelado
        </Button>
      </div>
    );
  }

  // ======= VERSÃO LISTA =======
  function Tabela({ dados, titulo }: { dados: any[]; titulo: string }) {
    if (dados.length === 0) return null;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {titulo} <span className="text-gray-500 font-normal">({dados.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="[&>th]:p-3 text-left">
                <th>Título</th>
                <th className="w-[110px]">Prioridade</th>
                <th className="w-[140px]">Status</th>
                <th>Local</th>
                <th className="w-[160px]">Categoria</th>
                <th className="w-[190px]">Criado em</th>
                <th className="w-[280px] text-right pr-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 align-top">
                    <div className="font-medium">{c.titulo}</div>
                    {c.descricao && (
                      <div className="text-xs text-gray-600 line-clamp-2 mt-1">{c.descricao}</div>
                    )}
                  </td>
                  <td className="p-3 align-top">{badgePrioridade((c.prioridade || "baixa") as Prioridade)}</td>
                  <td className="p-3 align-top">{badgeStatus(c.status as Status)}</td>
                  <td className="p-3 align-top text-gray-700">
                    {typeof c.local === "undefined" ? "—" : c.local?.trim() || "—"}
                  </td>
                  <td className="p-3 align-top text-gray-700">
                    {typeof c.categoria === "undefined" ? "—" : c.categoria || "—"}
                  </td>
                  <td className="p-3 align-top text-gray-500">
                    {new Date(c.created_at ?? c.criado_em ?? Date.now()).toLocaleString()}
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/chamados/${c.id}`}>Ver detalhes</Link>
                      </Button>
                      <StatusButtons c={c} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }

  // ======= VERSÃO CARDS =======
  function GridCards({ dados, titulo }: { dados: any[]; titulo: string }) {
    if (dados.length === 0) return null;
    return (
      <div className="grid gap-3">
        <div className="text-sm font-medium text-gray-700">
          {titulo} <span className="text-gray-500 font-normal">({dados.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dados.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{c.titulo}</CardTitle>
                  <div className="flex items-center gap-2">
                    {badgePrioridade((c.prioridade || "baixa") as Prioridade)}
                    {badgeStatus(c.status as Status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="text-sm text-gray-700 space-y-2">
                {c.descricao && <p className="whitespace-pre-wrap">{c.descricao}</p>}

                {typeof c.local !== "undefined" && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Local:</span>{" "}
                    {c.local?.trim() ? c.local : <span className="text-gray-400">—</span>}
                  </div>
                )}

                {typeof c.categoria !== "undefined" && c.categoria && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Categoria:</span> {c.categoria}
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Criado em {new Date(c.created_at ?? c.criado_em ?? Date.now()).toLocaleString()}
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/chamados/${c.id}`}>Ver detalhes</Link>
                </Button>
                <StatusButtons c={c} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Cabeçalho / ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Chamados</h1>
        <div className="flex items-center gap-2">
          {/* Toggle de visualização */}
          <div className="flex rounded-md border">
            <Button
              type="button"
              variant={view === "list" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setView("list")}
              title="Ver em lista"
            >
              <LayoutList className="mr-2 h-4 w-4" />
              Lista
            </Button>
            <Button
              type="button"
              variant={view === "cards" ? "default" : "ghost"}
              className="rounded-none border-l"
              onClick={() => setView("cards")}
              title="Ver em cards"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Cards
            </Button>
          </div>

          <Button asChild>
            <Link to="/chamados/novo">
              <Plus className="mr-2 h-4 w-4" /> Novo chamado
            </Link>
          </Button>
          <Button variant="outline" onClick={carregar} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-64">
          <Select
            value={filtroStatus ?? ALL}
            onValueChange={(v) => setFiltroStatus(v === ALL ? undefined : (v as Status))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status (Todos)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="aberto">aberto</SelectItem>
              <SelectItem value="em_andamento">em andamento</SelectItem>
              <SelectItem value="concluido">concluído</SelectItem>
              <SelectItem value="cancelado">cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Buscar por título, descrição, local..."
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando chamados...
        </div>
      ) : erro ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-gray-600">Nenhum chamado encontrado.</CardContent>
        </Card>
      ) : view === "list" ? (
        // ======= VISÃO LISTA =======
        <div className="grid gap-6">
          <Tabela dados={os} titulo="OS (Ordens de Serviço)" />
          <Tabela dados={chamados} titulo="Chamados" />
        </div>
      ) : (
        // ======= VISÃO CARDS =======
        <div className="grid gap-8">
          <GridCards dados={os} titulo="OS (Ordens de Serviço)" />
          <GridCards dados={chamados} titulo="Chamados" />
        </div>
      )}
    </div>
  );
}
