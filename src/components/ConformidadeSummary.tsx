import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, XCircle, TrendingUp } from "lucide-react";

interface ConformidadeSummaryProps {
  stats: {
    total: number;
    emDia: number;
    proximas: number;
    vencidas: number;
    porcentagemEmDia: number;
    porSistema: Record<string, { total: number; emDia: number }>;
  };
}

export const ConformidadeSummary = ({ stats }: ConformidadeSummaryProps) => {

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Resumo de Conformidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.emDia}</p>
              <p className="text-xs text-muted-foreground">Em Dia</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.proximas}</p>
              <p className="text-xs text-muted-foreground">Próximas</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Conformidade Geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Conformidade Geral</span>
            <span className="text-sm font-bold text-primary">{stats.porcentagemEmDia}%</span>
          </div>
          <Progress value={stats.porcentagemEmDia} className="h-3" />
        </div>

        {/* Por Sistema */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Por Sistema</h4>
          {Object.entries(stats.porSistema).map(([sistema, data]) => {
            const porcentagem = data.total > 0 ? Math.round((data.emDia / data.total) * 100) : 0;
            return (
              <div key={sistema} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{sistema}</span>
                  <span className="font-medium">
                    {data.emDia}/{data.total} ({porcentagem}%)
                  </span>
                </div>
                <Progress value={porcentagem} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
