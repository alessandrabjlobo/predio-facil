import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface DashboardKPIsProps {
  totalMes: number;
  atrasadas: number;
  proximos7Dias: number;
  taxaConformidade: number;
}

const DashboardKPIs = ({ totalMes, atrasadas, proximos7Dias, taxaConformidade }: DashboardKPIsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Manutenções do Mês</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMes}</div>
          <p className="text-xs text-muted-foreground">Agendadas para este mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{atrasadas}</div>
          <p className="text-xs text-muted-foreground">Requerem atenção urgente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{proximos7Dias}</div>
          <p className="text-xs text-muted-foreground">Manutenções iminentes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{taxaConformidade}%</div>
          <p className="text-xs text-muted-foreground">Manutenções em dia</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardKPIs;
