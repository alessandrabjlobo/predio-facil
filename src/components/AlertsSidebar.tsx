import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Shield } from "lucide-react";
import { EventoCalendario } from "@/hooks/useCalendarioManutencoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlertsSidebarProps {
  alertasCriticos: EventoCalendario[];
  proximasManutencoes: EventoCalendario[];
}

const AlertsSidebar = ({ alertasCriticos, proximasManutencoes }: AlertsSidebarProps) => {
  return (
    <div className="space-y-4">
      {/* Alertas Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alertas Prioritários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertasCriticos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta crítico</p>
          ) : (
            <div className="space-y-3">
              {alertasCriticos.map((alerta) => (
                <div key={alerta.id} className="flex items-start gap-2 p-2 border border-destructive/20 rounded bg-destructive/5">
                  <Shield className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alerta.titulo}</p>
                    <p className="text-xs text-muted-foreground">{alerta.ativo_nome}</p>
                    <Badge variant="destructive" className="text-xs mt-1">
                      Vencido há {formatDistanceToNow(new Date(alerta.data_evento), { locale: ptBR })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Manutenções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Próximas Manutenções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximasManutencoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção próxima</p>
          ) : (
            <div className="space-y-3">
              {proximasManutencoes.map((manutencao) => (
                <div key={manutencao.id} className="flex items-start gap-2 p-2 border rounded hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{manutencao.titulo}</p>
                    <p className="text-xs text-muted-foreground">{manutencao.ativo_nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={manutencao.status_visual === "iminente" ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {new Date(manutencao.data_evento).toLocaleDateString("pt-BR")}
                      </Badge>
                      {manutencao.requer_conformidade && (
                        <Badge variant="outline" className="text-xs">
                          NBR 5674
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsSidebar;
