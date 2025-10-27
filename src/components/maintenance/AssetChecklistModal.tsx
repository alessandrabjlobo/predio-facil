import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Calendar, User, CheckCircle2, Clock, AlertCircle, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { useNBRRequisitosByTipo } from "@/hooks/useNBRRequisitos";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateOSDialog } from "./CreateOSDialog";

interface AssetChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo: any;
}

export function AssetChecklistModal({ open, onOpenChange, ativo }: AssetChecklistModalProps) {
  const ativoTipoSlug = ativo?.ativo_tipos?.slug;
  const { data: nbrRequisitos, isLoading: isLoadingNBR } = useNBRRequisitosByTipo(ativoTipoSlug);
  const [historyPage, setHistoryPage] = useState(0);
  const pageSize = 10;
  const { data: historyData, isLoading: isLoadingHistory } = useAssetHistory(ativo?.id);
  const [createOSOpen, setCreateOSOpen] = useState(false);
  const [selectedNBR, setSelectedNBR] = useState<any>(null);

  if (!ativo) return null;

  const history = historyData?.data || [];
  const totalHistory = historyData?.count || 0;
  const totalPages = Math.ceil(totalHistory / pageSize);
  const paginatedHistory = history.slice(historyPage * pageSize, (historyPage + 1) * pageSize);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluida":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "em_andamento":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, validacao?: string) => {
    if (status === "concluida") {
      if (validacao === "aprovada") {
        return <Badge className="bg-success/10 text-success border-success">Aprovada</Badge>;
      }
      if (validacao === "reprovada") {
        return <Badge className="bg-danger/10 text-danger border-danger">Reprovada</Badge>;
      }
    }
    if (status === "em_andamento") {
      return <Badge className="bg-primary/10 text-primary border-primary">Em Andamento</Badge>;
    }
    return <Badge variant="outline">Aberta</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklist e Histórico - {ativo.nome}
          </DialogTitle>
          <DialogDescription>
            Requisitos NBR e histórico de manutenções executadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Asset Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações do Ativo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{ativo.ativo_tipos?.nome || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Local:</span>
                <p className="font-medium">{ativo.local || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status Conformidade:</span>
                <Badge className="mt-1">
                  {ativo.status_conformidade === "conforme" && "🟢 Conforme"}
                  {ativo.status_conformidade === "atencao" && "🟡 Atenção"}
                  {ativo.status_conformidade === "nao_conforme" && "🔴 Não Conforme"}
                  {!ativo.status_conformidade && "⚪ Pendente"}
                </Badge>
              </div>
              {ativo.proxima_manutencao && (
                <div>
                  <span className="text-muted-foreground">Próxima Manutenção:</span>
                  <p className="font-medium">
                    {format(new Date(ativo.proxima_manutencao), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NBR Requirements */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Requisitos NBR Aplicáveis
            </h3>
            
            {isLoadingNBR ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : !nbrRequisitos || nbrRequisitos.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma norma NBR aplicável para este tipo de ativo
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {nbrRequisitos.map((nbr) => (
                  <AccordionItem key={nbr.id} value={nbr.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Badge variant="outline" className="font-mono">
                          {nbr.nbr_codigo}
                        </Badge>
                        <div>
                          <p className="font-medium">{nbr.nbr_titulo}</p>
                          <p className="text-sm text-muted-foreground">{nbr.requisito_descricao}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Periodicidade Mínima:</span>
                          <p className="font-medium">{nbr.periodicidade_minima}</p>
                        </div>
                        {nbr.responsavel_sugerido && (
                          <div>
                            <span className="text-muted-foreground">Responsável Sugerido:</span>
                            <p className="font-medium capitalize">{nbr.responsavel_sugerido}</p>
                          </div>
                        )}
                      </div>

                      {nbr.checklist_items && Array.isArray(nbr.checklist_items) && nbr.checklist_items.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Itens do Checklist:</p>
                          <ul className="space-y-1 text-sm">
                            {nbr.checklist_items.map((item: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span>{typeof item === 'string' ? item : item.descricao || item.item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedNBR(nbr);
                          setCreateOSOpen(true);
                        }}
                      >
                        <Wrench className="h-3 w-3 mr-2" />
                        Gerar OS para este NBR
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Maintenance History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Histórico de Manutenções ({totalHistory})
              </h3>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
                    disabled={historyPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {historyPage + 1} de {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryPage(Math.min(totalPages - 1, historyPage + 1))}
                    disabled={historyPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {isLoadingHistory ? (
              <div className="text-center py-4 text-muted-foreground">Carregando histórico...</div>
            ) : !paginatedHistory || paginatedHistory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma manutenção executada ainda
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {paginatedHistory.map((os: any) => (
                  <Card key={os.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm flex items-center gap-2">
                            {getStatusIcon(os.status)}
                            OS #{os.numero || os.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {os.titulo}
                          </CardDescription>
                        </div>
                        {getStatusBadge(os.status, os.status_validacao)}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Abertura: {format(new Date(os.data_abertura), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {os.data_conclusao && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>
                            Conclusão: {format(new Date(os.data_conclusao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      {os.executante && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Executante: {os.executante.nome}</span>
                        </div>
                      )}
                      {os.plano && (
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                          Plano: {os.plano.titulo}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create OS Dialog for NBR */}
        <CreateOSDialog
          open={createOSOpen}
          onOpenChange={setCreateOSOpen}
          ativo={ativo}
          onSuccess={() => {
            setCreateOSOpen(false);
            // Optionally refresh history
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
