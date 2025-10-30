import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wrench, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchOSItens } from "@/lib/queries/maintenance";
import { Skeleton } from "@/components/ui/skeleton";

interface OSDrawerProps {
  open: boolean;
  onClose: () => void;
  os: any;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    aberta: "bg-blue-100 text-blue-800",
    em_andamento: "bg-yellow-100 text-yellow-800",
    aguardando_validacao: "bg-purple-100 text-purple-800",
    concluida: "bg-green-100 text-green-800",
    cancelada: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export function OSDrawer({ open, onClose, os }: OSDrawerProps) {
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && os?.id) {
      setLoading(true);
      fetchOSItens(os.id)
        .then(({ data, error }) => {
          if (error) throw error;
          setItens(data || []);
        })
        .catch((err) => {
          console.error("Erro ao carregar itens da OS:", err);
          setItens([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, os?.id]);

  if (!os) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2">
            <Wrench className="h-5 w-5 mt-1 text-primary" />
            <span className="flex-1">{os.chamado_titulo || "OS sem título"}</span>
          </SheetTitle>
          <SheetDescription>Detalhes da ordem de serviço</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Badge de status */}
          <div>
            <Badge className={getStatusColor(os.status)}>{os.status}</Badge>
          </div>

          <Separator />

          {/* Info básica */}
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Condomínio</div>
              <div className="text-sm font-medium">{os.condominio_nome}</div>
            </div>

            {os.inicio_prev && (
              <div>
                <div className="text-sm text-muted-foreground">
                  Início Previsto
                </div>
                <div className="text-sm font-medium">
                  {format(new Date(os.inicio_prev), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </div>
              </div>
            )}

            {os.fim_prev && (
              <div>
                <div className="text-sm text-muted-foreground">Fim Previsto</div>
                <div className="text-sm font-medium">
                  {format(new Date(os.fim_prev), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            )}

            {os.custo_total !== null && os.custo_total !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">Custo Total</div>
                <div className="text-sm font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(os.custo_total)}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Itens da OS */}
          <div>
            <div className="text-sm font-medium mb-3">Itens da OS</div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : itens.length > 0 ? (
              <div className="space-y-2">
                {itens.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {item.concluido ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {item.descricao}
                      </div>
                      {item.observacao && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.observacao}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhum item encontrado
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
