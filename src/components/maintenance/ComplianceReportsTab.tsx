import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceStats } from "@/hooks/useMaintenanceStats";
import { useNonConformities } from "@/hooks/useNonConformities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ComplianceReportsTab() {
  const { data: stats } = useMaintenanceStats();
  const { data: nonConformities } = useNonConformities();

  const conformidadePercent = Math.round(stats?.conformidade_percent || 0);
  const naoConformidades = nonConformities?.length || 0;
  const conformesCount = (stats?.total_ativos || 0) - naoConformidades;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{conformidadePercent}%</div>
            <Progress value={conformidadePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Conformes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conformesCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              De {stats?.total_ativos || 0} ativos totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Conformidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{naoConformidades}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Requerem ação imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Non-Conformities Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhamento de Não Conformidades</CardTitle>
              <CardDescription>Ativos que requerem atenção urgente</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!nonConformities || nonConformities.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
              <p className="text-lg font-medium text-success">Parabéns!</p>
              <p className="text-sm text-muted-foreground">
                Todos os ativos estão em conformidade com as normas NBR aplicáveis.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nonConformities.map((nc) => (
                <div
                  key={nc.ativo_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{nc.ativo_nome}</h4>
                      <Badge variant="outline" className="font-mono text-xs">
                        {nc.nbr_codigo}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{nc.tipo_nome}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-danger">
                        {nc.dias_atrasado} dias atrasado
                      </p>
                      <Badge
                        variant={
                          nc.gravidade === 'critica'
                            ? 'destructive'
                            : nc.gravidade === 'alta'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs mt-1"
                      >
                        {nc.gravidade === 'critica' ? 'Crítica' : nc.gravidade === 'alta' ? 'Alta' : 'Média'}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      Gerar OS
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NBR Standards Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Conformidade por Norma NBR</CardTitle>
          <CardDescription>Status de atendimento às normas técnicas brasileiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { nbr: 'NBR 12693', desc: 'Extintores de Incêndio', total: 3, conformes: 3 },
              { nbr: 'NBR 13714', desc: 'Sistemas de Hidrantes', total: 1, conformes: 1 },
              { nbr: 'NBR 16083', desc: 'Elevadores', total: 2, conformes: 1 },
              { nbr: 'NBR 5626', desc: 'Instalações Hidráulicas', total: 2, conformes: 2 },
              { nbr: 'NBR 5419', desc: 'Proteção contra Descargas (SPDA)', total: 1, conformes: 1 },
            ].map((item) => (
              <div key={item.nbr} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium font-mono text-sm">{item.nbr}</span>
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                  </div>
                  <Progress value={(item.conformes / item.total) * 100} className="h-2" />
                </div>
                <div className="ml-4 text-sm font-medium">
                  {item.conformes}/{item.total}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
