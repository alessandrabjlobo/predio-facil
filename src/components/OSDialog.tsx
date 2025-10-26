import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrdemServico } from "@/hooks/useOrdemServico";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ClipboardList,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Download,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OSDialogProps {
  osId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OSDialog = ({ osId, open, onOpenChange }: OSDialogProps) => {
  const { updateOSStatus, assignExecutor, validateOS } = useOrdemServico();
  const [executorNome, setExecutorNome] = useState("");
  const [executorContato, setExecutorContato] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: os, isLoading } = useQuery({
    queryKey: ["os-detalhes", osId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os")
        .select(`
          *,
          ativo:ativos(id, nome, local, tipo_id, ativo_tipos(nome, sistema_manutencao)),
          plano:planos_manutencao(id, titulo, tipo, checklist, periodicidade),
          solicitante:usuarios!os_solicitante_id_fkey(id, nome, email),
          executante:usuarios!os_executante_id_fkey(id, nome, email),
          validador:usuarios!os_validado_por_fkey(id, nome)
        `)
        .eq("id", osId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!osId,
  });

  const { data: anexos } = useQuery({
    queryKey: ["os-anexos", osId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os_anexos")
        .select("*")
        .eq("os_id", osId);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!osId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
      case "fechada":
        return "bg-green-500/10 text-green-700";
      case "aberta":
      case "em_execucao":
        return "bg-yellow-500/10 text-yellow-700";
      case "aguardando_validacao":
        return "bg-blue-500/10 text-blue-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const handleAssignExecutor = async () => {
    if (!executorNome || !executorContato) return;
    await assignExecutor.mutateAsync({
      osId,
      executorNome,
      executorContato,
    });
  };

  const handleValidate = async (aprovado: boolean) => {
    await validateOS.mutateAsync({
      osId,
      aprovado,
      observacoes,
    });
    onOpenChange(false);
  };

  if (isLoading || !os) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Ordem de Serviço - {os.numero}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-6">
              {/* Status e Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(os.status)}>
                  {os.status}
                </Badge>
                <Badge variant="outline">{os.prioridade}</Badge>
                <Badge variant="outline">{os.origem}</Badge>
              </div>

              {/* Informações Básicas */}
              <div className="space-y-4">
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
                {os.ativo && (
                  <div>
                    <Label className="text-sm font-semibold">Ativo</Label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">{os.ativo.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Local: {os.ativo.local}
                      </p>
                      {os.ativo.ativo_tipos && (
                        <p className="text-xs text-muted-foreground">
                          Sistema: {os.ativo.ativo_tipos.sistema_manutencao}
                        </p>
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
                      Data Abertura
                    </Label>
                    <p className="text-sm mt-1">
                      {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {os.data_prevista && (
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Data Prevista
                      </Label>
                      <p className="text-sm mt-1">
                        {new Date(os.data_prevista).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {os.sla_vencimento && (
                    <div>
                      <Label className="text-sm font-semibold">SLA Vencimento</Label>
                      <p className="text-sm mt-1">
                        {new Date(os.sla_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {os.data_conclusao && (
                    <div>
                      <Label className="text-sm font-semibold">Data Conclusão</Label>
                      <p className="text-sm mt-1">
                        {new Date(os.data_conclusao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Responsáveis */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Responsáveis
                  </Label>

                  {os.solicitante && (
                    <div>
                      <p className="text-xs text-muted-foreground">Solicitante</p>
                      <p className="text-sm">{os.solicitante.nome}</p>
                    </div>
                  )}

                  {os.status === "aberta" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Atribuir Executor</p>
                      <Input
                        placeholder="Nome do executor"
                        value={executorNome}
                        onChange={(e) => setExecutorNome(e.target.value)}
                      />
                      <Input
                        placeholder="Contato do executor"
                        value={executorContato}
                        onChange={(e) => setExecutorContato(e.target.value)}
                      />
                      <Button
                        onClick={handleAssignExecutor}
                        disabled={!executorNome || !executorContato}
                        size="sm"
                      >
                        Atribuir Executor
                      </Button>
                    </div>
                  ) : os.executor_nome && (
                    <div>
                      <p className="text-xs text-muted-foreground">Executor</p>
                      <p className="text-sm">{os.executor_nome}</p>
                      {os.executor_contato && (
                        <p className="text-xs text-muted-foreground">{os.executor_contato}</p>
                      )}
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
                      <p className="text-sm">
                        {os.custo_previsto ? `R$ ${os.custo_previsto}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aprovado</p>
                      <p className="text-sm">
                        {os.custo_aprovado ? `R$ ${os.custo_aprovado}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Final</p>
                      <p className="text-sm font-semibold">
                        {os.custo_final ? `R$ ${os.custo_final}` : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4 mt-6">
              {os.plano?.checklist && Array.isArray(os.plano.checklist) ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Checklist NBR 5674</Label>
                  {(os.plano.checklist as any[]).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Checkbox id={`check-${idx}`} />
                      <label
                        htmlFor={`check-${idx}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.item || item}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum checklist disponível</p>
              )}
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Documentos Anexados
                </Label>

                {anexos && anexos.length > 0 ? (
                  <div className="space-y-2">
                    {anexos.map((anexo) => (
                      <div
                        key={anexo.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{anexo.file_path.split('/').pop()}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                )}

                <Button variant="outline" className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Upload de Documentos
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-2">
                      <Clock className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="h-full w-px bg-border mt-2" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">OS Criada</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(os.data_abertura).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {os.executor_nome && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-blue-500 p-2">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      {os.data_conclusao && <div className="h-full w-px bg-border mt-2" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Executor Atribuído</p>
                      <p className="text-xs text-muted-foreground">{os.executor_nome}</p>
                    </div>
                  </div>
                )}

                {os.data_conclusao && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-500 p-2">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">OS Concluída</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(os.data_conclusao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Ações */}
          <div className="mt-6 space-y-4">
            {os.status === "aguardando_validacao" && (
              <div className="space-y-2">
                <Label>Observações de Validação</Label>
                <Textarea
                  placeholder="Adicione observações sobre a validação..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleValidate(true)}
                    className="flex-1 gap-2"
                    variant="default"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Aprovar OS
                  </Button>
                  <Button
                    onClick={() => handleValidate(false)}
                    className="flex-1 gap-2"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Reprovar
                  </Button>
                </div>
              </div>
            )}

            {os.status === "em_execucao" && (
              <Button
                onClick={() => updateOSStatus.mutate({ osId, status: "aguardando_validacao" })}
                className="w-full"
              >
                Marcar como Concluída
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
