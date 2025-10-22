// src/pages/Ativos.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listAtivos,
  createAtivo,
  updateAtivo,
  listPlanosByAtivo,
  createPlano,
  listManutencoesByAtivo,
  concluirManutencao,
  uploadManutencaoAnexo,
  ensureDefaultPlanoParaAtivo,
  scheduleFromPlano,
  listAtivoTipos,
  AtivoTipoRow,
  deleteAtivoAndRelated,
  listManutencaoAnexos,
} from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  MapPin,
  Trash2,
  MoreVertical,
  Paperclip,
  CheckCircle2,
  FilePlus2,
  Wrench,
  ClipboardList,
} from "lucide-react";

/* ---------------- helpers ---------------- */
type Ativo = {
  id: string;
  nome: string;
  tipo: string;
  local?: string | null;
  created_at?: string;
};

type Plano = {
  id: string;
  ativo_id: string | null;
  titulo: string;
  tipo: "preventiva" | "preditiva" | "corretiva";
  periodicidade: string;
  proxima_execucao: string;
  checklist?: any;
  responsavel?: string;
};

type Manutencao = {
  id: string;
  ativo_id: string | null;
  plano_id?: string | null;
  titulo: string;
  tipo: string;
  status: "pendente" | "agendada" | "executando" | "concluida" | "cancelada";
  vencimento?: string | null;
  executada_em?: string | null;
  anexo_path?: string | null;
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* ------------- página ------------- */
export default function AtivosPage() {
  const [itens, setItens] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openUpsert, setOpenUpsert] = useState(false);
  const [edit, setEdit] = useState<Ativo | null>(null);

  // tipos (p/ dropdown e conformidade dinâmica)
  const [tipos, setTipos] = useState<AtivoTipoRow[]>([]);

  // detalhes
  const [openDetails, setOpenDetails] = useState(false);
  const [current, setCurrent] = useState<Ativo | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [manuts, setManuts] = useState<Manutencao[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // deep-link
  const [params] = useSearchParams();
  const deepAtivoId = params.get("ativo");
  const deepTabParam = (params.get("tab") as "planos" | "historico") || "planos";
  const deepManutId = params.get("manut") || undefined;

  const [tab, setTab] = useState<"planos" | "historico">("planos");

  async function refreshAtivos() {
    setLoading(true);
    try {
      const rows = await listAtivos();
      setItens(rows);
    } finally {
      setLoading(false);
    }
  }
  async function refreshTipos() {
    try {
      const rows = await listAtivoTipos();
      setTipos(rows);
    } catch (e) {
      console.warn("Falha ao listar tipos:", (e as any)?.message);
      setTipos([]);
    }
  }

  useEffect(() => {
    refreshAtivos();
    refreshTipos();
  }, []);

  // map para lookup rápido por slug/nome
  const tiposMap = useMemo(() => {
    const m = new Map<string, AtivoTipoRow>();
    for (const t of tipos) {
      if (t.slug) m.set(t.slug, t);
      m.set(slugify(t.nome), t);
      m.set(t.nome.toLowerCase(), t);
    }
    return m;
  }, [tipos]);

  function isConformidadeTipo(nome: string | undefined | null) {
    if (!nome) return false;
    const keySlug = slugify(nome);
    const keyLower = nome.toLowerCase();
    const row = tiposMap.get(keySlug) || tiposMap.get(keyLower);
    return !!row?.is_conformidade;
  }

  const listFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return itens;
    return itens.filter((a) => {
      const t = `${a.nome} ${a.tipo} ${a.local ?? ""}`.toLowerCase();
      return t.includes(s);
    });
  }, [itens, q]);

  const grupos = useMemo(() => {
    const m = new Map<string, Ativo[]>();
    for (const a of listFiltered) {
      const k = (a.tipo || "Outros").trim().toLowerCase();
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [listFiltered]);

  const [openGrupo, setOpenGrupo] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const init: Record<string, boolean> = {};
    for (const [k] of grupos) init[k] = true;
    setOpenGrupo(init);
  }, [grupos]);

  function expandirTudo() {
    const all: Record<string, boolean> = {};
    for (const [k] of grupos) all[k] = true;
    setOpenGrupo(all);
  }
  function recolherTudo() {
    const all: Record<string, boolean> = {};
    for (const [k] of grupos) all[k] = false;
    setOpenGrupo(all);
  }

  async function openDetailsFor(ativo: Ativo) {
    setCurrent(ativo);
    try {
      await ensureDefaultPlanoParaAtivo({ id: ativo.id, tipo: ativo.tipo });
    } catch {}
    const [p, m] = await Promise.all([listPlanosByAtivo(ativo.id), listManutencoesByAtivo(ativo.id)]);
    setPlanos(p);
    setManuts(m);
    setOpenDetails(true);
  }

  useEffect(() => {
    (async () => {
      if (!deepAtivoId || itens.length === 0) return;
      const alvo = itens.find((a) => a.id === deepAtivoId);
      if (!alvo) return;
      setTab(deepTabParam);
      await openDetailsFor(alvo);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, deepAtivoId]);

  async function excluirAtivo(a: Ativo) {
    const ok = window.confirm(
      `Excluir o ativo "${a.nome}"?\nIsso também removerá planos e manutenções relacionadas.`
    );
    if (!ok) return;
    setSubmitting(true);
    try {
      await deleteAtivoAndRelated(a.id);
      await refreshAtivos();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ativos</h1>
          <p className="text-gray-600">Cadastre os equipamentos/instalações e acompanhe planos e histórico.</p>
        </div>
        <Button
          onClick={() => {
            setEdit(null);
            setOpenUpsert(true);
          }}
        >
          Novo ativo
        </Button>
      </div>

      {/* Filtro */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 items-center">
            <div className="w-full max-w-md">
              <Input placeholder="buscar por nome, tipo, local..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela expansível */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Lista de Ativos</CardTitle>
              <CardDescription>Agrupados por tipo. Clique em um grupo para expandir.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={expandirTudo}>
                Expandir tudo
              </Button>
              <Button size="sm" variant="outline" onClick={recolherTudo}>
                Recolher tudo
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-auto rounded-b">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="[&>th]:p-3 text-left text-gray-700">
                  <th className="w-[44px]"></th>
                  <th>Grupo / Ativo</th>
                  <th>Local</th>
                  <th className="w-[160px]">Conformidade</th>
                  <th className="text-right pr-3 w-[160px]">Ações</th>
                </tr>
              </thead>

              <tbody>
                {grupos.map(([tipo, itensDoTipo]) => {
                  const aberto = openGrupo[tipo] ?? true;
                  const isConfGrupo = isConformidadeTipo(tipo);

                  return (
                    <React.Fragment key={tipo}>
                      {/* Grupo */}
                      <tr
                        className="border-t bg-white hover:bg-gray-50 cursor-pointer"
                        onClick={() => setOpenGrupo((s) => ({ ...s, [tipo]: !aberto }))}
                      >
                        <td className="p-3 align-middle">
                          {aberto ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          )}
                        </td>
                        <td className="p-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{titleCase(tipo)}</span>
                            <span className="text-gray-500">({itensDoTipo.length})</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-500">—</td>
                        <td className="p-3">
                          {isConfGrupo ? (
                            <div className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold">
                              <ShieldAlert className="h-4 w-4" />
                              Impacta conformidade
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-3"></td>
                      </tr>

                      {/* Ativos do grupo */}
                      {aberto &&
                        itensDoTipo.map((a, idx) => {
                          const isConfAtivo = isConformidadeTipo(a.tipo);
                          return (
                            <tr
                              key={a.id}
                              className={cls(
                                "border-t hover:bg-gray-50",
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              )}
                              onClick={() => openDetailsFor(a)}
                              style={{ cursor: "pointer" }}
                            >
                              <td className="p-3"></td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{a.nome}</span>
                                  <span className="text-gray-400">·</span>
                                  <span className="text-gray-500">{a.tipo}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                {a.local ? (
                                  <span className="inline-flex items-center gap-1 text-gray-700">
                                    <MapPin className="h-4 w-4" />
                                    {a.local}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                {isConfAtivo ? (
                                  <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold">
                                    <ShieldAlert className="h-4 w-4" />
                                    Conformidade
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDetailsFor(a);
                                    }}
                                  >
                                    Abrir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      excluirAtivo(a);
                                    }}
                                    disabled={submitting}
                                    title="Excluir ativo e seus dados relacionados"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}

                {!loading && grupos.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={5}>
                      Nenhum ativo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal cria/edita */}
      <UpsertAtivoDialog
        open={openUpsert}
        onOpenChange={setOpenUpsert}
        initial={edit}
        onSaved={async () => {
          await refreshAtivos();
        }}
        tipos={tipos}
      />

      {/* Modal detalhes */}
      <AtivoDetailsDialog
        open={openDetails}
        onOpenChange={setOpenDetails}
        ativo={current}
        isConfTipo={isConformidadeTipo(current?.tipo)}
        planos={planos}
        manuts={manuts}
        onRefresh={async () => {
          if (!current) return;
          const [p, m] = await Promise.all([listPlanosByAtivo(current.id), listManutencoesByAtivo(current.id)]);
          setPlanos(p);
          setManuts(m);
        }}
        submitting={submitting}
        setSubmitting={setSubmitting}
        tab={tab}
        setTab={setTab}
        deepManutId={deepManutId}
      />
    </div>
  );
}

/* ------------ Upsert Ativo ------------ */
function UpsertAtivoDialog({ open, onOpenChange, initial, onSaved, tipos }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Ativo | null;
  onSaved: () => Promise<void>;
  tipos: AtivoTipoRow[];
}) {
  const [form, setForm] = useState<{ nome: string; tipo: string; local: string }>(() => ({
    nome: initial?.nome ?? "",
    tipo: initial?.tipo ?? "",
    local: initial?.local ?? "",
  }));
  useEffect(() => {
    setForm({ nome: initial?.nome ?? "", tipo: initial?.tipo ?? "", local: initial?.local ?? "" });
  }, [initial]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.tipo.trim()) return;

    if (initial?.id) {
      await updateAtivo(initial.id, { ...form });
    } else {
      await createAtivo({ ...form });
    }
    await onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar ativo" : "Novo ativo"}</DialogTitle>
          <DialogDescription>Preencha os dados básicos do ativo.</DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} required />
          </div>

          <div>
            <Label>Tipo</Label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
              required
            >
              <option value="" disabled>
                Selecione um tipo…
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Local (opcional)</Label>
            <Input value={form.local} onChange={(e) => setForm((s) => ({ ...s, local: e.target.value }))} />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------ Detalhes do Ativo (abas) ------------ */
function AtivoDetailsDialog({
  open,
  onOpenChange,
  ativo,
  isConfTipo,
  planos,
  manuts,
  onRefresh,
  submitting,
  setSubmitting,
  tab,
  setTab,
  deepManutId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ativo: Ativo | null;
  isConfTipo: boolean;
  planos: Plano[];
  manuts: Manutencao[];
  onRefresh: () => Promise<void>;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  tab: "planos" | "historico";
  setTab: (v: "planos" | "historico") => void;
  deepManutId?: string;
}) {
  const navigate = useNavigate();

  // 👉 Agora ABRE o formulário /os/novo com sugestões via query string
  function criarOSParaAtivo() {
    if (!ativo) return;
    const params = new URLSearchParams({
      ativo: ativo.id,
      titulo: `OS – ${ativo.nome}`,
      descricao: `OS criada a partir do ativo "${ativo.nome}".`,
      origem: "ativo",
    });
    navigate(`/os/novo?${params.toString()}`);
  }

  function irParaOSDoAtivo() {
    if (!ativo) return;
    navigate(`/os?ativo=${ativo.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="truncate">{ativo?.nome ?? "Detalhes do ativo"}</span>
            <div className="flex items-center gap-2">
              {isConfTipo && (
                <span className="text-red-700 text-xs font-semibold">
                  Impacta conformidade
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <MoreVertical className="h-4 w-4" />
                    Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={criarOSParaAtivo}>
                    <Wrench className="w-4 h-4 mr-2" /> Nova OS para este ativo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={irParaOSDoAtivo}>
                    <ClipboardList className="w-4 h-4 mr-2" /> Ver OS deste ativo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Tipo: {ativo?.tipo}</span>
            {ativo?.local && <span>Local: {ativo.local}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="mt-2">
            <TabsList>
              <TabsTrigger value="planos">Planos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="planos" className="mt-3">
              <div className="max-h-[60vh] overflow-auto rounded border">
                <PlanosTab
                  ativo={ativo}
                  planos={planos}
                  onRefresh={onRefresh}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                />
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-3">
              <div className="max-h-[60vh] overflow-auto rounded border">
                <HistoricoTab
                  ativo={ativo}
                  manuts={manuts}
                  onRefresh={onRefresh}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  deepManutId={deepManutId}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------ Abas ------------ */

function PlanosTab({
  ativo,
  planos,
  onRefresh,
  submitting,
  setSubmitting,
}: {
  ativo: Ativo | null;
  planos: Plano[];
  onRefresh: () => Promise<void>;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState<
    Partial<Plano> & { qtdPeriodo?: number; tipoPeriodo?: "day" | "month" | "year" }
  >({
    titulo: "",
    tipo: "preventiva",
    qtdPeriodo: 1,
    tipoPeriodo: "month",
    proxima_execucao: new Date().toISOString().slice(0, 10),
    checklist: [],
    responsavel: "sindico",
  });

  async function addPlano(e: React.FormEvent) {
    e.preventDefault();
    if (!ativo) return;
    if (!form.titulo?.trim()) return;

    const n = Math.max(1, Number(form.qtdPeriodo ?? 1));
    const unit = form.tipoPeriodo ?? "month";
    const unitPlural = n === 1 ? unit : ((unit + "s") as "days" | "months" | "years");
    const periodicidade = `${n} ${unitPlural}`;

    setSubmitting(true);
    try {
      await createPlano({
        ativo_id: ativo.id,
        titulo: form.titulo!,
        tipo: (form.tipo as any) || "preventiva",
        periodicidade,
        proxima_execucao: form.proxima_execucao!,
        checklist: form.checklist ?? [],
        responsavel: form.responsavel ?? "sindico",
      });
      setForm((s) => ({ ...s, titulo: "" }));
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 p-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Novo plano</CardTitle>
          <CardDescription>Crie um ciclo para gerar tarefas recorrentes.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <Label>Título</Label>
            <Input value={form.titulo ?? ""} onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))} />
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={(form.tipo as string) ?? "preventiva"}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value as any }))}
            >
              <option value="preventiva">Preventiva</option>
              <option value="preditiva">Preditiva</option>
              <option value="corretiva">Corretiva</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Periodicidade</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                className="w-24"
                value={form.qtdPeriodo ?? 1}
                onChange={(e) => setForm((s) => ({ ...s, qtdPeriodo: Number(e.target.value) }))}
              />
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.tipoPeriodo ?? "month"}
                onChange={(e) => setForm((s) => ({ ...s, tipoPeriodo: e.target.value as any }))}
              >
                <option value="day">Dia(s)</option>
                <option value="month">Mês(es)</option>
                <option value="year">Ano(s)</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Próxima execução</Label>
            <Input
              type="date"
              value={form.proxima_execucao ?? new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm((s) => ({ ...s, proxima_execucao: e.target.value }))}
            />
          </div>
          <div className="md:col-span-6 flex justify-end gap-2">
            <Button onClick={addPlano} disabled={submitting}>
              Adicionar plano
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Planos deste ativo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="[&>th]:p-2 text-left">
                <th>Título</th>
                <th>Tipo</th>
                <th>Periodicidade</th>
                <th>Próxima</th>
                <th className="text-right pr-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {planos.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.titulo}</td>
                  <td className="p-2 capitalize">{p.tipo}</td>
                  <td className="p-2">{p.periodicidade}</td>
                  <td className="p-2">{new Date(p.proxima_execucao).toLocaleDateString()}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        title="Gerar tarefa (manutenção) a partir deste plano"
                        onClick={async () => {
                          if (!p.id) return;
                          setSubmitting(true);
                          try {
                            await scheduleFromPlano(p.id);
                            await onRefresh();
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Gerar tarefa
                      </Button>

                      <Button
                        size="sm"
                        title="Abrir formulário para gerar OS a partir deste plano"
                        onClick={() => {
                          if (!ativo) return;
                          const qs = new URLSearchParams({
                            ativo: ativo.id,
                            titulo: p.titulo ? `OS – ${p.titulo}` : "OS",
                            descricao: `OS criada a partir do plano "${p.titulo}".`,
                            origem: "plano",
                            vencimento: p.proxima_execucao ?? "",
                          });
                          navigate(`/os/novo?${qs.toString()}`);
                        }}
                      >
                        Gerar OS
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {planos.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={5}>
                    Nenhum plano para este ativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------ Histórico / Manutenções ------------ */
function HistoricoTab({
  ativo,
  manuts,
  onRefresh,
  submitting,
  setSubmitting,
  deepManutId,
}: {
  ativo: Ativo | null;
  manuts: Manutencao[];
  onRefresh: () => Promise<void>;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  deepManutId?: string;
}) {
  const navigate = useNavigate();

  const [openAnexos, setOpenAnexos] = useState(false);
  const [anexosDe, setAnexosDe] = useState<Manutencao | null>(null);
  const [anexos, setAnexos] = useState<Array<{ name: string; url: string }>>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);

  async function carregarAnexos(m: Manutencao) {
    setLoadingAnexos(true);
    try {
      const rows = await listManutencaoAnexos(m.id);
      setAnexos(rows);
    } catch {
      setAnexos([]);
    } finally {
      setLoadingAnexos(false);
    }
  }

  async function concluir(id: string, file?: File | null) {
    setSubmitting(true);
    try {
      let path: string | undefined;
      if (file) path = await uploadManutencaoAnexo(id, file);
      await concluirManutencao(id, path);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  const fileRef = useRef<HTMLInputElement | null>(null);
  function pedirArquivoEConcluir(m: Manutencao) {
    const el = fileRef.current;
    if (!el) return;
    el.dataset.manutId = m.id;
    el.click();
  }
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    const manutId = (e.target as HTMLInputElement).dataset.manutId;
    if (manutId) await concluir(manutId, f);
    e.currentTarget.value = "";
  }

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  useEffect(() => {
    if (!deepManutId) return;
    const el = rowRefs.current[deepManutId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-400");
      const t = setTimeout(() => el.classList.remove("ring-2", "ring-amber-400"), 2000);
      return () => clearTimeout(t);
    }
  }, [deepManutId]);

  return (
    <>
      <input type="file" ref={fileRef} className="hidden" onChange={onPickFile} accept="application/pdf,image/*" />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tarefas e execuções</CardTitle>
          <CardDescription>Conclua, gere OS e anexe comprovantes quando necessário.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="[&>th]:p-2 text-left">
                <th>Título</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th>Executada em</th>
                <th className="text-right pr-2 w-[64px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {manuts.map((m) => (
                <tr key={m.id} ref={(node) => (rowRefs.current[m.id] = node)} className="border-t">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span>{m.titulo}</span>
                      {(m.anexo_path ?? "").trim() ? (
                        <span className="inline-flex">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-2 capitalize">{m.tipo}</td>
                  <td className="p-2">
                    <span
                      className={cls(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        m.status === "concluida"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-gray-50 text-gray-800 border border-gray-200"
                      )}
                    >
                      {m.status === "concluida" ? "Concluída" : m.status}
                    </span>
                  </td>
                  <td className="p-2">{m.vencimento ? new Date(m.vencimento).toLocaleDateString() : "—"}</td>
                  <td className="p-2">{m.executada_em ? new Date(m.executada_em).toLocaleString() : "—"}</td>
                  <td className="p-2">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={async () => {
                              setAnexosDe(m);
                              await carregarAnexos(m);
                              setOpenAnexos(true);
                            }}
                          >
                            <Paperclip className="w-4 h-4 mr-2" /> Ver anexos
                          </DropdownMenuItem>

                          {m.status !== "concluida" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => concluir(m.id, null)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => pedirArquivoEConcluir(m)}>
                                <FilePlus2 className="w-4 h-4 mr-2" /> Concluir com anexo
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (!ativo) return;
                              const qs = new URLSearchParams({
                                ativo: ativo.id,
                                titulo: m.titulo ? `OS – ${m.titulo}` : "OS",
                                descricao: `OS criada a partir da manutenção "${m.titulo}".`,
                                origem: "manutencao",
                                vencimento: m.vencimento ?? "",
                              });
                              navigate(`/os/novo?${qs.toString()}`);
                            }}
                          >
                            Gerar OS
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {manuts.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={6}>
                    Nenhuma tarefa/execução para este ativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal de Anexos */}
      <Dialog open={openAnexos} onOpenChange={setOpenAnexos}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              {anexosDe ? `Anexos — ${anexosDe.titulo}` : "Anexos"}
            </DialogTitle>
          </DialogHeader>

          {loadingAnexos ? (
            <p className="text-sm text-gray-500">Carregando…</p>
          ) : anexos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum anexo para esta manutenção.</p>
          ) : (
            <ul className="divide-y rounded border">
              {anexos.map((a) => (
                <li key={a.url} className="p-2">
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {a.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
