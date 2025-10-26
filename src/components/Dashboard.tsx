import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCalendarioManutencoes } from "@/hooks/useCalendarioManutencoes";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardKPIs from "./DashboardKPIs";
import MaintenanceCalendar from "./MaintenanceCalendar";
import AlertsSidebar from "./AlertsSidebar";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { eventos, isLoading, kpis, proximasManutencoes, alertasCriticos } = useCalendarioManutencoes();

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do condomínio</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral e calendário de manutenções</p>
      </div>

      {/* KPIs de Manutenção */}
      <DashboardKPIs 
        totalMes={kpis.totalMes}
        atrasadas={kpis.atrasadas}
        proximos7Dias={kpis.proximos7Dias}
        taxaConformidade={kpis.taxaConformidade}
      />

      {/* Calendário e Alertas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MaintenanceCalendar eventos={eventos} />
        </div>
        <div>
          <AlertsSidebar 
            alertasCriticos={alertasCriticos}
            proximasManutencoes={proximasManutencoes}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
