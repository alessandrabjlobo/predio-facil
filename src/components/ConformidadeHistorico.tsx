import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, User, FileText, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const ConformidadeHistorico = () => {
  const { condominio } = useCondominioAtual();

  const { data: historico, isLoading } = useQuery({
    queryKey: ["conformidade-historico", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];

      const { data, error } = await supabase
        .from("conformidade_historico_auditoria")
        .select("*")
        .eq("condominio_id", condominio.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Auditoria
        </CardTitle>
        <CardDescription>
          Registro completo de execuções e documentos anexados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico?.map((item: any) => (
            <div key={item.item_id} className="border rounded-lg p-4 space-y-3">
              {/* Cabeçalho */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{item.ativo_nome}</h4>
                  <p className="text-sm text-muted-foreground">{item.manutencao}</p>
                </div>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(item.data_execucao), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              </div>

              <Separator />

              {/* Executado por */}
              {item.executado_por_nome && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Executado por:</span>
                  <span className="font-medium">{item.executado_por_nome}</span>
                  <span className="text-muted-foreground">
                    em {format(new Date(item.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}

              {/* Observações */}
              {item.observacoes && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">
                    <strong>Observações:</strong> {item.observacoes}
                  </p>
                </div>
              )}

              {/* Documentos Anexados */}
              {item.anexos && item.anexos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Documentos Anexados:
                  </div>
                  <div className="pl-6 space-y-1">
                    {item.anexos.map((anexo: any) => (
                      <div key={anexo.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-medium">{anexo.documento_tipo || "Documento"}</span>
                        <span>anexado por {anexo.uploaded_by}</span>
                        <span>em {format(new Date(anexo.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {(!historico || historico.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro de auditoria encontrado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
