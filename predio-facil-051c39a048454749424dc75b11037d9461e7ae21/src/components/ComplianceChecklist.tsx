import { useState, useMemo } from "react";
import { useConformidadeItens } from "@/hooks/useConformidadeItens";
import { useConformidadeStats } from "@/hooks/useConformidadeStats";
import { ConformidadeSummary } from "./ConformidadeSummary";
import { ConformidadeFilters } from "./ConformidadeFilters";
import { ConformidadeCard } from "./ConformidadeCard";
import { ConformidadeOSDialog } from "./ConformidadeOSDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";

const ComplianceChecklist = () => {
  const navigate = useNavigate();
  const { itens, isLoading, marcarComoExecutado } = useConformidadeItens();
  const stats = useConformidadeStats(itens);
  
  const [sistemaFiltro, setSistemaFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("proximo");
  const [expandedSistemas, setExpandedSistemas] = useState<Record<string, boolean>>({});
  const [executingItemId, setExecutingItemId] = useState<string | null>(null);
  const [showOSDialog, setShowOSDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Extrair sistemas únicos
  const sistemas = useMemo(() => {
    if (!itens) return [];
    const sistemasSet = new Set(
      itens
        .map((item) => item.ativos?.ativo_tipos?.sistema_manutencao)
        .filter(Boolean)
    );
    return Array.from(sistemasSet) as string[];
  }, [itens]);

  // Calcular status dinâmico
  const calcularStatus = (item: any) => {
    const hoje = new Date();
    const proximaData = new Date(item.proximo);
    const diasAteVencer = differenceInDays(proximaData, hoje);

    if (item.ultimo && diasAteVencer > 15) return "verde";
    if (diasAteVencer > 0 && diasAteVencer <= 15) return "amarelo";
    return "vermelho";
  };

  // Filtrar e ordenar itens
  const itensFiltrados = useMemo(() => {
    if (!itens) return [];

    let filtered = [...itens];

    // Filtrar por sistema
    if (sistemaFiltro !== "todos") {
      filtered = filtered.filter(
        (item) => item.ativos?.ativo_tipos?.sistema_manutencao === sistemaFiltro
      );
    }

    // Filtrar por status
    if (statusFiltro !== "todos") {
      filtered = filtered.filter((item) => calcularStatus(item) === statusFiltro);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (ordenacao) {
        case "proximo":
          return new Date(a.proximo).getTime() - new Date(b.proximo).getTime();
        case "ultimo":
          if (!a.ultimo) return 1;
          if (!b.ultimo) return -1;
          return new Date(b.ultimo).getTime() - new Date(a.ultimo).getTime();
        case "nome":
          return (a.ativos?.nome || "").localeCompare(b.ativos?.nome || "");
        case "sistema":
          return (a.ativos?.ativo_tipos?.sistema_manutencao || "").localeCompare(
            b.ativos?.ativo_tipos?.sistema_manutencao || ""
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [itens, sistemaFiltro, statusFiltro, ordenacao]);

  // Agrupar por sistema
  const itensPorSistema = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    itensFiltrados.forEach((item) => {
      const sistema = item.ativos?.ativo_tipos?.sistema_manutencao || "Outros";
      if (!grouped[sistema]) {
        grouped[sistema] = [];
      }
      grouped[sistema].push(item);
    });
    return grouped;
  }, [itensFiltrados]);

  const handleMarcarExecutado = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowOSDialog(true);
  };

  const handleExecutarOS = async (gerarOS: boolean, observacoes?: string) => {
    if (!selectedItemId) return;
    setExecutingItemId(selectedItemId);
    try {
      await marcarComoExecutado.mutateAsync({ 
        itemId: selectedItemId, 
        observacoes,
        gerarOS 
      });
    } finally {
      setExecutingItemId(null);
      setSelectedItemId(null);
    }
  };

  const handleVerPlano = (planoId: string) => {
    // Navegar para detalhes do plano (implementar depois)
    console.log("Ver plano:", planoId);
  };

  const toggleSistema = (sistema: string) => {
    setExpandedSistemas((prev) => ({
      ...prev,
      [sistema]: !prev[sistema],
    }));
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!itens || itens.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum item de conformidade encontrado. Cadastre ativos com conformidade obrigatória para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <ConformidadeSummary stats={stats} />

      {/* Filtros */}
      <ConformidadeFilters
        sistemas={sistemas}
        sistemaFiltro={sistemaFiltro}
        setSistemaFiltro={setSistemaFiltro}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
      />

      {/* Lista de Conformidades Agrupadas */}
      <div className="space-y-4">
        {Object.entries(itensPorSistema).map(([sistema, itensDoSistema]) => {
          const isExpanded = expandedSistemas[sistema] ?? true;
          const sistemaStats = stats.porSistema[sistema] || { total: 0, emDia: 0 };
          const porcentagem = sistemaStats.total > 0 
            ? Math.round((sistemaStats.emDia / sistemaStats.total) * 100) 
            : 0;

          return (
            <Collapsible
              key={sistema}
              open={isExpanded}
              onOpenChange={() => toggleSistema(sistema)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{sistema}</h3>
                      <p className="text-sm text-muted-foreground">
                        {sistemaStats.emDia}/{sistemaStats.total} em conformidade ({porcentagem}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <span className="text-muted-foreground">{itensDoSistema.length} itens</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {itensDoSistema.map((item) => (
                  <ConformidadeCard
                    key={item.id}
                    item={item}
                    onMarcarExecutado={handleMarcarExecutado}
                    onVerPlano={handleVerPlano}
                    isExecuting={executingItemId === item.id}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <ConformidadeOSDialog
        open={showOSDialog}
        onOpenChange={setShowOSDialog}
        onExecutar={handleExecutarOS}
        isExecuting={!!executingItemId}
      />
    </div>
  );
};

export default ComplianceChecklist;
