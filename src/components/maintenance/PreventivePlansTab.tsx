// src/components/maintenance/PreventivePlansTab.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, FileCheck, Plus, Search, RefreshCw } from "lucide-react";
import { usePlanosManutencao } from "@/hooks/usePlanosManutencao";
import { format, differenceInDays, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlansTableView } from "@/components/maintenance/PlansTableView";
import { ViewToggle } from "@/components/patterns/ViewToggle";
import { useNavigate } from "react-router-dom";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { gerarPlanosPreventivos } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function PreventivePlansTab() {
  const { planos, isLoading, refetch } = usePlanosManutencao() as any;
  const navigate = useNavigate();
  const { condominio } = useCondominioAtual();

  const [searchTerm, setSearchTerm] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [autoRan, setAutoRan] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "card">(() => {
    const saved = localStorage.getItem("maintenance_plans_view");
    return (saved as "list" | "card") || "card";
  });

  useEffect(() => {
    localStorage.setItem("maintenance_plans_view", viewMode);
  }, [viewMode]);

  // Geração automática (uma vez) se não houver planos e existir condomínio atual
  useEffect(() => {
    const shouldAutoGenerate =
      !isLoading && !autoRan && (planos?.length ?? 0) === 0 && condominio?.id;
    if (!shouldAutoGenerate) return;

    setAutoRan(true);
    (async () => {
      try {
        setGenLoading(true);
        await gerarPlanosPreventivos(condominio!.id);
        toast({ title: "Planos gerados automaticamente." });
        if (typeof refetch === "function") await refetch();
      } catch (e: any) {
        // Silencioso para não incomodar; usuário pode usar o botão manual
        console.error("Auto-generate preventive plans failed:", e?.message || e);
      } finally {
        setGenLoading(false);
      }
    })();
  }, [isLoading, autoRan, planos, condominio, refetch]);

  const getPeriodicidadeLabel = (periodicidade: any) => {
    if (!periodicidade) return "N/A";
    const match = periodicidade.toString().match(/(\d+)/);
    if (match) {
      const days = parseInt(match[1], 10);
      if (days === 30) return "Mensal";
      if (days === 90) return "Trimestral";
      if (days === 180) return "Semestral";
      if (days === 365) return "Anual";
      return `${days} dias`;
    }
    return String(periodicidade);
  };

  const getStatusColor = (proximaExecucao: string) => {
    if (!proximaExecucao) return "border-success bg-success/5";
    const days = differenceInDays(new Date(proximaExecucao), new Date());
    if (days < 0) return "border-danger bg-danger/5";
    if (days <= 15) return "border-warning bg-warning/5";
    return "border-success bg-success/5";
  };

  const getStatusBadge = (proximaExecucao: string) => {
    if (!proximaExecucao) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success">
          Em Dia
        </Badge>
      );
    }
    const days = differenceInDays(new Date(proximaExecucao), new Date());
    if (days < 0) return <Badge variant="destructive">Atrasado</Badge>;
    if (days <= 15)
      return (
        <Badge variant="secondary" className="bg-warning/10 text-warning">
          Próximo
        </Badge>
      );
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success">
        Em Dia
      </Badge>
    );
  };

  const filteredPlanos =
    planos?.filter((plano: any) => {
      const search = searchTerm.toLowerCase();
      return (
        plano.titulo?.toLowerCase().includes(search) ||
        plano.ativo?.nome?.toLowerCase().includes(search) ||
        plano.ativos?.nome?.toLowerCase().includes(search)
      );
    }) ?? [];

  /** Abre o formulário COMPLETO em /os/novo com os campos pré-preenchidos */
  const handleGenerateOS = (plano: any) => {
    const ativoId = plano?.ativo?.id ?? plano?.ativo_id ?? plano?.ativos?.id ?? "";
    const titulo = plano?.titulo ? `OS – ${plano.titulo}` : "OS";
    const descricao = plano?.titulo
      ? `OS criada a partir do plano "${plano.titulo}".`
      : "OS criada a partir de plano preventivo.";
    const venc = plano?.proxima_execucao || "";

    const qs = new URLSearchParams({
      ativo: String(ativoId || ""),
      titulo,
      descricao,
      origem: "plano",
      vencimento: venc,
      prioridade: "media",
      tipo_manutencao: "preventiva",
    });

    navigate(`/os/novo?${qs.toString()}`);
  };

  const handleGeneratePlans = async () => {
    if (!condominio?.id) {
      toast({ 
        variant: "destructive", 
        title: "Condomínio não definido", 
        description: "Selecione um condomínio para gerar os planos." 
      });
      return;
    }
    
    try {
      setGenLoading(true);
      await gerarPlanosPreventivos(condominio.id);
      toast({ 
        title: "✅ Sucesso", 
        description: "Planos preventivos gerados com sucesso." 
      });
      
      if (typeof refetch === "function") {
        await refetch();
      } else {
        toast({ description: "Atualize a página para ver os novos planos." });
      }
    } catch (e: any) {
      console.error("❌ Erro ao gerar planos:", e);
      toast({
        variant: "destructive",
        title: "Falha ao gerar planos",
        description: e?.message ?? "Erro inesperado",
      });
    } finally {
      setGenLoading(false);
    }
  };

  if (isLoading && !planos) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando planos...
      </div>
    );
  }

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
        <Button variant="outline" onClick={handleGeneratePlans} disabled={genLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {genLoading ? "Gerando..." : "Gerar planos"}
        </Button>
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
              Os planos são criados automaticamente ao cadastrar ativos que
              requerem conformidade ou pelo botão “Gerar planos”.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={handleGeneratePlans} disabled={genLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {genLoading ? "Gerando..." : "Gerar planos agora"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlanos.map((plano: any) => {
            const d = plano.proxima_execucao ? new Date(plano.proxima_execucao) : null;
            const dataFmt =
              d && isValid(d)
                ? format(d, "dd/MM/yyyy", { locale: ptBR })
                : "—";

            return (
              <Card
                key={plano.id}
                className={`hover:shadow-md transition-shadow ${getStatusColor(
                  plano.proxima_execucao
                )}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-base line-clamp-2">
                      {plano.titulo}
                    </CardTitle>
                    {getStatusBadge(plano.proxima_execucao)}
                  </div>
                  <CardDescription className="line-clamp-1">
                    {plano.ativo?.nome || plano.ativos?.nome || "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Periodicidade:</span>
                    <span className="font-medium">
                      {getPeriodicidadeLabel(plano.periodicidade)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Próxima:</span>
                    <span className="font-medium">{dataFmt}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Responsável:</span>
                    <span className="font-medium capitalize">
                      {plano.responsavel || "Síndico"}
                    </span>
                  </div>

                  {plano.is_legal && (
                    <Badge variant="outline" className="text-xs">
                      <FileCheck className="h-3 w-3 mr-1" />
                      NBR Legal
                    </Badge>
                  )}

                  <div className="pt-2">
                    <Button className="w-full" size="sm" onClick={() => handleGenerateOS(plano)}>
                      Gerar OS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <PlansTableView
          planos={filteredPlanos}
          onGenerateOS={handleGenerateOS}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default PreventivePlansTab;
