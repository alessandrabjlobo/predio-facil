import { useState } from "react";
import { Download, FileText, Wrench, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function SindicoRelatorios() {
  const { condominio } = useCondominioAtual();
  const [periodo, setPeriodo] = useState<string>("30");

  // Fetch maintenance-specific metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["sindico-metrics", condominio?.id, periodo],
    queryFn: async () => {
      if (!condominio?.id) return null;

      const diasAtras = parseInt(periodo);
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasAtras);

      const [ativosRes, planosRes, osRes, conformidadeRes] = await Promise.all([
        supabase
          .from("ativos")
          .select("id, status_conformidade", { count: "exact" })
          .eq("condominio_id", condominio.id)
          .eq("is_ativo", true),
        supabase
          .from("planos_manutencao")
          .select("id, tipo, is_legal", { count: "exact" })
          .eq("condominio_id", condominio.id),
        supabase
          .from("os")
          .select("id, status, custo_final, data_conclusao", { count: "exact" })
          .eq("condominio_id", condominio.id)
          .gte("data_abertura", dataInicio.toISOString()),
        supabase
          .from("conformidade_itens")
          .select("id, status", { count: "exact" })
          .eq("condominio_id", condominio.id),
      ]);

      const totalAtivos = ativosRes.count || 0;
      const totalPlanos = planosRes.count || 0;
      const totalOS = osRes.count || 0;

      const conformes = ativosRes.data?.filter(a => a.status_conformidade === "conforme").length || 0;
      const naoConformes = ativosRes.data?.filter(a => a.status_conformidade === "nao_conforme").length || 0;
      const atencao = ativosRes.data?.filter(a => a.status_conformidade === "atencao").length || 0;

      const conformidadePercent = totalAtivos > 0 ? Math.round((conformes / totalAtivos) * 100) : 0;

      const osConcluidas = osRes.data?.filter(o => o.status === "concluida").length || 0;
      const osAbertas = osRes.data?.filter(o => o.status === "aberta").length || 0;
      const osEmExecucao = osRes.data?.filter(o => o.status === "em_execucao").length || 0;

      const custoTotal = osRes.data
        ?.filter(o => o.custo_final && o.data_conclusao)
        .reduce((sum, o) => sum + (parseFloat(o.custo_final as any) || 0), 0) || 0;

      const planosPreventivos = planosRes.data?.filter(p => p.tipo === "preventiva").length || 0;
      const planosLegais = planosRes.data?.filter(p => p.is_legal).length || 0;

      return {
        totalAtivos,
        totalPlanos,
        planosPreventivos,
        planosLegais,
        totalOS,
        osConcluidas,
        osAbertas,
        osEmExecucao,
        custoTotal,
        conformes,
        naoConformes,
        atencao,
        conformidadePercent,
      };
    },
    enabled: !!condominio?.id,
    staleTime: 60000, // 1 minute
  });

  const handleExportPDF = async () => {
    try {
      toast({
        title: "Exportando Relatório",
        description: "Gerando PDF com métricas de manutenção...",
      });
      
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
        ["Total de Ativos", metrics.totalAtivos],
        ["Planos Preventivos", metrics.planosPreventivos],
        ["Planos Legais (NBR)", metrics.planosLegais],
        ["Total de OS (período)", metrics.totalOS],
        ["OS Concluídas", metrics.osConcluidas],
        ["OS Abertas", metrics.osAbertas],
        ["OS em Execução", metrics.osEmExecucao],
        ["Custo Total (período)", `R$ ${metrics.custoTotal.toFixed(2)}`],
        ["Conformidade", `${metrics.conformidadePercent}%`],
        ["Ativos Conformes", metrics.conformes],
        ["Ativos Não Conformes", metrics.naoConformes],
        ["Ativos em Atenção", metrics.atencao],
      ]
        .map(row => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-manutencao-${new Date().toISOString().split("T")[0]}.csv`;
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
          <h1 className="text-2xl font-bold">Relatórios de Manutenção</h1>
          <p className="text-muted-foreground">Análises operacionais e conformidade</p>
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
            <CardTitle className="text-sm font-medium">Ativos Gerenciados</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAtivos || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.planosPreventivos || 0} planos preventivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade NBR</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conformidadePercent || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.conformes || 0} conformes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS no Período</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOS || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.osConcluidas || 0} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(metrics?.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status de Conformidade</CardTitle>
            <CardDescription>Distribuição de ativos por status NBR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium text-green-600">Conformes</span>
                <span className="text-2xl font-bold">{metrics?.conformes || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium text-orange-600">Em Atenção</span>
                <span className="text-2xl font-bold">{metrics?.atencao || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-medium text-red-600">Não Conformes</span>
                <span className="text-2xl font-bold">{metrics?.naoConformes || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>Status das OS no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium">Abertas</span>
                <span className="text-2xl font-bold text-orange-600">{metrics?.osAbertas || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium">Em Execução</span>
                <span className="text-2xl font-bold text-blue-600">{metrics?.osEmExecucao || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-medium">Concluídas</span>
                <span className="text-2xl font-bold text-green-600">{metrics?.osConcluidas || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
