// FILE: src/components/os/OSList.tsx
import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  listOS,
  createOS,
  updateOS,
  deleteOS,
  uploadOSPdf,
  OSRow,
  OSStatus,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

/** ===== Utils locais ===== */
function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function statusLabel(s: OSStatus) {
  switch (s) {
    case "aberta":
      return "Aberta";
    case "em andamento":
      return "Em andamento";
    case "concluida":
      return "Concluída";
    case "cancelada":
      return "Cancelada";
    default:
      return s;
  }
}

/** ===== API pública para o container chamar ===== */
export type OSListHandle = {
  abrirCriar: () => void;
  exportarCSV: () => void;
};

export type OSListProps = {
  /** no futuro podemos injetar callbacks aqui, se precisar */
};

const OSList = forwardRef<OSListHandle, OSListProps>(function OSList(_props, ref) {
  const [params] = useSearchParams();
  const ativoFilter = params.get("ativo") || undefined;

  const [rows, setRows] = useState<OSRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OSStatus | "todas">("aberta");

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Partial<OSRow>>({
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
      setRows(data);
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

  function pedirArquivo(os: OSRow) {
    const el = fileRef.current;
    if (!el) return;
    (el as any).dataset.osid = os.id;
    el.click();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    const osid = (e.target as HTMLInputElement).dataset.osid as string | undefined;
    if (f && osid) await handleFile(osid, f);
    e.currentTarget.value = "";
  }

  /** ====== Export simples para CSV ====== */
  function exportarCSV() {
    const headers = [
      "id",
      "titulo",
      "status",
      "responsavel",
      "data_abertura",
      "data_fechamento",
    ];
    const lines = filtered.map((r) =>
      [
        r.id,
        (r.titulo ?? "").replace(/"/g, '""'),
        r.status ?? "aberta",
        r.responsavel ?? "",
        r.data_abertura ?? "",
        r.data_fechamento ?? "",
      ].map((v) => `"${String(v ?? "")}"`).join(",")
    );
    const blob = new Blob(
      [[headers.join(","), ...lines].join("\n")],
      { type: "text/csv;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `os_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** expor métodos para o container (PageHeader) */
  useImperativeHandle(ref, () => ({
    abrirCriar: () => setOpenForm(true),
    exportarCSV,
  }));

  return (
    <div className="grid gap-6">
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
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2">{r.titulo}</td>
                          <td className="p-2">
                            <span
                              className={cls(
                                "px-2 py-0.5 rounded text-xs font-medium border",
                                r.status === "concluida"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : r.status === "em andamento"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : r.status === "cancelada"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              )}
                            >
                              {statusLabel((r.status ?? "aberta") as OSStatus)}
                            </span>
                          </td>
                          <td className="p-2">{r.responsavel || "—"}</td>
                          <td className="p-2">
                            {r.data_abertura
                              ? new Date(r.data_abertura).toLocaleString()
                              : "—"}
                          </td>
                          <td className="p-2">
                            {r.data_fechamento
                              ? new Date(r.data_fechamento).toLocaleString()
                              : "—"}
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex justify-end gap-2">
                              {r.status !== "concluida" && r.status !== "cancelada" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatus(r.id, "em andamento")}
                                  >
                                    <Clock className="h-4 w-4 mr-1" /> Em andamento
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatus(r.id, "concluida")}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatus(r.id, "cancelada")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Cancelar
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    title="Anexos"
                                    onClick={async () => {
                                      // TODO: abrir dialog de anexos (lista + upload)
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => pedirArquivo(r)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>

                              {r.pdf_url ? (
                                <a
                                  href={r.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center h-8 px-2 border rounded hover:bg-gray-50"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="ml-1 text-xs">Abrir PDF</span>
                                </a>
                              ) : r.pdf_path ? (
                                <span className="inline-flex items-center text-xs text-gray-500">
                                  <FileText className="h-4 w-4 mr-1" /> PDF anexado
                                </span>
                              ) : null}

                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDelete(r.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                required
                value={form.titulo ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <textarea
                id="descricao"
                className="border rounded w-full p-2 text-sm"
                rows={3}
                value={form.descricao ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
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
});

export default OSList;
