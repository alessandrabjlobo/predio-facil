import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ManutencaoCardProps {
  manutencao: any;
  onConcluir?: (id: string) => void;
  onRemarcar?: (id: string) => void;
  onGerarOS?: (id: string) => void;
}

export function ManutencaoCard({ manutencao, onConcluir, onRemarcar, onGerarOS }: ManutencaoCardProps) {
  const vencimentoDate = manutencao.vencimento ? new Date(manutencao.vencimento) : null;
  const isAtrasada = vencimentoDate && vencimentoDate < new Date();

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">{manutencao.titulo}</h3>
            <p className="text-sm text-muted-foreground">
              {manutencao.ativos?.nome || "—"}
            </p>
          </div>
          <Badge variant={isAtrasada ? "destructive" : "default"}>
            {manutencao.status}
          </Badge>
        </div>

        {vencimentoDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Vencimento: {format(vencimentoDate, "dd/MM/yyyy", { locale: ptBR })}
          </div>
        )}

        {manutencao.descricao && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 mt-0.5" />
            <p className="flex-1">{manutencao.descricao}</p>
          </div>
        )}

        {manutencao.status === "pendente" && (
          <div className="flex gap-2 pt-2 border-t">
            {onConcluir && (
              <Button size="sm" onClick={() => onConcluir(manutencao.id)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Concluir
              </Button>
            )}
            {onRemarcar && (
              <Button size="sm" variant="outline" onClick={() => onRemarcar(manutencao.id)}>
                <Calendar className="h-4 w-4 mr-1" />
                Remarcar
              </Button>
            )}
            {onGerarOS && (
              <Button size="sm" variant="secondary" onClick={() => onGerarOS(manutencao.id)}>
                Gerar OS
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
