import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import { useNBRRequisitosByTipo } from "@/hooks/useNBRRequisitos";
import { useAtivos } from "@/hooks/useAtivos";
import { ChevronLeft, ChevronRight, FileText, ShieldCheck, Plus, Minus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 1 | 2 | 3;

interface AssetConfig {
  nome: string;
  local: string;
  torre?: string;
  andar?: string;
  observacoes?: string;
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const { tipos, isLoading } = useAtivoTipos();
  const { createAtivo } = useAtivos();
  
  const [step, setStep] = useState<Step>(1);
  const [selectedTipo, setSelectedTipo] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [assets, setAssets] = useState<AssetConfig[]>([{ nome: "", local: "" }]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: nbrRequisitos } = useNBRRequisitosByTipo(selectedTipo?.slug);

  const handleReset = () => {
    setStep(1);
    setSelectedTipo(null);
    setQuantity(1);
    setAssets([{ nome: "", local: "" }]);
    setIsCreating(false);
  };

  const handleTipoSelect = (tipo: any) => {
    setSelectedTipo(tipo);
    setStep(2);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    
    const newAssets: AssetConfig[] = [];
    for (let i = 0; i < newQuantity; i++) {
      if (assets[i]) {
        newAssets.push(assets[i]);
      } else {
        const suffix = newQuantity > 1 ? ` ${i + 1}` : "";
        newAssets.push({
          nome: `${selectedTipo?.nome || ""}${suffix}`,
          local: "",
        });
      }
    }
    setAssets(newAssets);
  };

  const handleAssetChange = (index: number, field: keyof AssetConfig, value: string) => {
    const newAssets = [...assets];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setAssets(newAssets);
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      
      // Create all assets
      for (const asset of assets) {
        await createAtivo.mutateAsync({
          tipo_id: selectedTipo.id,
          nome: asset.nome || selectedTipo.nome,
          local: asset.local,
          torre: asset.torre,
          andar: asset.andar,
          observacoes: asset.observacoes,
          requer_conformidade: selectedTipo.is_conformidade || false,
        });
      }

      toast({
        title: "Sucesso!",
        description: `${assets.length} ativo(s) criado(s) com sucesso. ${selectedTipo.is_conformidade ? 'Planos preventivos foram gerados automaticamente.' : ''}`,
      });

      onOpenChange(false);
      handleReset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) handleReset();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Ativo</DialogTitle>
          <DialogDescription>
            Passo {step} de 3 - {step === 1 ? "Selecionar Tipo" : step === 2 ? "Definir Quantidade" : "Configurar Detalhes"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Asset Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {isLoading ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Carregando tipos de ativos...
                </div>
              ) : (
                tipos?.map((tipo) => (
                  <Card
                    key={tipo.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-primary"
                    onClick={() => handleTipoSelect(tipo)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {tipo.nome}
                        {tipo.is_conformidade && (
                          <Badge variant="outline" className="text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            NBR
                          </Badge>
                        )}
                      </CardTitle>
                      {tipo.sistema_manutencao && (
                        <CardDescription className="text-xs">
                          Sistema: {tipo.sistema_manutencao}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Define Quantity */}
        {step === 2 && selectedTipo && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo Selecionado</CardTitle>
                <CardDescription>{selectedTipo.nome}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quantidade de Ativos</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= 50}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Você criará {quantity} ativo(s) do tipo "{selectedTipo.nome}"
                  </p>
                </div>

                {/* NBR Preview */}
                {selectedTipo.is_conformidade && nbrRequisitos && nbrRequisitos.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Requisitos NBR Aplicáveis</h4>
                    </div>
                    <div className="space-y-2">
                      {nbrRequisitos.map((nbr) => (
                        <div key={nbr.id} className="text-sm">
                          <Badge variant="outline" className="font-mono mr-2">
                            {nbr.nbr_codigo}
                          </Badge>
                          <span className="text-muted-foreground">{nbr.requisito_descricao}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <p className="text-sm text-primary font-medium">
                        ✓ {nbrRequisitos.length} plano(s) preventivo(s) serão criados automaticamente
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Configure Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {assets.map((asset, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Ativo {index + 1} de {quantity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor={`nome-${index}`}>Nome do Ativo *</Label>
                      <Input
                        id={`nome-${index}`}
                        value={asset.nome}
                        onChange={(e) => handleAssetChange(index, "nome", e.target.value)}
                        placeholder={`Ex: ${selectedTipo?.nome} ${index + 1}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`local-${index}`}>Local *</Label>
                        <Input
                          id={`local-${index}`}
                          value={asset.local}
                          onChange={(e) => handleAssetChange(index, "local", e.target.value)}
                          placeholder="Ex: Portaria, Garagem"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`torre-${index}`}>Torre</Label>
                        <Input
                          id={`torre-${index}`}
                          value={asset.torre || ""}
                          onChange={(e) => handleAssetChange(index, "torre", e.target.value)}
                          placeholder="Ex: Torre A"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`andar-${index}`}>Andar</Label>
                      <Input
                        id={`andar-${index}`}
                        value={asset.andar || ""}
                        onChange={(e) => handleAssetChange(index, "andar", e.target.value)}
                        placeholder="Ex: Térreo, 5º andar"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`observacoes-${index}`}>Observações</Label>
                      <Input
                        id={`observacoes-${index}`}
                        value={asset.observacoes || ""}
                        onChange={(e) => handleAssetChange(index, "observacoes", e.target.value)}
                        placeholder="Informações adicionais"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || assets.some(a => !a.nome || !a.local)}
              >
                {isCreating ? "Criando..." : `Criar ${quantity} Ativo(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
