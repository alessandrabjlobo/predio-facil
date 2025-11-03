// src/components/OSDialog.tsx
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOS, assignOSExecutor, setOSStatus, validateOS, uploadOSPdf } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

import {
  ClipboardList,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react";

interface OSDialogProps {
  osId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OSDialog({ osId, open, onOpenChange }: OSDialogProps) {
  const [observacoes, setObservacoes] = useState("");
  const [executorNome, setExecutorNome] = useState("");
  const [executorContato, setExecutorContato] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Busca enxuta da OS
  const { data: os, isLoading, refetch } = useQuery({
    queryKey: ["os", osId],
    queryFn: async () => await getOS(osId),
    enabled: open && !!osId,
  });

  // Hidrata o ativo leve (id, nome, local)
  const { data: ativo } = useQuery({
    queryKey: ["os-ativo", os?.ativo_id],
    queryFn: async () => {
      if (!os?.ativo_id) return null;
      const { data, error } = await supabase
        .from("ativos")
        .select("id,nome,local")
        .eq("id", os.ativo_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!os?.ativo_id,
  });

  // PDF assinado, se existir
  const { data: pdfUrl } = useQuery({
    queryKey: ["os-pdf", os?.pdf_path],
    queryFn: async () => {
      if (!os?.pdf_path) return null;
      const { data, error } = await supabase
        .storage
        .from("os_docs")
        .createSignedUrl(os.pdf_path, 3600);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
    enabled: open && !!os?.pdf_path,
  });

  // Derivados seguros
  const checklist: any[] = useMemo(() => {
    if (!os?.checklist) return [];
    return Array.isArray(os.checklist) ? os.checklist : [];
  }, [os?.checklist]);

  const status = String(os?.status ?? "aberta");
  const prioridade = os?.prioridade ? String(os.prioridade) : undefined;
  const origem = os?.origem ? String(os.origem) : undefined;
  const tipoExecutor = (os as any)?.tipo_executor ? String((os as any).tipo_executor) : undefined;

  const getStatusColor = (s: string) => {
    switch (s) {
      case "concluida":
      case "fechada":
        return "bg-green-500/10 text-green-700";
      case "aberta":
      case "em andamento":
      case "em_execucao":
        return "bg-yellow-500/10 text-yellow-700";
      case "aguardando_validacao":
        return "bg-blue-500/10 text-blue-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const fmtBR = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  const money = (v?: number | string | null) => {
    if (v === null || v === undefined || v === "") return "-";
    const n = typeof v === "string" ? Number(v) : v;
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Ações
  const doAssign = async () => {
    if (!executorNome) return;
    await assignOSExecutor(osId, executorNome, executorContato || null);
    toast?.({ title: "Executor atribuído" });
    await refetch();
  };

  const doValidate = async (aprovado: boolean) => {
    await validateOS(osId, aprovado, observacoes || null);
    toast?.({ title: aprovado ? "OS aprovada" : "OS reprovada" });
    onOpenChange(false);
  };

  const doConcluir = async () => {
    await setOSStatus(osId, "concluida");
    toast?.({ title: "OS concluída" });
    onOpenChange(false);
  };

  const doUpload = async (file: File) => {
    const { url } = await uploadOSPdf(osId, file);
    if (url) toast?.({ title: "Documento anexado" });
    await refetch();
  };

  if (!open) return null;

  if (isLoading || !os) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carregando OS…</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Ordem de Serviço {os.numero ? `- ${os.numero}` : `#${os.id?.slice(0, 6)}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            {/* DETALHES */}
            <TabsContent value="detalhes" className="space-y-6 mt-6">
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(status)}>{status}</Badge>
                {prioridade && <Badge variant="outline">{prioridade}</Badge>}
                {origem && <Badge variant="outline">{origem}</Badge>}
                {tipoExecutor && <Badge variant="outline">{tipoExecutor}</Badge>}
              </div>

              <div className="space-y-4">
                {/* Título & Descrição */}
                <div>
                  <Label className="text-sm font-semibold">Título</Label>
                  <p className="text-sm mt-1">{os.titulo}</p>
                </div>
                {os.descricao && (
                  <div>
                    <Label className="text-sm font-semibold">Descrição</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{os.descricao}</p>
                  </div>
                )}

                <Separator />

                {/* Ativo */}
                {ativo && (
                  <div>
                    <Label className="text-sm font-semibold">Ativo</Label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">{ativo.nome}</p>
                      {ativo.local && (
                        <p className="text-xs text-muted-foreground">Local: {ativo.local}</p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Datas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Data de Abertura
                    </Label>
                    <p className="text-sm mt-1">{fmtBR(os.data_abertura)}</p>
                  </div>
                  {os.data_prevista && (
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Data Prevista
                      </Label>
                      <p className="text-sm mt-1">{fmtBR(os.data_prevista)}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Custos */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Custos
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Previsto</p>
                      <p className="text-sm">{money((os as any).custo_previsto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aprovado</p>
                      <p className="text-sm">{money((os as any).custo_aprovado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Final</p>
                      <p className="text-sm font-semibold">{money((os as any).custo_final)}</p>
                    </div>
                  </div>
                </div>

                {/* Atribuir executor (quando aberta) */}
                {status === "aberta" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Atribuir Executor</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome do executor"
                        value={executorNome}
                        onChange={(e) => setExecutorNome(e.target.value)}
                      />
                      <Input
                        placeholder="Contato (opcional)"
                        value={executorContato}
                        onChange={(e) => setExecutorContato(e.target.value)}
                      />
                    </div>
                    <Button className="mt-1" onClick={doAssign} disabled={!executorNome}>
                      Iniciar execução
                    </Button>
                  </div>
                )}

                {/* Concluir (quando em andamento) */}
                {(status === "em andamento" || status === "em_execucao") && (
                  <Button className="w-full" onClick={doConcluir}>
                    Marcar como concluída
                  </Button>
                )}

                {/* Validação (quando aguardando_validacao) */}
                {status === "aguardando_validacao" && (
                  <div className="space-y-2">
                    <Label>Observações de Validação</Label>
                    <Textarea
                      placeholder="Adicione observações sobre a validação..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" onClick={() => doValidate(true)}>
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        variant="destructive"
                        onClick={() => doValidate(false)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reprovar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CHECKLIST */}
            <TabsContent value="checklist" className="space-y-4 mt-6">
              {checklist.length ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Checklist</Label>
                  <ul className="space-y-2">
                    {checklist.map((it: any, i: number) => {
                      const label =
                        typeof it === "string" ? it : it?.titulo ?? it?.item ?? JSON.stringify(it);
                      return (
                        <li key={i} className="text-sm p-2 border rounded-md">
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum checklist disponível</p>
              )}
            </TabsContent>

            {/* DOCUMENTOS */}
            <TabsContent value="documentos" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Documentos
                </Label>

                {os.pdf_path ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{os.pdf_path.split("/").pop()}</span>
                    </div>
                    {pdfUrl && (
                      <a href={pdfUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost">Abrir</Button>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await doUpload(f);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload de Documento (PDF/Imagem)
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
