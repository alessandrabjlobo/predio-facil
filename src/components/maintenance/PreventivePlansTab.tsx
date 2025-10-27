import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, FileCheck, Plus, Search } from "lucide-react";
import { usePlanosManutencao } from "@/hooks/usePlanosManutencao";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GerarOSDialog } from "@/components/manutencoes/GerarOSDialog";
import { PlansTableView } from "@/components/maintenance/PlansTableView";
import { ViewToggle } from "@/components/patterns/ViewToggle";

export function PreventivePlansTab() {
  const { planos, isLoading } = usePlanosManutencao();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  const [osDialogOpen, setOsDialogOpen] = useState(false);
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    const saved = localStorage.getItem('maintenance_plans_view');
    return (saved as 'list' | 'card') || 'card';
  });

  useEffect(() => {
    localStorage.setItem('maintenance_plans_view', viewMode);
  }, [viewMode]);

  const getPeriodicidadeLabel = (periodicidade: any) => {
    if (!periodicidade) return 'N/A';
    const match = periodicidade.toString().match(/(\d+)/);
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

  const getStatusColor = (proximaExecucao: string) => {
    const days = differenceInDays(new Date(proximaExecucao), new Date());
    if (days < 0) return 'border-danger bg-danger/5';
    if (days <= 15) return 'border-warning bg-warning/5';
    return 'border-success bg-success/5';
  };

  const getStatusBadge = (proximaExecucao: string) => {
    const days = differenceInDays(new Date(proximaExecucao), new Date());
    if (days < 0) return <Badge variant="destructive">Atrasado</Badge>;
    if (days <= 15) return <Badge variant="secondary" className="bg-warning/10 text-warning">Próximo</Badge>;
    return <Badge variant="outline" className="bg-success/10 text-success border-success">Em Dia</Badge>;
  };

  const filteredPlanos = planos?.filter(plano => {
    const search = searchTerm.toLowerCase();
    return (
      plano.titulo?.toLowerCase().includes(search) ||
      plano.ativo?.nome?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando planos...</div>;
  }

  const handleGenerateOS = (plano: any) => {
    setSelectedPlano(plano);
    setOsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planos por título ou ativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {!filteredPlanos || filteredPlanos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum plano preventivo cadastrado.
              <br />
              Os planos são criados automaticamente ao cadastrar ativos que requerem conformidade.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlanos.map((plano) => (
            <Card key={plano.id} className={`hover:shadow-md transition-shadow ${getStatusColor(plano.proxima_execucao)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-base line-clamp-2">{plano.titulo}</CardTitle>
                  {getStatusBadge(plano.proxima_execucao)}
                </div>
                <CardDescription className="line-clamp-1">
                  {plano.ativo?.nome}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Periodicidade:</span>
                  <span className="font-medium">{getPeriodicidadeLabel(plano.periodicidade)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Próxima:</span>
                  <span className="font-medium">
                    {format(new Date(plano.proxima_execucao), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="font-medium capitalize">{plano.responsavel || 'Síndico'}</span>
                </div>

                {plano.is_legal && (
                  <Badge variant="outline" className="text-xs">
                    <FileCheck className="h-3 w-3 mr-1" />
                    NBR Legal
                  </Badge>
                )}

                <div className="pt-2">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleGenerateOS(plano)}
                  >
                    Gerar OS
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <PlansTableView
          planos={filteredPlanos}
          onGenerateOS={handleGenerateOS}
          isLoading={isLoading}
        />
      )}

      {selectedPlano && (
        <GerarOSDialog
          open={osDialogOpen}
          onOpenChange={setOsDialogOpen}
          manutencao={selectedPlano}
        />
      )}
    </div>
  );
}
