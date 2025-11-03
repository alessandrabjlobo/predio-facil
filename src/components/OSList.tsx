import { useState } from "react";
import { useOrdemServico } from "@/hooks/useOrdemServico";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Search, Plus, Calendar, User, AlertCircle } from "lucide-react";
import { OSDialog } from "./OSDialog";
import { Skeleton } from "@/components/ui/skeleton";

export const OSList = () => {
  const { ordens, isLoading } = useOrdemServico();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  const [showNewOSDialog, setShowNewOSDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
      case "fechada":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "aberta":
      case "em_execucao":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "aguardando_validacao":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "cancelada":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default:
        return "bg-red-500/10 text-red-700 dark:text-red-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberta: "Aberta",
      em_execucao: "Em Execução",
      aguardando_validacao: "Aguardando Validação",
      concluida: "Concluída",
      fechada: "Fechada",
      cancelada: "Cancelada",
    };
    return labels[status] || status;
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "urgente":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "alta":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "media":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const filteredOrdens = ordens?.filter((os) => {
    const ativo = os.ativo as any;
    const ativoNome = Array.isArray(ativo) ? ativo[0]?.nome : ativo?.nome;
    const matchesSearch = 
      os.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativoNome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || os.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const isOverdue = (os: any) => {
    if (os.status === "concluida" || os.status === "fechada" || os.status === "cancelada") return false;
    if (!os.sla_vencimento) return false;
    return new Date(os.sla_vencimento) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h2>
          <p className="text-muted-foreground">Gestão completa de OS com template NBR 5674</p>
        </div>
        <Button onClick={() => setShowNewOSDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, título ou ativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="aberta">Aberta</SelectItem>
            <SelectItem value="em_execucao">Em Execução</SelectItem>
            <SelectItem value="aguardando_validacao">Aguardando Validação</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="fechada">Fechada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrdens?.map((os) => (
          <Card
            key={os.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedOS(os.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    {os.numero}
                  </CardTitle>
                  <p className="text-sm font-medium">{os.titulo}</p>
                </div>
                {isOverdue(os) && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(os.status)}>
                  {getStatusLabel(os.status)}
                </Badge>
                <Badge className={getPrioridadeColor(os.prioridade)}>
                  {os.prioridade}
                </Badge>
                {os.origem === "preventiva" && (
                  <Badge variant="outline" className="bg-blue-500/10">
                    Preventiva
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {os.ativo && (() => {
                  const ativo = os.ativo as any;
                  const nome = Array.isArray(ativo) ? ativo[0]?.nome : ativo?.nome;
                  return nome ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ClipboardList className="h-4 w-4" />
                      <span className="truncate">{nome}</span>
                    </div>
                  ) : null;
                })()}
                {os.executor_nome && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="truncate">{os.executor_nome}</span>
                  </div>
                )}
                {os.data_prevista && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Prevista: {new Date(os.data_prevista).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrdens?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Nenhuma OS encontrada com os filtros aplicados"
                : "Nenhuma Ordem de Serviço cadastrada"}
            </p>
          </CardContent>
        </Card>
      )}

      {selectedOS && (
        <OSDialog
          osId={selectedOS}
          open={!!selectedOS}
          onOpenChange={(open) => !open && setSelectedOS(null)}
        />
      )}
    </div>
  );
};
