import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useChamados } from "@/hooks/useChamados";
import { Skeleton } from "@/components/ui/skeleton";

const MaintenanceList = () => {
  const { chamados, isLoading } = useChamados();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-destructive text-destructive-foreground";
      case "média": return "bg-warning text-warning-foreground";
      case "baixa": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluído": return <CheckCircle className="h-4 w-4 text-success" />;
      case "em andamento": return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chamados de Manutenção</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as solicitações</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chamados de Manutenção</h1>
        <p className="text-muted-foreground mt-1">Gerencie todas as solicitações</p>
      </div>

      {!chamados || chamados.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum chamado cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chamados.map((maintenance) => (
            <Card key={maintenance.id} className="shadow-card hover:shadow-card-hover transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{maintenance.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">{maintenance.local || "Não especificado"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(maintenance.status)}
                    <Badge className={getPriorityColor(maintenance.prioridade)}>
                      {maintenance.prioridade}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Status: {maintenance.status}</span>
                  <span>{new Date(maintenance.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
