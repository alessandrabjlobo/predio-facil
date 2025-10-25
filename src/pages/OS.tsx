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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Trash2, Upload, CheckCircle2, Clock, PlusCircle, XCircle } from "lucide-react";
import StatusPill from "@/components/StatusPill";

/* util simples p/ classes condicionais */
function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function statusLabel(s: OSStatus) {
  switch (s) {
    case "aberta": return "Abertas";
    case "em andamento": return "Em andamento";
    case "concluida": return "Concluídas";
    case "cancelada": return "Canceladas";
    default: return s;
  }
}

export default function OSPage() {
  const [params] = useSearchParams();
  const ativoFilter = params.get("ativo") || undefined;

  const [rows, setRows] = useState<OSRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OSStatus | "todas">("todas");

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Partial<OSRow>>({ titulo: "", descricao: "", responsavel: "" });

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

  return (
    <div className="px-6 py-5 max-w-[1320px] mx-auto space-y-4">
      {/* Cabeçalho da página */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">Ordens de Serviço</h1>
          <p className="section-desc">Registre, acompanhe e conclua as ordens de serviço do condomínio.</p>
          {ativoFilter && (
            <p className="text-xs text-gray-500 mt-1">
              Filtrando por ativo: <span className="font-medium">{ativoFilter}</span>
            </p>
          )}
        </div>
        <Button variant="outline" className="btn-outline h-9" onClick={() => setOpenForm(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Nova OS
        </Button>
      </div>

      {/* Card principal (estilo do print) */}
      <div className="card-like p-4">
        {/* Título do card */}
        <div className="mb-3">
          <h3 className="text-[15px] font-semibold text-gray-900">Ordens de Serviço</h3>
          <p className="text-sm text-gray-500">Filtre por status e acompanhe o andamento.</p>
        </div>

        {/* Abas “pill” centralizadas (todas / abertas / em andamento / concluídas / canceladas) */}
        <div className="w-full flex justify-center">
          <div className="tabs-pill">
            {(["todas", "aberta", "em andamento", "concluida", "cancelada"] as const).map((k) => (
              <button
                key={k}
                data-active={tab === k}
                onClick={() => setTab(k as any)}
                aria-pressed={tab === k}
              >
                {k === "todas" ? "Todas" : statusLabel(k as OSStatus)}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="table-wrap mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th className="text-right pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    Carregando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    Nenhuma OS encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.titulo}</td>
                    <td>
                      <StatusPill status={(r.status ?? "aberta") as OSStatus} />
                    </td>
                    <td>{r.responsavel || "—"}</td>
                    <td>{(r as any).data_abertura ? new Date((r as any).data_abertura).toLocaleString() : "—"}</td>
                    <td>{(r as any).data_fechamento ? new Date((r as any).data_fechamento).toLocaleString() : "—"}</td>
                    <td className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        {r.status !== "concluida" && r.status !== "cancelada" && (
                          <>
                            <Button className="btn-outline h-8" variant="outline" onClick={() => handleStatus(r.id, "em andamento")}>
                              <Clock className="h-4 w-4 mr-1" /> Em andamento
                            </Button>
                            <Button className="btn-outline h-8" onClick={() => handleStatus(r.id, "concluida")}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                            </Button>
                            <Button className="btn-outline h-8" variant="outline" onClick={() => handleStatus(r.id, "cancelada")}>
                              <XCircle className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="btn-outline h-8 w-9 p-0"
                              title="Anexos"
                              onClick={() => pedirArquivo(r)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {r.pdf_url ? (
                          <a
                            href={r.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-8 px-2 border rounded hover:bg-gray-50"
                            title="Abrir PDF"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="ml-1 text-xs">Abrir PDF</span>
                          </a>
                        ) : (r as any).pdf_path ? (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <FileText className="h-4 w-4 mr-1" /> PDF anexado
                          </span>
                        ) : null}

                        <Button size="icon" variant="destructive" onClick={() => handleDelete(r.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* input escondido para upload */}
      <input
        type="file"
        ref={fileRef}
        className="hidden"
        accept="application/pdf"
        onChange={onPickFile}
      />

      {/* Modal criar OS (shadcn) */}
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
