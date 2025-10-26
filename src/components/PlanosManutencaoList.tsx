import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanosManutencao } from "@/hooks/usePlanosManutencao";
import { useConformidadeItens } from "@/hooks/useConformidadeItens";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import PlanoManutencaoDetalhes from "./PlanoManutencaoDetalhes";

const PlanosManutencaoList = () => {
  const { planos, isLoading: planosLoading } = usePlanosManutencao();
  const { itens, isLoading: itensLoading } = useConformidadeItens();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getStatusColor = (proximo: string, status: string) => {
    if (status === 'verde') return 'bg-green-500';
    if (isPast(new Date(proximo))) return 'bg-red-500';
    if (differenceInDays(new Date(proximo), new Date()) <= 15) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = (proximo: string, status: string) => {
    if (status === 'verde') return <CheckCircle2 className="h-4 w-4" />;
    if (isPast(new Date(proximo))) return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusLabel = (proximo: string, status: string) => {
    if (status === 'verde') return 'Em Dia';
    if (isPast(new Date(proximo))) return 'Atrasado';
    if (differenceInDays(new Date(proximo), new Date()) <= 15) return 'Próximo do Vencimento';
    return 'Pendente';
  };

  const getPeriodicidadeLabel = (periodicidade: any) => {
    if (!periodicidade) return 'N/A';
    const match = periodicidade.match(/(\d+)\s*days?/);
    if (match) {
      const days = parseInt(match[1]);
      if (days === 30) return 'Mensal';
      if (days === 90) return 'Trimestral';
      if (days === 180) return 'Semestral';
      if (days === 365) return 'Anual';
      return `${days} dias`;
    }
    return periodicidade;
  };

  const filteredItens = itens?.filter(item => {
    const ativoNome = (item as any).ativos?.nome?.toLowerCase() || '';
    const planoTitulo = (item as any).planos_manutencao?.titulo?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return ativoNome.includes(search) || planoTitulo.includes(search);
  });

  const itensPendentes = filteredItens?.filter(item => item.status !== 'verde');
  const itensAtrasados = filteredItens?.filter(item => isPast(new Date(item.proximo)));
  const itensEmDia = filteredItens?.filter(item => item.status === 'verde');

  if (planosLoading || itensLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando planos de manutenção...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos de Manutenção</h2>
          <p className="text-muted-foreground">
            Gestão de manutenções preventivas baseadas na NBR 5674
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ativo ou tipo de manutenção..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">
            Todos ({filteredItens?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({itensPendentes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="atrasados">
            Atrasados ({itensAtrasados?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="em-dia">
            Em Dia ({itensEmDia?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {filteredItens?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {(item as any).planos_manutencao?.titulo || 'Manutenção Preventiva'}
                      <Badge variant="outline" className="text-xs">NBR 5674</Badge>
                    </CardTitle>
                    <CardDescription>
                      {(item as any).ativos?.nome} - {(item as any).ativos?.ativo_tipos?.nome}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(item.proximo, item.status)}`} />
                    <span className="text-sm font-medium">
                      {getStatusLabel(item.proximo, item.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Periodicidade: <strong>{getPeriodicidadeLabel(item.periodicidade)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.proximo, item.status)}
                      <span>
                        Próxima: <strong>{format(new Date(item.proximo), "dd/MM/yyyy", { locale: ptBR })}</strong>
                      </span>
                    </div>
                    {item.ultimo && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Última: <strong>{format(new Date(item.ultimo), "dd/MM/yyyy", { locale: ptBR })}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanoId(item.plano_id || '');
                      setDetailsOpen(true);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!filteredItens || filteredItens.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum plano de manutenção encontrado.
                  <br />
                  Os planos serão criados automaticamente quando você cadastrar ativos que requerem conformidade.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="space-y-4">
          {itensPendentes?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {(item as any).planos_manutencao?.titulo || 'Manutenção Preventiva'}
                      <Badge variant="outline" className="text-xs">NBR 5674</Badge>
                    </CardTitle>
                    <CardDescription>
                      {(item as any).ativos?.nome} - {(item as any).ativos?.ativo_tipos?.nome}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(item.proximo, item.status)}`} />
                    <span className="text-sm font-medium">
                      {getStatusLabel(item.proximo, item.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Periodicidade: <strong>{getPeriodicidadeLabel(item.periodicidade)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.proximo, item.status)}
                      <span>
                        Próxima: <strong>{format(new Date(item.proximo), "dd/MM/yyyy", { locale: ptBR })}</strong>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanoId(item.plano_id || '');
                      setDetailsOpen(true);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="atrasados" className="space-y-4">
          {itensAtrasados?.map((item) => (
            <Card key={item.id} className="border-red-500 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {(item as any).planos_manutencao?.titulo || 'Manutenção Preventiva'}
                      <Badge variant="destructive" className="text-xs">ATRASADO</Badge>
                    </CardTitle>
                    <CardDescription>
                      {(item as any).ativos?.nome} - {(item as any).ativos?.ativo_tipos?.nome}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-500">
                        Venceu em: <strong>{format(new Date(item.proximo), "dd/MM/yyyy", { locale: ptBR })}</strong>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanoId(item.plano_id || '');
                      setDetailsOpen(true);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="em-dia" className="space-y-4">
          {itensEmDia?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {(item as any).planos_manutencao?.titulo || 'Manutenção Preventiva'}
                      <Badge variant="outline" className="text-xs bg-green-50">Em Dia</Badge>
                    </CardTitle>
                    <CardDescription>
                      {(item as any).ativos?.nome} - {(item as any).ativos?.ativo_tipos?.nome}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>
                        Próxima: <strong>{format(new Date(item.proximo), "dd/MM/yyyy", { locale: ptBR })}</strong>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanoId(item.plano_id || '');
                      setDetailsOpen(true);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {selectedPlanoId && (
        <PlanoManutencaoDetalhes
          planoId={selectedPlanoId}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
};

export default PlanosManutencaoList;
