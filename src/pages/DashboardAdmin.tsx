import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wrench, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardAdmin() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [condominios, usuarios, os, userRoles] = await Promise.all([
        supabase.from("condominios").select("id", { count: "exact", head: true }),
        supabase.from("usuarios").select("id", { count: "exact", head: true }),
        supabase.from("os").select("id, status, condominio_id", { count: "exact" }),
        supabase.from("user_roles").select("role", { count: "exact" }),
      ]);

      // Contar condominios ativos (com atividade recente)
      const { count: activeCondo } = await supabase
        .from("os")
        .select("condominio_id", { count: "exact", head: true })
        .gte("data_abertura", new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString());

      return {
        totalCondominios: condominios.count || 0,
        condominiosAtivos: activeCondo || 0,
        totalUsuarios: usuarios.count || 0,
        totalOS: os.count || 0,
        osAbertas: os.data?.filter(o => o.status !== "concluida" && o.status !== "cancelada").length || 0,
      };
    },
  });

  const kpis = [
    {
      title: "Condomínios Ativos",
      value: stats?.condominiosAtivos ?? 0,
      subtitle: `${stats?.totalCondominios ?? 0} total`,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Usuários",
      value: stats?.totalUsuarios ?? 0,
      subtitle: "Total cadastrados",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "OS Abertas",
      value: stats?.osAbertas ?? 0,
      subtitle: `${stats?.totalOS ?? 0} total`,
      icon: Wrench,
      color: "text-orange-600",
    },
    {
      title: "Total OS",
      value: stats?.totalOS ?? 0,
      subtitle: "Ordens de Serviço",
      icon: ClipboardList,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin Master</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
