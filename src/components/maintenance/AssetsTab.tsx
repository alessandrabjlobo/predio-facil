import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Plus } from "lucide-react";
import { useAtivos } from "@/hooks/useAtivos";
import { useNBRRequisitos } from "@/hooks/useNBRRequisitos";
import { AssetTableView } from "@/components/AssetTableView";
import { AssetCardView } from "@/components/maintenance/AssetCardView";
import { ViewToggle } from "@/components/patterns/ViewToggle";
import { AddAssetDialog } from "@/components/maintenance/AddAssetDialog";
import { AssetChecklistModal } from "@/components/maintenance/AssetChecklistModal";

export function AssetsTab() {
  const { ativos, isLoading } = useAtivos();
  const { data: nbrRequisitos } = useNBRRequisitos();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    const saved = localStorage.getItem('maintenance_assets_view');
    return (saved as 'list' | 'card') || 'list';
  });

  useEffect(() => {
    localStorage.setItem('maintenance_assets_view', viewMode);
  }, [viewMode]);

  // Create NBR mapping for table view compatibility
  const nbrMapping = new Map<string, { nbr_codigo: string; requisito_descricao: string }[]>();
  nbrRequisitos?.forEach((nbr) => {
    if (!nbrMapping.has(nbr.ativo_tipo_slug)) {
      nbrMapping.set(nbr.ativo_tipo_slug, []);
    }
    nbrMapping.get(nbr.ativo_tipo_slug)?.push({
      nbr_codigo: nbr.nbr_codigo,
      requisito_descricao: nbr.requisito_descricao
    });
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
        <Button onClick={() => setAddAssetDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </div>

      <AddAssetDialog
        open={addAssetDialogOpen}
        onOpenChange={setAddAssetDialogOpen}
      />

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

      {/* Enhanced Checklist Modal */}
      <AssetChecklistModal
        open={checklistDialogOpen}
        onOpenChange={setChecklistDialogOpen}
        ativo={selectedAsset}
      />
    </div>
  );
}
