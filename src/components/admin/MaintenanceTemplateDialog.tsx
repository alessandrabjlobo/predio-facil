import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MaintenanceTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  onSuccess: () => void;
}

export function MaintenanceTemplateDialog({ open, onOpenChange, template, onSuccess }: MaintenanceTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sistema: template?.sistema || "",
    titulo_plano: template?.titulo_plano || "",
    descricao: template?.descricao || "",
    periodicidade_dias: template?.periodicidade ? parseInt(template.periodicidade.match(/\d+/)?.[0] || "30") : 30,
    responsavel: template?.responsavel || "sindico",
    is_conformidade: template?.is_conformidade || false,
    checklist: template?.checklist || "[]",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        periodicidade: `${formData.periodicidade_dias} days`,
        checklist: typeof formData.checklist === "string" ? JSON.parse(formData.checklist) : formData.checklist,
      };

      if (template) {
        const { error } = await supabase
          .from("manut_templates")
          .update(payload)
          .eq("id", template.id);

        if (error) throw error;
        toast.success("Template atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("manut_templates")
          .insert(payload);

        if (error) throw error;
        toast.success("Template criado com sucesso!");
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Editar" : "Novo"} Template de Manutenção</DialogTitle>
          <DialogDescription>
            {template ? "Atualize as informações do template" : "Crie um novo template NBR"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sistema *</Label>
              <Input
                required
                value={formData.sistema}
                onChange={(e) => setFormData({ ...formData, sistema: e.target.value })}
                placeholder="Ex: elevadores, spda, incendio"
              />
            </div>
            <div>
              <Label>Periodicidade (dias) *</Label>
              <Input
                type="number"
                required
                value={formData.periodicidade_dias}
                onChange={(e) => setFormData({ ...formData, periodicidade_dias: parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <Label>Título do Plano *</Label>
              <Input
                required
                value={formData.titulo_plano}
                onChange={(e) => setFormData({ ...formData, titulo_plano: e.target.value })}
                placeholder="Ex: NBR 16083: Inspeção Mensal de Elevadores"
              />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes sobre este template"
                rows={3}
              />
            </div>
            <div>
              <Label>Responsável</Label>
              <Select
                value={formData.responsavel}
                onValueChange={(value) => setFormData({ ...formData, responsavel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sindico">Síndico</SelectItem>
                  <SelectItem value="terceirizado">Terceirizado</SelectItem>
                  <SelectItem value="zelador">Zelador</SelectItem>
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
              <Label>Checklist (JSON)</Label>
              <Textarea
                value={typeof formData.checklist === "string" ? formData.checklist : JSON.stringify(formData.checklist, null, 2)}
                onChange={(e) => setFormData({ ...formData, checklist: e.target.value })}
                placeholder='[{"item": "Verificar cabos", "obrigatorio": true}]'
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
              {loading ? "Salvando..." : template ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
