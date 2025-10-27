import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useManutencaoActions } from "@/hooks/useManutencaoActions";

interface RemarcarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencaoId: string | null;
}

export function RemarcarDialog({ open, onOpenChange, manutencaoId }: RemarcarDialogProps) {
  const [novaData, setNovaData] = useState("");
  const { remarcar } = useManutencaoActions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manutencaoId || !novaData) return;

    await remarcar.mutateAsync({
      id: manutencaoId,
      novaData,
    });

    onOpenChange(false);
    setNovaData("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remarcar Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nova Data de Vencimento</Label>
            <Input
              type="date"
              required
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={remarcar.isPending}>
              {remarcar.isPending ? "Salvando..." : "Remarcar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
