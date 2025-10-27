import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileCheck, Calendar, Clock, User } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlansTableViewProps {
  planos: any[];
  onGenerateOS: (plano: any) => void;
  isLoading?: boolean;
}

export function PlansTableView({ planos, onGenerateOS, isLoading }: PlansTableViewProps) {
  const getPeriodicidadeLabel = (periodicidade: any) => {
    if (!periodicidade) return 'N/A';
    const match = periodicidade.toString().match(/(\d+)/);
    if (match) {
      const days = parseInt(match[1]);
      if (days === 30) return 'Mensal';
      if (days === 90) return 'Trimestral';
      if (days === 180) return 'Semestral';
      if (days === 365) return 'Anual';
      return `${days} dias`;
    }
    return periodicidade;
  };

  const getStatusBadge = (proximaExecucao: string) => {
    const days = differenceInDays(new Date(proximaExecucao), new Date());
    if (days < 0) return <Badge variant="destructive">Atrasado</Badge>;
    if (days <= 15) return <Badge className="bg-warning/10 text-warning border-warning">Próximo</Badge>;
    return <Badge className="bg-success/10 text-success border-success">Em Dia</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">Carregando planos...</div>
      </Card>
    );
  }

  if (!planos || planos.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          Nenhum plano preventivo cadastrado.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Ativo</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold">Periodicidade</TableHead>
              <TableHead className="font-semibold">Próxima Execução</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planos.map((plano) => (
              <TableRow key={plano.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  {plano.ativo?.nome || 'N/A'}
                </TableCell>
                
                <TableCell className="max-w-md">
                  <div className="flex items-start gap-2">
                    {plano.is_legal && (
                      <FileCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    <span className="line-clamp-2">{plano.titulo}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {getPeriodicidadeLabel(plano.periodicidade)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(plano.proxima_execucao), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{plano.responsavel || 'Síndico'}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(plano.proxima_execucao)}
                </TableCell>
                
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onGenerateOS(plano)}
                  >
                    Gerar OS
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
