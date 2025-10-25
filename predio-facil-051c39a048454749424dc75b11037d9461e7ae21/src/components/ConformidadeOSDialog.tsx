import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ClipboardList } from "lucide-react";

interface ConformidadeOSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecutar: (gerarOS: boolean, observacoes?: string) => void;
  isExecuting: boolean;
}

export const ConformidadeOSDialog = ({
  open,
  onOpenChange,
  onExecutar,
  isExecuting,
}: ConformidadeOSDialogProps) => {
  const [observacoes, setObservacoes] = useState("");

  const handleExecutar = (gerarOS: boolean) => {
    onExecutar(gerarOS, observacoes);
    setObservacoes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar Manutenção como Executada</DialogTitle>
          <DialogDescription>
            Escolha como deseja registrar a execução desta manutenção
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre a execução..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={() => handleExecutar(true)}
            disabled={isExecuting}
            className="w-full gap-2"
            variant="default"
          >
            <ClipboardList className="h-4 w-4" />
            Gerar OS e Agendar Execução
          </Button>
          <Button
            onClick={() => handleExecutar(false)}
            disabled={isExecuting}
            className="w-full gap-2"
            variant="outline"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar como Executado (Sem OS)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
