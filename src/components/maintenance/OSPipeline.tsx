import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { fetchOSPipeline } from "@/lib/queries/maintenance";
import { Skeleton } from "@/components/ui/skeleton";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";

export function OSPipeline() {
  const { condominio } = useCondominioAtual();
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominio?.id) return;

    setLoading(true);
    fetchOSPipeline(condominio.id)
      .then(({ data, error }) => {
        if (error) throw error;
        setPipeline(data || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar pipeline de OS:", err);
        setPipeline([]);
      })
      .finally(() => setLoading(false));
  }, [condominio?.id]);

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-5 w-5 text-primary" />
          Pipeline de OS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pipeline.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {pipeline.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition"
              >
                <div className="text-xs text-muted-foreground capitalize mb-1">
                  {item.status}
                </div>
                <div className="text-2xl font-bold">{item.qtd}</div>
                {item.custo_total !== null && item.custo_total !== undefined && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.custo_total)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhuma OS no momento
          </div>
        )}
      </CardContent>
    </Card>
  );
}
