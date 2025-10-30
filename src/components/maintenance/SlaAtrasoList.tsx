import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimerOff } from "lucide-react";
import { fetchOSSlaAtraso } from "@/lib/queries/maintenance";
import { Skeleton } from "@/components/ui/skeleton";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function SlaAtrasoList() {
  const { condominio } = useCondominioAtual();
  const [atrasos, setAtrasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominio?.id) return;

    setLoading(true);
    fetchOSSlaAtraso(condominio.id, 5)
      .then(({ data, error }) => {
        if (error) throw error;
        setAtrasos(data || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar OS com SLA atrasado:", err);
        setAtrasos([]);
      })
      .finally(() => setLoading(false));
  }, [condominio?.id]);

  if (loading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TimerOff className="h-5 w-5 text-destructive" />
          SLA Atrasado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atrasos.length > 0 ? (
          <div className="space-y-3">
            {atrasos.map((item: any) => (
              <div
                key={item.os_id}
                className="p-3 border rounded-lg hover:bg-accent/50 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-medium flex-1">
                    {item.chamado_titulo}
                  </div>
                  <Badge variant="destructive" className="flex-shrink-0">
                    {Math.floor(item.atraso_horas)}h
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{item.status}</span>
                  {item.fim_prev && (
                    <span>
                      Fim: {format(new Date(item.fim_prev), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhuma OS com SLA atrasado 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
}
