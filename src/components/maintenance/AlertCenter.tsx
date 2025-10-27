import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { useUpcomingMaintenances } from "@/hooks/useUpcomingMaintenances";
import { useNonConformities } from "@/hooks/useNonConformities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function AlertCenter() {
  const { data: upcoming } = useUpcomingMaintenances(15);
  const { data: nonConformities } = useNonConformities();
  const navigate = useNavigate();

  const atrasadas = upcoming?.filter(m => m.status === 'atrasado') || [];
  const proximas = upcoming?.filter(m => m.status === 'proximo') || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Upcoming Maintenances Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Manutenções Próximas
          </CardTitle>
          <CardDescription>
            Vencimento nos próximos 15 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma manutenção próxima do vencimento
            </p>
          ) : (
            proximas.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between border-l-2 border-amber-500 pl-3 py-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.ativo_nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.titulo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {m.days_until}d
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.proxima_execucao), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))
          )}
          {proximas.length > 5 && (
            <Button variant="link" size="sm" className="w-full" onClick={() => navigate('/manutencao-predial?tab=agenda')}>
              Ver todas ({proximas.length})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Non-Conformities Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Não Conformidades
          </CardTitle>
          <CardDescription>
            Ativos fora de conformidade NBR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {nonConformities && nonConformities.length === 0 ? (
            <p className="text-sm text-success">
              ✓ Todos os ativos estão em conformidade
            </p>
          ) : (
            nonConformities?.slice(0, 5).map((nc) => (
              <div key={nc.ativo_id} className="flex items-center justify-between border-l-2 border-danger pl-3 py-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{nc.ativo_nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{nc.nbr_codigo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={nc.gravidade === 'critica' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {nc.dias_atrasado}d
                  </Badge>
                </div>
              </div>
            ))
          )}
          {nonConformities && nonConformities.length > 5 && (
            <Button variant="link" size="sm" className="w-full" onClick={() => navigate('/manutencao-predial?tab=relatorios')}>
              Ver todas ({nonConformities.length})
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
