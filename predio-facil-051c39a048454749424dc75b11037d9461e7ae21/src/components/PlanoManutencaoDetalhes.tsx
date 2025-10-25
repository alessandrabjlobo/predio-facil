import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useConformidadeItens } from "@/hooks/useConformidadeItens";
import { useDocumentoUpload } from "@/hooks/useDocumentoUpload";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckCircle2, FileText, Upload, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface PlanoManutencaoDetalhesProps {
  planoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlanoManutencaoDetalhes = ({ planoId, open, onOpenChange }: PlanoManutencaoDetalhesProps) => {
  const { marcarComoExecutado } = useConformidadeItens();
  const { uploadDocumento, uploading } = useDocumentoUpload();
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState("");
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  
  // Refs para os inputs de arquivo
  const artInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const laudoInputRef = useRef<HTMLInputElement>(null);

  const { data: plano, isLoading } = useQuery({
    queryKey: ["plano-detalhes", planoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_manutencao")
        .select(`
          *,
          ativos (
            id,
            nome,
            tipo_id,
            local,
            torre,
            andar,
            ativo_tipos (nome)
          )
        `)
        .eq("id", planoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!planoId && open,
  });

  const { data: conformidadeItem } = useQuery({
    queryKey: ["conformidade-item", planoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conformidade_itens")
        .select("*")
        .eq("plano_id", planoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!planoId && open,
  });

  // Buscar anexos existentes
  const { data: anexos } = useQuery({
    queryKey: ["conformidade-anexos", conformidadeItem?.id],
    queryFn: async () => {
      if (!conformidadeItem?.id) return [];
      
      const { data, error } = await supabase
        .from("conformidade_anexos")
        .select(`
          *,
          uploaded_by:usuarios(nome),
          documento_tipo:documento_tipos(nome)
        `)
        .eq("item_id", conformidadeItem.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!conformidadeItem?.id && open,
  });

  const getPeriodicidadeLabel = (periodicidade: any) => {
    if (!periodicidade) return 'N/A';
    const match = periodicidade.match(/(\d+)\s*days?/);
    if (match) {
      const days = parseInt(match[1]);
      if (days === 30) return 'Mensal';
      if (days === 90) return 'Trimestral';
      if (days === 180) return 'Semestral';
      if (days === 365) return 'Anual';
      return `A cada ${days} dias`;
    }
    return periodicidade;
  };

  const handleFileUpload = async (
    file: File | null,
    documentoTipoNome: string
  ) => {
    if (!file || !conformidadeItem?.id) return;

    try {
      // Buscar o ID do tipo de documento
      const { data: docTipo } = await supabase
        .from("documento_tipos")
        .select("id")
        .eq("nome", documentoTipoNome)
        .single();

      await uploadDocumento(file, conformidadeItem.id, docTipo?.id);
      
      // Invalidar query de anexos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["conformidade-anexos", conformidadeItem.id] });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    }
  };

  const handleMarcarExecutado = () => {
    if (conformidadeItem) {
      marcarComoExecutado.mutate(
        { itemId: conformidadeItem.id, observacoes },
        {
          onSuccess: () => {
            onOpenChange(false);
            setObservacoes("");
            setChecklistState({});
          },
        }
      );
    }
  };

  const getAnexoPorTipo = (tipoNome: string) => {
    return anexos?.find(a => a.documento_tipo?.nome === tipoNome);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!plano) return null;

  const checklist = plano.checklist as any[] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl">{plano.titulo}</DialogTitle>
            <Badge variant="outline">NBR 5674</Badge>
            {plano.is_legal && <Badge variant="secondary">Obrigatório</Badge>}
          </div>
          <DialogDescription>
            {(plano as any).ativos?.nome} - {(plano as any).ativos?.ativo_tipos?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Plano</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Manutenção</p>
                <p className="font-medium capitalize">{plano.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodicidade</p>
                <p className="font-medium">{getPeriodicidadeLabel(plano.periodicidade)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próxima Execução</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(plano.proxima_execucao), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="font-medium capitalize">{plano.responsavel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Antecedência de Notificação</p>
                <p className="font-medium">{plano.antecedencia_dias} dias</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SLA</p>
                <p className="font-medium">{plano.sla_dias} dias</p>
              </div>
              {(plano as any).ativos?.local && (
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{(plano as any).ativos.local}</p>
                </div>
              )}
              {(plano as any).ativos?.torre && (
                <div>
                  <p className="text-sm text-muted-foreground">Torre</p>
                  <p className="font-medium">{(plano as any).ativos.torre}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist de Verificação */}
          {checklist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Checklist de Verificação</CardTitle>
                <CardDescription>
                  Itens que devem ser verificados durante a manutenção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <Checkbox
                      id={`checklist-${index}`}
                      checked={checklistState[index] || false}
                      onCheckedChange={(checked) => 
                        setChecklistState(prev => ({ ...prev, [index]: checked as boolean }))
                      }
                    />
                    <label
                      htmlFor={`checklist-${index}`}
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      {typeof item === 'string' ? item : item.descricao || item.item}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documentos Exigidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos e Comprovações
              </CardTitle>
              <CardDescription>
                Documentos exigidos pela NBR 5674 para este tipo de manutenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {/* ART */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">ART - Anotação de Responsabilidade Técnica</p>
                      <p className="text-sm text-muted-foreground">Documento obrigatório do responsável técnico</p>
                      {getAnexoPorTipo("ART") && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Anexado por {getAnexoPorTipo("ART")?.uploaded_by?.nome} em{" "}
                          {format(new Date(getAnexoPorTipo("ART")!.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={artInputRef}
                      onChange={(e) => handleFileUpload(e.target.files?.[0] || null, "ART")}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant={getAnexoPorTipo("ART") ? "default" : "outline"}
                      size="sm"
                      onClick={() => artInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {getAnexoPorTipo("ART") ? "Substituir" : "Anexar"}
                    </Button>
                  </div>
                </div>

                {/* Relatório Fotográfico */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Relatório Fotográfico</p>
                      <p className="text-sm text-muted-foreground">Fotos antes e depois da manutenção</p>
                      {getAnexoPorTipo("Relatório Fotográfico") && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Anexado por {getAnexoPorTipo("Relatório Fotográfico")?.uploaded_by?.nome} em{" "}
                          {format(new Date(getAnexoPorTipo("Relatório Fotográfico")!.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fotoInputRef}
                      onChange={(e) => handleFileUpload(e.target.files?.[0] || null, "Relatório Fotográfico")}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant={getAnexoPorTipo("Relatório Fotográfico") ? "default" : "outline"}
                      size="sm"
                      onClick={() => fotoInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {getAnexoPorTipo("Relatório Fotográfico") ? "Substituir" : "Anexar"}
                    </Button>
                  </div>
                </div>

                {/* Laudo Técnico */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Laudo Técnico</p>
                      <p className="text-sm text-muted-foreground">Laudo de conformidade</p>
                      {getAnexoPorTipo("Laudo Técnico") && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Anexado por {getAnexoPorTipo("Laudo Técnico")?.uploaded_by?.nome} em{" "}
                          {format(new Date(getAnexoPorTipo("Laudo Técnico")!.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={laudoInputRef}
                      onChange={(e) => handleFileUpload(e.target.files?.[0] || null, "Laudo Técnico")}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant={getAnexoPorTipo("Laudo Técnico") ? "default" : "outline"}
                      size="sm"
                      onClick={() => laudoInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {getAnexoPorTipo("Laudo Técnico") ? "Substituir" : "Anexar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações da Execução</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Adicione observações sobre a execução desta manutenção..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMarcarExecutado}
              disabled={marcarComoExecutado.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {marcarComoExecutado.isPending ? "Salvando..." : "Marcar como Executado"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanoManutencaoDetalhes;
