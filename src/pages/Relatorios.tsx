import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";

type TipoRel = "mensal" | "trimestral" | "anual" | "personalizado";
type StatusRel = "pronto" | "processando" | "erro";

interface Relatorio {
  id: string;
  titulo: string;
  tipo: TipoRel;
  periodo: string;
  dataGeracao: string;
  status: StatusRel;
  tamanho: string;
}

const relatoriosMock: Relatorio[] = [
  {
    id: "1",
    titulo: "Relatório Mensal - Janeiro 2024",
    tipo: "mensal",
    periodo: "Janeiro 2024",
    dataGeracao: "2024-01-31T23:59:00",
    status: "pronto",
    tamanho: "2.3 MB",
  },
  {
    id: "2",
    titulo: "Relatório Trimestral - Q4 2023",
    tipo: "trimestral",
    periodo: "Out-Dez 2023",
    dataGeracao: "2024-01-05T10:30:00",
    status: "pronto",
    tamanho: "5.7 MB",
  },
  {
    id: "3",
    titulo: "Relatório Anual - 2023",
    tipo: "anual",
    periodo: "2023",
    dataGeracao: "2024-01-10T14:20:00",
    status: "processando",
    tamanho: "-",
  },
];

const statusColors = {
  pronto: "bg-green-100 text-green-800",
  processando: "bg-yellow-100 text-yellow-800",
  erro: "bg-red-100 text-red-800",
};

export default function Relatorios() {
  const [filtros, setFiltros] = useState<{ tipo: "" | TipoRel; periodo: string | "" }>({
    tipo: "",
    periodo: "2024",
  });

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtrados = useMemo(() => {
    return relatoriosMock.filter((r) => {
      const okTipo = filtros.tipo ? r.tipo === filtros.tipo : true;
      const okPeriodo = filtros.periodo ? r.periodo.includes(filtros.periodo) : true;
      return okTipo && okPeriodo;
    });
  }, [filtros]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análises e relatórios de manutenção do condomínio</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Janeiro</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 8.450</div>
            <p className="text-xs text-green-600">-12% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados Resolvidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-blue-600">+8% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Resolução</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 dias</div>
            <p className="text-xs text-green-600">-0.5 dias vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7/5</div>
            <p className="text-xs text-green-600">+0.2 vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={filtros.tipo || undefined}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, tipo: value === "all" ? "" : (value as TipoRel) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.periodo || undefined}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, periodo: value === "all" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
          <CardDescription>Histórico de relatórios disponíveis para download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtrados.map((relatorio) => (
              <div
                key={relatorio.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{relatorio.titulo}</h3>
                    <p className="text-sm text-gray-500">
                      {relatorio.periodo} • Gerado em {formatarData(relatorio.dataGeracao)}
                    </p>
                    {relatorio.tamanho !== "-" && (
                      <p className="text-xs text-gray-400">{relatorio.tamanho}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={statusColors[relatorio.status]}>
                    {relatorio.status.charAt(0).toUpperCase() + relatorio.status.slice(1)}
                  </Badge>

                  {relatorio.status === "pronto" && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
