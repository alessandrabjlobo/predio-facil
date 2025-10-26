import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPI {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: number;
}

interface KPICardsProps {
  data: KPI[];
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data.map((kpi, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
            {kpi.icon && <kpi.icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.trend !== undefined && (
              <p className={`text-xs ${kpi.trend >= 0 ? 'text-success' : 'text-danger'}`}>
                {kpi.trend >= 0 ? '+' : ''}{kpi.trend}% em relação ao mês anterior
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
