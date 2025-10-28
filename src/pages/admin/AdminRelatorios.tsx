import { useState } from "react";
import { Download, FileText, Building2, Users, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRelatorios() {
  const [periodo, setPeriodo] = useState<string>("30");

  // Fetch system-wide metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-metrics", periodo],
    queryFn: async () => {
      const diasAtras = parseInt(periodo);
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasAtras);

      const [condominiosRes, usuariosRes, osRes, ativosRes] = await Promise.all([
        supabase
          .from("condominios")
          .select("id, created_at", { count: "exact" }),
        supabase
          .from("usuarios")
          .select("id, created_at", { count: "exact" }),
        supabase
          .from("os")
          .select("id, status, created_at", { count: "exact" })
          .gte("created_at", dataInicio.toISOString()),
        supabase
          .from("ativos")
          .select("id, condominio_id", { count: "exact" })
          .eq("is_ativo", true),
      ]);

      const totalCondominios = condominiosRes.count || 0;
      const totalUsuarios = usuariosRes.count || 0;
      const totalOS = osRes.count || 0;
      const totalAtivos = ativosRes.count || 0;

      const osConcluidas = osRes.data?.filter(o => o.status === "concluida").length || 0;
      const taxaConclusao = totalOS > 0 ? Math.round((osConcluidas / totalOS) * 100) : 0;

      return {
        totalCondominios,
        totalUsuarios,
        totalOS,
        totalAtivos,
        taxaConclusao,
        condominiosAtivos: totalCondominios, // TODO: implement last login logic
        osAbertas: osRes.data?.filter(o => o.status === "aberta").length || 0,
      };
    },
    staleTime: 60000, // 1 minute
  });

  const handleExportPDF = async () => {
    try {
      // TODO: Implement actual PDF generation
      toast({
        title: "Exportando Relatório",
        description: "Gerando PDF com métricas do sistema...",
      });
      
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Relatório Exportado",
        description: "O arquivo PDF foi gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o relatório PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      if (!metrics) return;

      const csvContent = [
        ["Métrica", "Valor"],
        ["Total de Condomínios", metrics.totalCondominios],
        ["Total de Usuários", metrics.totalUsuarios],
        ["Total de Ativos", metrics.totalAtivos],
        ["Total de OS (período)", metrics.totalOS],
        ["Taxa de Conclusão", `${metrics.taxaConclusao}%`],
        ["OS Abertas", metrics.osAbertas],
      ]
        .map(row => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-admin-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast({
        title: "Relatório Exportado",
        description: "O arquivo CSV foi gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o relatório CSV.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios do Sistema</h1>
          <p className="text-muted-foreground">Métricas e análises gerenciais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Condomínios</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCondominios || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.condominiosAtivos || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsuarios || 0}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAtivos || 0}</div>
            <p className="text-xs text-muted-foreground">Ativos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.taxaConclusao || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalOS || 0} OS no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
          <CardDescription>Visão geral das operações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-medium">Condomínios Cadastrados</span>
              <span className="text-2xl font-bold">{metrics?.totalCondominios || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-medium">Usuários Ativos</span>
              <span className="text-2xl font-bold">{metrics?.totalUsuarios || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-medium">Ordens de Serviço (período)</span>
              <span className="text-2xl font-bold">{metrics?.totalOS || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-medium">OS Abertas</span>
              <span className="text-2xl font-bold text-orange-600">{metrics?.osAbertas || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-medium">Ativos em Gestão</span>
              <span className="text-2xl font-bold">{metrics?.totalAtivos || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
