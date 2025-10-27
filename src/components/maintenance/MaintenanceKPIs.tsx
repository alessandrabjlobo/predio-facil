import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ClipboardList, Wrench, TrendingUp } from "lucide-react";
import { useMaintenanceStats } from "@/hooks/useMaintenanceStats";
import { Skeleton } from "@/components/ui/skeleton";

export function MaintenanceKPIs() {
  const { data: stats, isLoading } = useMaintenanceStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Total de Ativos",
      value: stats?.total_ativos || 0,
      icon: Building2,
      color: "text-primary",
    },
    {
      title: "Planos Preventivos",
      value: stats?.planos_preventivos || 0,
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      title: "OS Abertas",
      value: stats?.os_abertas || 0,
      icon: Wrench,
      color: "text-amber-600",
    },
    {
      title: "Conformidade",
      value: `${Math.round(stats?.conformidade_percent || 0)}%`,
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
