import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, FileText, Calendar, User, Wrench, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Asset = {
  id: string;
  nome: string;
  tipo_id: string;
  ativo_tipos?: { nome: string };
  local?: string;
  status_conformidade?: string;
  requer_conformidade?: boolean;
  proxima_manutencao?: string;
  created_at?: string;
};

interface AssetCardViewProps {
  ativos: Asset[];
  nbrMapping: Map<string, { nbr_codigo: string; requisito_descricao: string }[]>;
  onAssetClick: (ativo: Asset) => void;
  isLoading?: boolean;
}

export function AssetCardView({ ativos, nbrMapping, onAssetClick, isLoading }: AssetCardViewProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Carregando ativos...</div>
    );
  }

  if (!ativos || ativos.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          Nenhum ativo cadastrado. Clique em "Novo Ativo" para começar.
        </div>
      </Card>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "conforme":
        return "border-success";
      case "atencao":
        return "border-warning";
      case "nao_conforme":
        return "border-danger";
      default:
        return "border-border";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "conforme":
        return <Badge className="bg-success/10 text-success border-success">🟢 Conforme</Badge>;
      case "atencao":
        return <Badge className="bg-warning/10 text-warning border-warning">🟡 Atenção</Badge>;
      case "nao_conforme":
        return <Badge className="bg-danger/10 text-danger border-danger">🔴 Não Conforme</Badge>;
      default:
        return <Badge variant="outline">⚪ Pendente</Badge>;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ativos.map((ativo) => {
        const nbrRequisitos = nbrMapping.get(ativo.tipo_id) || [];
        
        return (
          <Card 
            key={ativo.id} 
            className={`hover:shadow-lg transition-all cursor-pointer ${getStatusColor(ativo.status_conformidade)}`}
            onClick={() => onAssetClick(ativo)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {ativo.requer_conformidade && (
                      <ShieldAlert className="h-4 w-4 text-danger" />
                    )}
                    {ativo.nome}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {ativo.ativo_tipos?.nome || "Não especificado"}
                  </CardDescription>
                </div>
                {getStatusBadge(ativo.status_conformidade)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {ativo.local && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{ativo.local}</span>
                </div>
              )}
              
              {nbrRequisitos.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-muted-foreground">NBR: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nbrRequisitos.slice(0, 3).map((nbr, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {nbr.nbr_codigo}
                        </Badge>
                      ))}
                      {nbrRequisitos.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{nbrRequisitos.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {ativo.proxima_manutencao && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Próxima: </span>
                  <span className="font-medium">
                    {format(new Date(ativo.proxima_manutencao), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              
              <div className="pt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssetClick(ativo);
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Checklist
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open OS
                  }}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Abrir OS
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
