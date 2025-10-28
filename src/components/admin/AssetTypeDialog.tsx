import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssetTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetType?: any;
  onSuccess: () => void;
}

export function AssetTypeDialog({ open, onOpenChange, assetType, onSuccess }: AssetTypeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: assetType?.nome || "",
    slug: assetType?.slug || "",
    sistema_manutencao: assetType?.sistema_manutencao || "",
    criticidade: assetType?.criticidade || "media",
    is_conformidade: assetType?.is_conformidade || false,
    checklist_default: assetType?.checklist_default ? JSON.stringify(assetType.checklist_default, null, 2) : "[]",
  });

  // Keep form in sync when editing
  if (open && assetType && (formData.slug !== (assetType?.slug || ""))) {
    setFormData({
      nome: assetType?.nome || "",
      slug: assetType?.slug || "",
      sistema_manutencao: assetType?.sistema_manutencao || "",
      criticidade: assetType?.criticidade || "media",
      is_conformidade: assetType?.is_conformidade || false,
      checklist_default: assetType?.checklist_default ? JSON.stringify(assetType.checklist_default, null, 2) : "[]",
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        slug: formData.slug,
        sistema_manutencao: formData.sistema_manutencao,
        criticidade: formData.criticidade,
        is_conformidade: formData.is_conformidade,
        checklist_default: typeof formData.checklist_default === 'string' ? JSON.parse(formData.checklist_default) : formData.checklist_default,
      } as any;

      if (assetType) {
        const { error } = await supabase
          .from("ativo_tipos")
          .update(payload)
          .eq("id", assetType.id);

        if (error) throw error;
        toast.success("Tipo de ativo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("ativo_tipos")
          .insert(payload);

        if (error) throw error;
        toast.success("Tipo de ativo criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assetType ? "Editar" : "Novo"} Tipo de Ativo</DialogTitle>
          <DialogDescription>
            {assetType ? "Atualize as informações do tipo de ativo" : "Crie um novo tipo de ativo global"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Elevador"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ex: elevador"
              />
            </div>
            <div>
              <Label>Sistema de Manutenção</Label>
              <Input
                value={formData.sistema_manutencao}
                onChange={(e) => setFormData({ ...formData, sistema_manutencao: e.target.value })}
                placeholder="Ex: mecanico"
              />
            </div>
            <div>
              <Label>Criticidade</Label>
              <Select
                value={formData.criticidade}
                onValueChange={(value) => setFormData({ ...formData, criticidade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conformidade Obrigatória</Label>
              <Select
                value={formData.is_conformidade ? "true" : "false"}
                onValueChange={(value) => setFormData({ ...formData, is_conformidade: value === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Checklist Padrão (JSON)</Label>
              <Textarea
                value={typeof formData.checklist_default === 'string' ? formData.checklist_default : JSON.stringify(formData.checklist_default, null, 2)}
                onChange={(e) => setFormData({ ...formData, checklist_default: e.target.value })}
                placeholder='[{"descricao": "Verificar cabos", "obrigatorio": true}]'
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : assetType ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
