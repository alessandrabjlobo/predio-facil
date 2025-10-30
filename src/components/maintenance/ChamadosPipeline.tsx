import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { fetchChamadosPipeline } from "@/lib/queries/maintenance";
import { Skeleton } from "@/components/ui/skeleton";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";

export function ChamadosPipeline() {
  const { condominio } = useCondominioAtual();
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominio?.id) return;

    setLoading(true);
    fetchChamadosPipeline(condominio.id)
      .then(({ data, error }) => {
        if (error) throw error;
        setPipeline(data || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar pipeline de chamados:", err);
        setPipeline([]);
      })
      .finally(() => setLoading(false));
  }, [condominio?.id]);

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  const grouped = (pipeline as any[]).reduce((acc, item) => {
    if (!acc[item.status]) {
      acc[item.status] = [];
    }
    acc[item.status].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Pipeline de Chamados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(grouped).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([status, items]: [string, any[]]) => (
              <div key={status} className="space-y-2">
                <div className="text-sm font-semibold capitalize">{status}</div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition"
                    >
                      <div className="text-xs text-muted-foreground capitalize">
                        {item.prioridade}
                      </div>
                      <div className="text-lg font-bold">{item.qtd}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhum chamado no momento
          </div>
        )}
      </CardContent>
    </Card>
  );
}
