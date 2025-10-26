import { useEffect, useMemo, useState } from "react";
import {
  listConformidadeItens,
  registrarExecucaoConformidade,
  updateConformidadeDatas,
  listConformidadeAnexos,
  uploadConformidadeAnexo,
  getSignedUrl,
  listConformidadeLogs,
  listAtivoTipos,
  listAtivos,
  listPlanosByAtivo,
  listManutencoesByAtivo,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, Info, Paperclip, CheckCircle2, ChevronDown, ChevronRight, User, MapPin, Factory, AlertTriangle, ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Page } from "@/components/layout/CheckPage";

/* ========= utils ========= */
type Semaforo = "verde" | "amarelo" | "vermelho";

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
function humanizeTipo(raw?: string | null) {
  if (!raw) return "—";
  const s = String(raw).trim().toLowerCase().replace(/_/g, " ");
  if (s === "spda") return "SPDA";
  if (s === "pmoc") return "PMOC";
  if (s === "gas") return "Gás";
  if (s === "incendio") return "Incêndio";
  if (s === "inspecao predial") return "Inspeção Predial";
  if (s === "elevadores") return "Elevadores";
  if (s === "reservatorios") return "Reservatórios";
  if (s === "eletrica") return "Elétrica";
  if (s === "brigada") return "Brigada";
  return titleCase(s);
}
function getItemTipo(item: any): string | null {
  const v = item?.tipo ?? item?.conf_tipo ?? item?.categoria ?? null;
  return v ? String(v) : null;
}
const dot: Record<Semaforo, string> = {
  verde: "bg-green-500",
  amarelo: "bg-yellow-500",
  vermelho: "bg-rose-500",
};
function toISO(x?: string | null) {
  if (!x) return null;
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function compareISO(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}
/** diferença em dias usando 00:00 **local** (não UTC) */
function daysUntilLocal(iso?: string | null) {
  if (!iso) return Infinity;
  const target = new Date(iso);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
function statusFromNext(isoNext: string | null): Semaforo {
  const n = daysUntilLocal(isoNext);
  if (n < 0) return "vermelho";
  if (n <= 30) return "amarelo";
  return "verde";
}
function isSynthetic(item: any) {
  return String(item?.id || "").startsWith("ativo:");
}

/* ========= página ========= */
export default function Conformidade() {
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [fTipo, setFTipo] = useState<string>("todos");

  const [openGroup, setOpenGroup] = useState<Record<Semaforo, boolean>>({
    vermelho: true,
    amarelo: true,
    verde: true,
  });

  // modais
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [openRes, setOpenRes] = useState(false);
  const [resItem, setResItem] = useState<any | null>(null);

  // quando o item é sintético, mostramos detalhes do ativo aqui
  const [syntheticPlanos, setSyntheticPlanos] = useState<any[]>([]);
  const [syntheticManuts, setSyntheticManuts] = useState<any[]>([]);

  const [tiposDisponiveis, setTiposDisponiveis] = useState<string[]>([]);

  /** Calcula próximo/último/periodicidade a partir de planos+manutenções do ativo */
  async function calcDatasParaAtivo(ativoId: string) {
    const [planos, manuts] = await Promise.all([
      listPlanosByAtivo(ativoId).catch(() => []),
      listManutencoesByAtivo(ativoId).catch(() => []),
    ]);

    // considerar somente tarefas que realmente contam para o próximo
    const STATUS_CONTAM = new Set(["pendente", "agendada", "executando"]);
    const pendentes = (manuts ?? []).filter(
      (m: any) => STATUS_CONTAM.has(m.status) && m.vencimento
    );
    // 1) preferência: manutenção pendente mais próxima
    let proximo =
      pendentes
        .map((m: any) => toISO(m.vencimento))
        .filter(Boolean)
        .sort(compareISO)[0] || null;

    // 2) fallback: próxima execução do plano
    if (!proximo && (planos ?? []).length > 0) {
      const fromPlan = planos
        .map((p: any) => toISO(p.proxima_execucao))
        .filter(Boolean)
        .sort(compareISO)[0];
      proximo = fromPlan || null;
    }

    const concluidas = (manuts ?? []).filter(
      (m: any) => m.status === "concluida" && m.executada_em
    );
    const ultimo =
      concluidas
        .map((m: any) => toISO(m.executada_em))
        .filter(Boolean)
        .sort((a, b) => compareISO(b, a))[0] || null;

    const periodicidade = (planos?.[0]?.periodicidade as string | undefined) ?? null;

    return { proximo, ultimo, periodicidade, status: statusFromNext(proximo), planos, manuts };
  }

  async function refresh() {
    setLoading(true);
    setErro(null);

    try {
      const [confItemsRaw, tipos, ativos] = await Promise.all([
        listConformidadeItens().catch(() => [] as any[]),
        listAtivoTipos().catch(() => [] as any[]),
        listAtivos().catch(() => [] as any[]),
      ]);

      const tipoMap = new Map<string, { is_conf: boolean; conf_tipo?: string | null }>();
      for (const t of tipos) {
        const key = String(t.nome || "").toLowerCase();
        tipoMap.set(key, { is_conf: !!t.is_conformidade, conf_tipo: t.conf_tipo ?? null });
      }

      const ativosElegiveis = ativos.filter((a: any) => {
        const info = tipoMap.get(String(a.tipo || "").toLowerCase());
        return info?.is_conf;
      });

      const calcByAtivoId = new Map<
        string,
        {
          proximo: string | null;
          ultimo: string | null;
          periodicidade: string | null;
          status: Semaforo;
          planos: any[];
          manuts: any[];
        }
      >();
      await Promise.all(
        ativosElegiveis.map(async (a: any) => {
          const c = await calcDatasParaAtivo(a.id);
          calcByAtivoId.set(a.id, c);
        })
      );

      let itensFinais: any[] = [];

      if (confItemsRaw.length > 0) {
        // enriquece com cálculos e força o status correto
        itensFinais = confItemsRaw.map((i: any) => {
          const ativoId = i?.ativo?.id ?? null;
          const calc = ativoId ? calcByAtivoId.get(ativoId) : undefined;

          const proximo = calc?.proximo ?? (i.proximo ? toISO(i.proximo) : null);
          const ultimo = calc?.ultimo ?? (i.ultimo ? toISO(i.ultimo) : null);
          const periodicidade = calc?.periodicidade ?? (i.periodicidade ?? null);
          const status = statusFromNext(proximo);

          const baseTipo =
            getItemTipo(i) ||
            (i?.ativo?.tipo
              ? tipoMap.get(String(i.ativo.tipo).toLowerCase())?.conf_tipo || slugify(i.ativo.tipo)
              : null);

          return {
            ...i,
            tipo: baseTipo ?? i.tipo ?? i.categoria ?? null,
            proximo,
            ultimo,
            periodicidade,
            status,
          };
        });
      } else {
        // fallback sintético com planos/manutenções
        itensFinais = ativosElegiveis.map((a: any) => {
          const info = tipoMap.get(String(a.tipo || "").toLowerCase());
          const confSlug = info?.conf_tipo || slugify(a.tipo || "");
          const calc = calcByAtivoId.get(a.id);
          return {
            id: `ativo:${a.id}`,
            tipo: confSlug,
            ativo: { id: a.id, nome: a.nome, local: a.local, tipo: a.tipo },
            proximo: calc?.proximo ?? null,
            ultimo: calc?.ultimo ?? null,
            periodicidade: calc?.periodicidade ?? null,
            observacoes: null,
            status: calc?.status ?? "verde",
          };
        });
      }

      // filtro de tipos
      const tiposFromItens = new Set<string>();
      itensFinais.forEach((i) => {
        const t = getItemTipo(i);
        if (t) tiposFromItens.add(t);
      });
      tipos
        .filter((t: any) => t?.is_conformidade)
        .forEach((t: any) => tiposFromItens.add(String(t.conf_tipo || slugify(t.nome || ""))));
      const listaTipos = Array.from(tiposFromItens).sort((a, b) =>
        humanizeTipo(a).localeCompare(humanizeTipo(b), "pt-BR")
      );

      // ordena por severidade e próximo
      const ordenado = itensFinais.sort((a, b) => {
        const sev = (s: Semaforo) => (s === "vermelho" ? 0 : s === "amarelo" ? 1 : 2);
        const sv = sev(a.status) - sev(b.status);
        if (sv !== 0) return sv;
        const cmp = compareISO(a.proximo ?? null, b.proximo ?? null);
        if (cmp !== 0) return cmp;
        return String(a?.ativo?.nome || "").localeCompare(String(b?.ativo?.nome || ""), "pt-BR");
      });

      setTiposDisponiveis(listaTipos);
      setItens(ordenado);
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao carregar conformidade");
      setItens([]);
      setTiposDisponiveis([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const resumo = useMemo(() => {
    const c = { verde: 0, amarelo: 0, vermelho: 0 } as any;
    itens.forEach((i) => (c[i.status as Semaforo] += 1));
    return c;
  }, [itens]);

  const grouped = useMemo(() => {
    const base = itens
      .filter((i) => (fTipo === "todos" ? true : slugify(getItemTipo(i) || "") === fTipo))
      .filter((i) => {
        if (!q.trim()) return true;
        const s = `${getItemTipo(i) ?? ""} ${i.observacoes ?? ""} ${i.ativo?.nome ?? ""} ${i.ativo?.tipo ?? ""} ${i.ativo?.local ?? ""}`.toLowerCase();
        return s.includes(q.toLowerCase());
      })
      .sort((a, b) => (new Date(a.proximo || 0).getTime() - new Date(b.proximo || 0).getTime()));

    const g: Record<Semaforo, any[]> = { vermelho: [], amarelo: [], verde: [] };
    base.forEach((i) => g[i.status as Semaforo]?.push(i));
    return g;
  }, [itens, q, fTipo]);

  async function openDetails(item: any) {
    setCurrent(item);

    // se for sintético, popula detalhes de ativo (planos/manuts) e não tenta anexos/logs da conformidade
    if (isSynthetic(item) && item?.ativo?.id) {
      const calc = await calcDatasParaAtivo(item.ativo.id);
      setSyntheticPlanos(calc.planos ?? []);
      setSyntheticManuts(calc.manuts ?? []);
      setAnexos([]);
      setLogs([]);
      setOpen(true);
      return;
    }

    // item real (com tabela de conformidade)
    const rows = await listConformidadeAnexos(item.id).catch(() => []);
    const withUrls = await Promise.all(
      rows.map(async (r: any) => ({ ...r, url: await getSignedUrl("conformidade", r.file_path, 3600).catch(() => "") }))
    );
    setAnexos(withUrls);

    const h = await listConformidadeLogs(item.id).catch(() => []);
    setLogs(h);

    setOpen(true);
  }

  function openResolver(item: any) {
    // para sintético não existe registro na tabela de conformidade; mandamos para o ativo
    if (isSynthetic(item)) {
      const id = item?.ativo?.id;
      if (!id) return;
      window.location.href = `/ativos?ativo=${encodeURIComponent(id)}&tab=historico`;
      return;
    }
    setResItem(item);
    setOpenRes(true);
  }

  const searchId = "conf-search";
  const tipoSelectId = "conf-tipo-select";

  return (
    <Page>
      <Page.Header
        icon={CalendarDays}
        title="Conformidade Predial"
        subtitle="Tudo que impacta conformidade, calculado a partir dos planos/manutenções dos ativos."
        actions={
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1"><span className={cls("w-2 h-2 rounded-full", dot.verde)} /> {resumo.verde}</span>
            <span className="flex items-center gap-1"><span className={cls("w-2 h-2 rounded-full", dot.amarelo)} /> {resumo.amarelo}</span>
            <span className="flex items-center gap-1"><span className={cls("w-2 h-2 rounded-full", dot.vermelho)} /> {resumo.vermelho}</span>
          </div>
        }
      />

      {erro && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>
            <div className="font-medium">Não foi possível carregar tudo</div>
            <div>{erro}</div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={searchId}>Pesquisar</Label>
              <Input
                id={searchId}
                placeholder="tipo, observações, ativo..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                name="pesquisar"
              />
            </div>
            <div>
              <Label htmlFor={tipoSelectId}>Tipo</Label>
              <select
                id={tipoSelectId}
                className="border rounded px-3 py-2 w-full"
                value={fTipo}
                onChange={(e) => setFTipo(e.target.value)}
                name="tipo"
              >
                <option value="todos">Todos</option>
                {tiposDisponiveis.map((v) => (
                  <option key={v} value={slugify(v)}>
                    {humanizeTipo(v)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <StatusSection
        titulo="Atrasados"
        cor="vermelho"
        itens={grouped.vermelho}
        open={openGroup.vermelho}
        setOpen={(v) => setOpenGroup((s) => ({ ...s, vermelho: v }))}
        onResolver={openResolver}
        onDetalhes={openDetails}
        loading={loading}
      />

      <StatusSection
        titulo="Vencem em breve"
        cor="amarelo"
        itens={grouped.amarelo}
        open={openGroup.amarelo}
        setOpen={(v) => setOpenGroup((s) => ({ ...s, amarelo: v }))}
        onResolver={openResolver}
        onDetalhes={openDetails}
        loading={loading}
      />

      <StatusSection
        titulo="Em dia"
        cor="verde"
        itens={grouped.verde}
        open={openGroup.verde}
        setOpen={(v) => setOpenGroup((s) => ({ ...s, verde: v }))}
        onResolver={openResolver}
        onDetalhes={openDetails}
        loading={loading}
      />

      {/* Detalhes */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="overflow-y-auto pr-1 max-h-[calc(80vh-5rem)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {current ? humanizeTipo(getItemTipo(current) || "") : "Detalhes"}
              </DialogTitle>
              <DialogDescription>
                {isSynthetic(current)
                  ? "Detalhes do ativo, planos e manutenções relacionadas."
                  : "Atualize datas, observações e gerencie os laudos."}
              </DialogDescription>
            </DialogHeader>

            {current && (
              <DetailsBody
                item={current}
                anexos={anexos}
                logs={logs}
                uploading={uploading}
                setUploading={setUploading}
                onRefresh={async () => {
                  await refresh();
                  if (!isSynthetic(current)) {
                    const updated = (await listConformidadeItens().catch(() => [])).find((x) => x.id === current.id);
                    setCurrent(updated || current);
                    const rows = await listConformidadeAnexos(current.id).catch(() => []);
                    const urls = await Promise.all(
                      rows.map(async (r: any) => ({ ...r, url: await getSignedUrl("conformidade", r.file_path, 3600).catch(() => "") }))
                    );
                    setAnexos(urls);
                    const h = await listConformidadeLogs(current.id).catch(() => []);
                    setLogs(h);
                  }
                }}
                // dados extras quando sintético
                planosSynthetic={isSynthetic(current) ? syntheticPlanos : undefined}
                manutsSynthetic={isSynthetic(current) ? syntheticManuts : undefined}
                onOpenAtivo={() => current?.ativo?.id && (window.location.href = `/ativos?ativo=${encodeURIComponent(current.ativo.id)}&tab=historico`)}
              />
            )}

            <DialogFooter className="sm:justify-start">
              <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolver com data (apenas itens reais) */}
      <Dialog open={openRes} onOpenChange={setOpenRes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar resolução</DialogTitle>
            <DialogDescription>
              Informe a data em que o item foi executado (pode ter sido ontem ou outro dia).
            </DialogDescription>
          </DialogHeader>

          {resItem && (
            <ResolverBody
              onClose={() => setOpenRes(false)}
              onDone={async (dataISO) => {
                await registrarExecucaoConformidade(resItem.id, dataISO);
                const h = await listConformidadeLogs(resItem.id).catch(() => []);
                setLogs(h);
                await refresh();
                setOpenRes(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
}

/* ========= Section ========= */
function StatusSection({
  titulo, cor, itens, open, setOpen, onResolver, onDetalhes, loading,
}: {
  titulo: string;
  cor: "vermelho" | "amarelo" | "verde";
  itens: any[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onResolver: (item: any) => void;
  onDetalhes: (item: any) => Promise<void> | void;
  loading: boolean;
}) {
  const headerColor =
    cor === "vermelho" ? "bg-rose-50 border-rose-200"
    : cor === "amarelo" ? "bg-yellow-50 border-yellow-200"
    : "bg-green-50 border-green-200";

  return (
    <Card>
      <CardHeader className={cls("py-3 border-b", headerColor, "cursor-pointer select-none")} onClick={() => setOpen(!open)}>
        <CardTitle className="text-base flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className={cls("w-2 h-2 rounded-full", dot[cor])}></span>
          {titulo} <span className="text-gray-500 font-normal">({itens.length})</span>
        </CardTitle>
        <CardDescription className="text-xs">
          {cor === "vermelho" && "Itens vencidos"}
          {cor === "amarelo" && "Itens próximos do vencimento (≤ 30 dias)"}
          {cor === "verde" && "Itens em conformidade"}
        </CardDescription>
      </CardHeader>

      {open && (
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-50 [&>th]:p-2">
                <th>Tipo</th>
                <th>Ativo</th>
                <th>Próximo</th>
                <th>Último</th>
                <th>Periodicidade</th>
                <th>Obs.</th>
                <th className="text-right pr-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="p-2 capitalize">{humanizeTipo(getItemTipo(i) || "")}</td>
                  <td className="p-2">
                    {i.ativo ? (
                      <div className="text-xs text-gray-700">
                        <div className="flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> {i.ativo.nome}</div>
                        <div className="flex items-center gap-1 text-gray-500"><MapPin className="w-3.5 h-3.5" /> {i.ativo.local ?? "—"}</div>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="p-2">{i.proximo ? new Date(i.proximo).toLocaleDateString() : "—"}</td>
                  <td className="p-2">{i.ultimo ? new Date(i.ultimo).toLocaleDateString() : "—"}</td>
                  <td className="p-2 whitespace-nowrap">{i.periodicidade ?? "—"}</td>
                  <td className="p-2 truncate max-w-[240px]" title={i.observacoes ?? ""}>
                    <span className="truncate">{i.observacoes ?? "—"}</span>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" className="h-8" onClick={() => onResolver(i)} title={String(i?.id || "").startsWith("ativo:") ? "Ir para o ativo para concluir" : "Resolver"}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {String(i?.id || "").startsWith("ativo:") ? "Resolver no ativo" : "Resolver"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => onDetalhes(i)}>
                        <Info className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && itens.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={7}>Sem itens neste grupo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  );
}

/* ========= Detalhes ========= */
function DetailsBody({
  item, anexos, logs, uploading, setUploading, onRefresh,
  planosSynthetic, manutsSynthetic, onOpenAtivo,
}: {
  item: any;
  anexos: any[];
  logs: any[];
  uploading: boolean;
  setUploading: (v: boolean) => void;
  onRefresh: () => Promise<void>;
  // extras quando for item sintético
  planosSynthetic?: any[];
  manutsSynthetic?: any[];
  onOpenAtivo?: () => void;
}) {
  const isSynth = String(item?.id || "").startsWith("ativo:");
  const lastId = "det-ultimo";
  const nextId = "det-proximo";
  const perId = "det-periodicidade";
  const obsId = "det-observacoes";
  const uploadId = "det-upload-input";

  const [form, setForm] = useState({
    ultimo: item.ultimo ? String(item.ultimo).substring(0, 10) : "",
    proximo: item.proximo ? String(item.proximo).substring(0, 10) : "",
    observacoes: item.observacoes ?? "",
  });

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (isSynth) {
      onOpenAtivo?.();
      return;
    }
    await updateConformidadeDatas(item.id, {
      ultimo: form.ultimo || null,
      proximo: form.proximo || null,
      observacoes: form.observacoes || null,
    });
    await onRefresh();
  }

  async function onUpload(f?: File | null) {
    if (!f || isSynth) {
      onOpenAtivo?.();
      return;
    }
    setUploading(true);
    try {
      await uploadConformidadeAnexo(item.id, f);
      await onRefresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4">
      {item.ativo && (
        <div className="rounded-md border p-3 text-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">Ativo:</span>
            <span className="flex items-center gap-1"><Factory className="w-4 h-4" /> {item.ativo.nome}</span>
            {item.ativo.local && <span className="flex items-center gap-1 text-gray-600"><MapPin className="w-4 h-4" /> {item.ativo.local}</span>}
          </div>
          {onOpenAtivo && (
            <Button size="sm" variant="outline" onClick={onOpenAtivo} title="Abrir o ativo para gerenciar">
              <ExternalLink className="w-4 h-4 mr-1" />
              Abrir ativo
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={lastId}>Último</Label>
          <Input id={lastId} type="date" value={form.ultimo} onChange={(e) => setForm((x) => ({ ...x, ultimo: e.target.value }))} disabled={isSynth} />
        </div>
        <div>
          <Label htmlFor={nextId}>Próximo</Label>
          <Input id={nextId} type="date" value={form.proximo} onChange={(e) => setForm((x) => ({ ...x, proximo: e.target.value }))} disabled={isSynth} />
        </div>
        <div>
          <Label htmlFor={perId}>Periodicidade</Label>
          <Input id={perId} disabled value={item.periodicidade ?? "—"} />
        </div>
        {!isSynth && (
          <div className="md:col-span-3">
            <Label htmlFor={obsId}>Observações</Label>
            <Input id={obsId} value={form.observacoes} onChange={(e) => setForm((x) => ({ ...x, observacoes: e.target.value }))} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSave}>
          <CheckCircle2 className="w-4 h-4 mr-1" />
          {isSynth ? "Gerenciar no ativo" : "Salvar alterações"}
        </Button>
      </div>

      {!isSynth && (
        <div className="border rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Laudos/Certificados</div>
            <label htmlFor={uploadId} className="inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md border cursor-pointer">
              <Paperclip className="w-4 h-4" />
              {uploading ? "Enviando..." : "Anexar"}
            </label>
            <input id={uploadId} type="file" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
          </div>

          {anexos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum anexo ainda.</p>
          ) : (
            <ul className="divide-y text-sm">
              {anexos.map((a) => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div className="truncate">
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {a.file_path.split("/").pop()}
                    </a>
                    <span className="text-gray-500 ml-2">• {a.created_at ? new Date(a.created_at).toLocaleString() : ""}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isSynth && (
        <div className="grid gap-4">
          <div className="border rounded-md">
            <div className="px-3 py-2 font-medium">Planos do ativo</div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="[&>th]:p-2 text-left">
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Periodicidade</th>
                    <th>Próxima</th>
                  </tr>
                </thead>
                <tbody>
                  {(planosSynthetic ?? []).map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.titulo}</td>
                      <td className="p-2 capitalize">{p.tipo}</td>
                      <td className="p-2">{p.periodicidade}</td>
                      <td className="p-2">{p.proxima_execucao ? new Date(p.proxima_execucao).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                  {(planosSynthetic ?? []).length === 0 && (
                    <tr><td className="p-4 text-center text-gray-500" colSpan={4}>Sem planos cadastrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border rounded-md">
            <div className="px-3 py-2 font-medium">Manutenções do ativo</div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="[&>th]:p-2 text-left">
                    <th>Título</th>
                    <th>Status</th>
                    <th>Vencimento</th>
                    <th>Executada em</th>
                  </tr>
                </thead>
                <tbody>
                  {(manutsSynthetic ?? []).map((m: any) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2">{m.titulo}</td>
                      <td className="p-2">{m.status}</td>
                      <td className="p-2">{m.vencimento ? new Date(m.vencimento).toLocaleDateString() : "—"}</td>
                      <td className="p-2">{m.executada_em ? new Date(m.executada_em).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                  {(manutsSynthetic ?? []).length === 0 && (
                    <tr><td className="p-4 text-center text-gray-500" colSpan={4}>Sem manutenções ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!isSynth && (
        <div className="border rounded-md p-3">
          <div className="font-medium mb-2">Histórico</div>
          <div className="max-h-60 overflow-y-auto pr-1">
            {(!logs || logs.length === 0) ? (
              <p className="text-sm text-gray-500">Sem eventos registrados.</p>
            ) : (
              <ul className="divide-y">
                {logs.map((l) => <LogRow key={l.id} log={l} />)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= Log ========= */
function LogRow({ log }: { log: any }) {
  const { acao, created_at, actorName, detalhesParsed, detalhes } = log;
  const [open, setOpen] = useState(false);

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");
  const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");
  const d = detalhesParsed ?? detalhes ?? null;

  const ActionBadge = () => {
    if (acao === "resolver") return <Badge className="bg-green-600">Resolvido</Badge>;
    if (acao === "remarcar") return <Badge>Remarcado</Badge>;
    if (acao === "anexar") return <Badge variant="secondary">Anexo</Badge>;
    return <Badge variant="outline">{acao}</Badge>;
  };

  const Summary = () => {
    if (acao === "resolver") {
      const ult = d?.ultimo ?? d?.último ?? d?.last ?? d?.date;
      const prox = d?.proximo ?? d?.próximo ?? d?.next;
      return (
        <span>
          Executado em <strong>{fmtDate(ult)}</strong>
          {prox ? <> • Próximo <strong>{fmtDate(prox)}</strong></> : null}
        </span>
      );
    }
    if (acao === "remarcar") {
      const from = d?.de ?? d?.from ?? d?.old;
      const to = d?.para ?? d?.to ?? d?.new;
      return (
        <span>
          Remarcado: <strong>{fmtDate(from)}</strong> → <strong>{fmtDate(to)}</strong>
          {d?.motivo ? <> • motivo: <em>{String(d.motivo)}</em></> : null}
        </span>
      );
    }
    if (acao === "anexar") {
      const name = d?.file_name ?? d?.nome ?? d?.name ?? "arquivo";
      return <>Anexou <strong>{name}</strong></>;
    }
    return typeof d === "string" ? d : "";
  };

  const Details = () => {
    if (!d) return null;
    if (acao === "resolver") {
      return (
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-gray-500">Último</dt><dd>{fmtDate(d.ultimo ?? d.último ?? d.last ?? d.date)}</dd>
          {d.proximo || d.próximo || d.next ? (<><dt className="text-gray-500">Próximo</dt><dd>{fmtDate(d.proximo ?? d.próximo ?? d.next)}</dd></>) : null}
        </dl>
      );
    }
    if (acao === "remarcar") {
      return (
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-gray-500">De</dt><dd>{fmtDate(d.de ?? d.from ?? d.old)}</dd>
          <dt className="text-gray-500">Para</dt><dd>{fmtDate(d.para ?? d.to ?? d.new)}</dd>
          {d.motivo ? (<><dt className="text-gray-500">Motivo</dt><dd>{String(d.motivo)}</dd></>) : null}
          {d.modo ? (<><dt className="text-gray-500">Modo</dt><dd>{String(d.modo)}</dd></>) : null}
        </dl>
      );
    }
    if (acao === "anexar") {
      const size = typeof d.size === "number" ? `${(d.size / 1024).toFixed(1)} KB` : d.size;
      return (
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-gray-500">Arquivo</dt><dd>{d.file_name ?? d.nome ?? d.name ?? "—"}</dd>
          <dt className="text-gray-500">Caminho</dt><dd className="truncate">{d.file_path ?? "—"}</dd>
          {d.size ? (<><dt className="text-gray-500">Tamanho</dt><dd>{String(size)}</dd></>) : null}
        </dl>
      );
    }
    return <pre className="text-xs bg-gray-50 rounded p-2 overflow-auto">{typeof d === "string" ? d : JSON.stringify(d, null, 2)}</pre>;
  };

  return (
    <li className="py-2">
      <div className="flex items-center gap-2 text-sm">
        <ActionBadge />
        <div className="truncate"><Summary /></div>
      </div>

      <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
        <User className="w-3.5 h-3.5" />
        <span className="truncate">{log.actorName ?? "Usuário"}</span>
        <span>• {fmtDateTime(log.created_at)}</span>
        <span className="mx-1">•</span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-blue-600 hover:underline">
          {open ? "Ocultar detalhes" : "Mostrar detalhes"}
        </button>
      </div>

      {open && <div className="mt-2 pl-0.5"><Details /></div>}
    </li>
  );
}

/* ========= Resolver ========= */
function ResolverBody({
  onClose, onDone,
}: {
  onClose: () => void;
  onDone: (dataISO: string) => Promise<void>;
}) {
  const hojeISO = new Date().toISOString().slice(0, 10);
  const [dataExec, setDataExec] = useState<string>(hojeISO);
  const dataId = "res-data";

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    await onDone(dataExec);
    onClose();
  }

  return (
    <form onSubmit={confirmar} className="grid gap-4">
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor={dataId}>Data da execução</Label>
        <Input id={dataId} type="date" value={dataExec} onChange={(e) => setDataExec(e.target.value)} required max={new Date().toISOString().slice(0, 10)} />
        <p className="text-xs text-gray-500">Se foi ontem (ou outro dia), altere a data antes de confirmar.</p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit"><CheckCircle2 className="w-4 h-4 mr-1" />Confirmar</Button>
      </div>
    </form>
  );
}
