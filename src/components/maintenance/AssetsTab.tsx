import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Plus } from "lucide-react";
import { useAtivos } from "@/hooks/useAtivos";
import { useNBRRequisitos } from "@/hooks/useNBRRequisitos";
import { AssetTableView } from "@/components/AssetTableView";
import { AssetCardView } from "@/components/maintenance/AssetCardView";
import { ViewToggle } from "@/components/patterns/ViewToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function AssetsTab() {
  const { ativos, isLoading } = useAtivos();
  const { data: nbrRequisitos } = useNBRRequisitos();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    const saved = localStorage.getItem('maintenance_assets_view');
    return (saved as 'list' | 'card') || 'list';
  });

  useEffect(() => {
    localStorage.setItem('maintenance_assets_view', viewMode);
  }, [viewMode]);

  // Create NBR mapping
  const nbrMapping = new Map<string, { nbr_codigo: string; requisito_descricao: string }[]>();
  nbrRequisitos?.forEach((nbr) => {
    const tipoAtivo = ativos?.find(a => a.tipo_id && a.ativo_tipos?.nome)?.tipo_id;
    if (tipoAtivo) {
      if (!nbrMapping.has(tipoAtivo)) {
        nbrMapping.set(tipoAtivo, []);
      }
      nbrMapping.get(tipoAtivo)?.push({
        nbr_codigo: nbr.nbr_codigo,
        requisito_descricao: nbr.requisito_descricao
      });
    }
  });

  const filteredAtivos = ativos?.filter(ativo => {
    const search = searchTerm.toLowerCase();
    return (
      ativo.nome.toLowerCase().includes(search) ||
      ativo.ativo_tipos?.nome?.toLowerCase().includes(search) ||
      ativo.local?.toLowerCase().includes(search)
    );
  });

  const handleAssetClick = (ativo: any) => {
    setSelectedAsset(ativo);
    setChecklistDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tipo ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </div>

      {viewMode === 'list' ? (
        <AssetTableView
          ativos={filteredAtivos || []}
          nbrMapping={nbrMapping}
          onAssetClick={handleAssetClick}
          isLoading={isLoading}
        />
      ) : (
        <AssetCardView
          ativos={filteredAtivos || []}
          nbrMapping={nbrMapping}
          onAssetClick={handleAssetClick}
          isLoading={isLoading}
        />
      )}

      {/* Checklist Dialog */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Checklist NBR - {selectedAsset?.nome}
            </DialogTitle>
            <DialogDescription>
              Itens de inspeção conforme normas técnicas aplicáveis
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedAsset && nbrMapping.get(selectedAsset.tipo_id)?.map((nbr, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">
                    {nbr.nbr_codigo}
                  </Badge>
                  <h4 className="font-medium">{nbr.requisito_descricao}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ver detalhes completos do checklist na aba "Planos Preventivos"
                </p>
              </div>
            ))}
            {selectedAsset && (!nbrMapping.get(selectedAsset.tipo_id) || nbrMapping.get(selectedAsset.tipo_id)?.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma norma NBR aplicável para este tipo de ativo
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
