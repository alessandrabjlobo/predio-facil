import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, XCircle, FileText, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConformidadeCardProps {
  item: any;
  onMarcarExecutado: (itemId: string) => void;
  onVerPlano: (planoId: string) => void;
  isExecuting?: boolean;
}

export const ConformidadeCard = ({ 
  item, 
  onMarcarExecutado, 
  onVerPlano,
  isExecuting = false 
}: ConformidadeCardProps) => {
  const calcularStatus = () => {
    const hoje = new Date();
    const proximaData = new Date(item.proximo);
    const diasAteVencer = differenceInDays(proximaData, hoje);

    if (item.ultimo && diasAteVencer > 15) return { status: "verde", label: "Em Dia", icon: CheckCircle2, color: "text-green-600" };
    if (diasAteVencer > 0 && diasAteVencer <= 15) return { status: "amarelo", label: "Próxima", icon: AlertCircle, color: "text-yellow-600" };
    return { status: "vermelho", label: "Vencida", icon: XCircle, color: "text-red-600" };
  };

  const statusInfo = calcularStatus();
  const StatusIcon = statusInfo.icon;
  const hoje = new Date();
  const proximaData = new Date(item.proximo);
  const diasAteVencer = differenceInDays(proximaData, hoje);

  const getBadgeVariant = () => {
    if (statusInfo.status === "verde") return "default";
    if (statusInfo.status === "amarelo") return "secondary";
    return "destructive";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Cabeçalho */}
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 mt-0.5 ${statusInfo.color}`} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.ativos?.nome || "Ativo não identificado"}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.planos_manutencao?.titulo || "Manutenção"}
                  {item.ativos?.ativo_tipos?.sistema_manutencao && ` - ${item.ativos.ativo_tipos.sistema_manutencao}`}
                </p>
              </div>
              <Badge variant={getBadgeVariant()}>
                {statusInfo.label}
              </Badge>
            </div>

            {/* Informações de Data */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Último executado</p>
                <p className="font-medium">
                  {item.ultimo 
                    ? format(new Date(item.ultimo), "dd/MM/yyyy", { locale: ptBR })
                    : "Nunca executado"}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Próxima execução</p>
                <p className="font-medium">
                  {format(proximaData, "dd/MM/yyyy", { locale: ptBR })}
                  {diasAteVencer > 0 && diasAteVencer <= 15 && (
                    <span className="text-yellow-600 ml-2">em {diasAteVencer} dias</span>
                  )}
                  {diasAteVencer < 0 && (
                    <span className="text-red-600 ml-2">vencido há {Math.abs(diasAteVencer)} dias</span>
                  )}
                </p>
              </div>
            </div>

            {/* Observações */}
            {item.observacoes && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Obs:</strong> {item.observacoes}
                </p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => item.plano_id && onVerPlano(item.plano_id)}
              disabled={!item.plano_id}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Plano
            </Button>
            <Button
              size="sm"
              onClick={() => onMarcarExecutado(item.id)}
              disabled={isExecuting}
              className="relative"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar Executado
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
