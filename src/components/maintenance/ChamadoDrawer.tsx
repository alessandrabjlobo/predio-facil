import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Wrench, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChamadoDrawerProps {
  open: boolean;
  onClose: () => void;
  chamado: any;
}

const getPrioridadeColor = (prioridade: string) => {
  const colors: Record<string, string> = {
    baixa: "bg-blue-100 text-blue-800",
    media: "bg-yellow-100 text-yellow-800",
    alta: "bg-orange-100 text-orange-800",
    urgente: "bg-red-100 text-red-800",
  };
  return colors[prioridade] || "bg-gray-100 text-gray-800";
};

const getCriticidadeColor = (criticidade: string) => {
  const colors: Record<string, string> = {
    P1: "bg-red-500 text-white",
    P2: "bg-orange-500 text-white",
    P3: "bg-yellow-500 text-white",
    P4: "bg-green-500 text-white",
  };
  return colors[criticidade] || "bg-gray-500 text-white";
};

export function ChamadoDrawer({ open, onClose, chamado }: ChamadoDrawerProps) {
  if (!chamado) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2">
            <ClipboardList className="h-5 w-5 mt-1 text-primary" />
            <span className="flex-1">{chamado.titulo}</span>
          </SheetTitle>
          <SheetDescription>Detalhes do chamado</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getPrioridadeColor(chamado.prioridade)}>
              {chamado.prioridade}
            </Badge>
            <Badge className={getCriticidadeColor(chamado.criticidade)}>
              {chamado.criticidade}
            </Badge>
            <Badge variant="outline">{chamado.status}</Badge>
          </div>

          <Separator />

          {/* Info básica */}
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Condomínio</div>
              <div className="text-sm font-medium">{chamado.condominio_nome}</div>
            </div>

            {chamado.categoria && (
              <div>
                <div className="text-sm text-muted-foreground">Categoria</div>
                <div className="text-sm font-medium">{chamado.categoria}</div>
              </div>
            )}

            {chamado.local && (
              <div>
                <div className="text-sm text-muted-foreground">Local</div>
                <div className="text-sm font-medium">{chamado.local}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground">Criado em</div>
              <div className="text-sm font-medium">
                {format(new Date(chamado.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Descrição */}
          {chamado.descricao && (
            <>
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Descrição
                </div>
                <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                  {chamado.descricao}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button className="flex-1" disabled>
              <Wrench className="h-4 w-4 mr-2" />
              Criar OS
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <XCircle className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
