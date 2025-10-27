import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useManutencaoActions } from "@/hooks/useManutencaoActions";

interface ConcluirManutencaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencaoId: string | null;
}

export function ConcluirManutencaoDialog({ open, onOpenChange, manutencaoId }: ConcluirManutencaoDialogProps) {
  const [anexo, setAnexo] = useState<File | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const { concluir } = useManutencaoActions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manutencaoId) return;

    await concluir.mutateAsync({
      id: manutencaoId,
      anexo: anexo || undefined,
    });

    onOpenChange(false);
    setAnexo(null);
    setObservacoes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Anexo (opcional)</Label>
            <Input
              type="file"
              onChange={(e) => setAnexo(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comprovante de execução, laudo, etc.
            </p>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes da execução..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={concluir.isPending}>
              {concluir.isPending ? "Salvando..." : "Concluir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
