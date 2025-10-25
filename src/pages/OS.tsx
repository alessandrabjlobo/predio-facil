// src/pages/OS.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listOS,
  createOS,
  updateOS,
  deleteOS,
  uploadOSPdf,
  OSRow,
  OSStatus, // 'aberta' | 'em andamento' | 'concluida' | 'cancelada'
} from "@/lib/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  PlusCircle,
  XCircle,
} from "lucide-react";

/** ---- Correção de tipos ----
 * O tipo OSRow (da sua API) pode não declarar os campos abaixo,
 * mas a UI usa eles. Então estendemos localmente para o TS não reclamar.
 */
type Row = OSRow & {
  data_abertura?: string | null;
  data_fechamento?: string | null;
  abertura?: string | null;
  fechamento?: string | null;
  pdf_url?: string | null;
  pdf_path?: string | null;
  ativo_id?: string | null;
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function statusLabel(s: OSStatus) {
  switch (s) {
    case "aberta": return "Aberta";
    case "em andamento": return "Em andamento";
    case "concluida": return "Concluída";
    case "cancelada": return "Cancelada";
    default: return s;
  }
}

export default function OSPage() {
  const [params] = useSearchParams();
  const ativoFilter = params.get("ativo") || undefined;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OSStatus | "todas">("aberta");

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Partial<Row>>({
    titulo: "",
    descricao: "",
    responsavel: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listOS(ativoFilter ? ({ ativo_id: ativoFilter } as any) : undefined);
      setRows(data as Row[]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativoFilter]);

  const filtered = useMemo(() => {
    const base = tab === "todas" ? rows : rows.filter((r) => (r.status ?? "aberta") === tab);
    if (!ativoFilter) return base;
    return base.filter((r) => r.ativo_id === ativoFilter);
  }, [rows, tab, ativoFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim()) return;
    setSubmitting(true);
    try {
      await createOS({
        titulo: form.titulo!,
        descricao: (form.descricao ?? "").trim() || null,
        responsavel: (form.responsavel ?? "").trim() || null,
        ativo_id: ativoFilter || (form.ativo_id as string | undefined),
      });
      await refresh();
      setOpenForm(false);
      setForm({ titulo: "", descricao: "", responsavel: "" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta OS?")) return;
    setSubmitting(true);
    try {
      await deleteOS(id);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(id: string, novo: OSStatus) {
    setSubmitting(true);
    try {
      await updateOS(id, { status: novo });
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFile(id: string, file: File) {
    setSubmitting(true);
    try {
      await uploadOSPdf(id, file);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function pedirArquivo(os: Row) {
    const el = fileRef.current;
    if (!el) return;
    el.dataset.osid = os.id; // ok no TS por causa do tipo correto do elemento
    el.click();
  }
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    const osid = (e.target as HTMLInputElement).dataset.osid as string | undefined;
    if (f && osid) await handleFile(osid, f);
    e.currentTarget.value = "";
  }

  // Util: pega a melhor data disponível (data_abertura || abertura)
  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

  return (
    <div className="p-6 grid gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600">Registre, acompanhe e conclua as ordens de serviço do condomínio.</p>
          {ativoFilter && (
            <p className="text-xs text-gray-500 mt-1">
              Filtrando por ativo: <span className="font-medium">{ativoFilter}</span>
            </p>
          )}
        </div>
        <Button onClick={() => setOpenForm(true)}>
          <PlusCircle className="h-4 w-4 mr-1" /> Nova OS
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
          <CardDescription>Filtre por status e acompanhe o andamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="aberta">Abertas</TabsTrigger>
              <TabsTrigger value="em andamento">Em andamento</TabsTrigger>
              <TabsTrigger value="concluida">Concluídas</TabsTrigger>
              <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
            </TabsList>

            {/* Obs: o shadcn aceita um único TabsContent com value = {tab}? 
                Funciona, mas o "oficial" é ter um TabsContent por value.
                Mantive seu padrão pra não mudar a lógica. */}
            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <p className="text-gray-500 text-sm">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma OS encontrada.</p>
              ) : (
                <div className="overflow-auto rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="[&>th]:p-2 text-left">
                        <th>Título</th>
                        <th>Status</th>
                        <th>Responsável</th>
                        <th>Abertura</th>
                        <th>Fechamento</th>
                        <th className="text-right pr-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const abertura = r.data_abertura ?? r.abertura ?? null;
                        const fechamento = r.data_fechamento ?? r.fechamento ?? null;

                        return (
                          <tr key={r.id} className="border-t">
                            <td className="p-2">{r.titulo}</td>
                            <td className="p-2">
                              <span
                                className={cls(
                                  "px-2 py-0.5 rounded text-xs font-medium border",
                                  (r.status ?? "aberta") === "concluida"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : (r.status ?? "aberta") === "em andamento"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : (r.status ?? "aberta") === "cancelada"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                )}
                              >
                                {statusLabel((r.status ?? "aberta") as OSStatus)}
                              </span>
                            </td>
                            <td className="p-2">{r.responsavel || "—"}</td>
                            <td className="p-2">{fmt(abertura)}</td>
                            <td className="p-2">{fmt(fechamento)}</td>
                            <td className="p-2 text-right">
                              <div className="flex justify-end gap-2">
                                {r.status !== "concluida" && r.status !== "cancelada" && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "em andamento")}>
                                      <Clock className="h-4 w-4 mr-1" /> Em andamento
                                    </Button>
                                    <Button size="sm" onClick={() => handleStatus(r.id, "concluida")}>
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "cancelada")}>
                                      <XCircle className="h-4 w-4 mr-1" /> Cancelar
                                    </Button>
                                  </>
                                )}

                                {/* Upload PDF */}
                                <Button size="icon" variant="outline" onClick={() => pedirArquivo(r)} title="Anexar PDF">
                                  <Upload className="h-4 w-4" />
                                </Button>

                                {/* Abrir PDF (se disponível) */}
                                {"pdf_url" in r && r.pdf_url ? (
                                  <a
                                    href={r.pdf_url as string}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center h-8 px-2 border rounded hover:bg-gray-50"
                                    title="Abrir PDF"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="ml-1 text-xs">Abrir PDF</span>
                                  </a>
                                ) : "pdf_path" in r && r.pdf_path ? (
                                  <span className="inline-flex items-center text-xs text-gray-500">
                                    <FileText className="h-4 w-4 mr-1" /> PDF anexado
                                  </span>
                                ) : null}

                                {/* Excluir */}
                                <Button size="icon" variant="destructive" onClick={() => handleDelete(r.id)} title="Excluir">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* input escondido para upload */}
      <input
        type="file"
        ref={fileRef}
        className="hidden"
        accept="application/pdf"
        onChange={onPickFile}
      />

      {/* Modal criar OS */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
        <form onSubmit={handleCreate} className="grid gap-3">
            <div>
              <Label>Título</Label>
              <Input
                required
                value={form.titulo ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <textarea
                className="border rounded w-full p-2 text-sm"
                rows={3}
                value={form.descricao ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
              />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input
                value={form.responsavel ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, responsavel: e.target.value }))}
              />
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
