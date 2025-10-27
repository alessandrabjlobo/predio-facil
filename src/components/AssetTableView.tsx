import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShieldAlert, MapPin, Calendar, FileText, Wrench, MoreVertical, Eye, Plus } from "lucide-react";
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

interface AssetTableViewProps {
  ativos: Asset[];
  nbrMapping: Map<string, { nbr_codigo: string; requisito_descricao: string }[]>;
  onAssetClick: (ativo: Asset) => void;
  onCreateOS?: (ativo: Asset) => void;
  isLoading?: boolean;
}

export function AssetTableView({ ativos, nbrMapping, onAssetClick, onCreateOS, isLoading }: AssetTableViewProps) {
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">Carregando ativos...</div>
      </Card>
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

  const getConformidadeColor = (status?: string) => {
    switch (status) {
      case "conforme":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "atencao":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "nao_conforme":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getConformidadeLabel = (status?: string) => {
    switch (status) {
      case "conforme":
        return "Conforme";
      case "atencao":
        return "Atenção";
      case "nao_conforme":
        return "Não Conforme";
      default:
        return "Pendente";
    }
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Ativo</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Local</TableHead>
              <TableHead className="font-semibold">NBR Aplicável</TableHead>
              <TableHead className="font-semibold">Status Conformidade</TableHead>
              <TableHead className="font-semibold">Próxima Inspeção</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ativos.map((ativo) => {
              const tipoNome = ativo.ativo_tipos?.nome || "Não especificado";
              const nbrRequisitos = nbrMapping.get(ativo.tipo_id) || [];
              
              return (
                <TableRow 
                  key={ativo.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onAssetClick(ativo)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {ativo.requer_conformidade && (
                        <ShieldAlert className="h-4 w-4 text-rose-600" />
                      )}
                      <span>{ativo.nome}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {tipoNome}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {ativo.local ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {ativo.local}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {nbrRequisitos.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {nbrRequisitos.slice(0, 2).map((nbr, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              {nbr.nbr_codigo}
                            </span>
                          </div>
                        ))}
                        {nbrRequisitos.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{nbrRequisitos.length - 2} mais
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getConformidadeColor(ativo.status_conformidade)}
                    >
                      {getConformidadeLabel(ativo.status_conformidade)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {ativo.proxima_manutencao ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(ativo.proxima_manutencao), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssetClick(ativo);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateOS?.(ativo);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Gerar OS
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}