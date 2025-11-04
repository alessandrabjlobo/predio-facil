// FILE: src/components/os/OSKanban.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listOS, setOSStatus, type OSRow, type OSStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/** Colunas do Kanban na ordem desejada */
const COLUMNS: Array<{ key: OSStatus; title: string }> = [
  { key: "aberta",        title: "A Fazer" },
  { key: "em andamento",  title: "Em Execução" },
  { key: "concluida",     title: "Concluída" },
  { key: "cancelada",     title: "Cancelada" },
];

type DragState = { osId: string | null };

export default function OSKanban() {
  const [params] = useSearchParams();
  const ativoFilter = params.get("ativo") || undefined;

  const [items, setItems] = useState<OSRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>({ osId: null });

  async function refresh() {
    setLoading(true);
    try {
      const data = await listOS(ativoFilter ? ({ ativo_id: ativoFilter } as any) : undefined);
      setItems(data);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao carregar OS",
        description: e?.message ?? "Falha inesperada",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [ativoFilter]);

  const byColumn = useMemo(() => {
    const map: Record<OSStatus, OSRow[]> = {
      "aberta": [],
      "em andamento": [],
      "aguardando_validacao": [],
      "concluida": [],
      "cancelada": [],
    };
    for (const r of items) {
      const s = (r.status ?? "aberta") as OSStatus;
      map[s]?.push(r);
    }
    return map;
  }, [items]);

  /** DnD handlers */
  function onDragStart(e: React.DragEvent, osId: string) {
    e.dataTransfer.setData("text/plain", osId);
    setDrag({ osId });
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  async function onDrop(e: React.DragEvent, newStatus: OSStatus) {
    e.preventDefault();
    const osId = e.dataTransfer.getData("text/plain") || drag.osId;
    setDrag({ osId: null });
    if (!osId) return;

    const current = items.find(i => i.id === osId);
    if (!current || (current.status as OSStatus) === newStatus) return;

    // otimista
    setItems(prev => prev.map(i => i.id === osId ? { ...i, status: newStatus } : i));
    setSavingId(osId);
    try {
      await setOSStatus(osId, newStatus);
    } catch (err: any) {
      // rollback
      setItems(prev => prev.map(i => i.id === osId ? { ...i, status: current.status } : i));
      const payloadPreview = JSON.stringify({ id: osId, status: newStatus }).slice(0, 200) + "...";
      console.error("Falha ao alterar status:", err);
      toast({
        title: "Erro ao alterar status",
        description: `${err?.message || "Falha desconhecida"}\nPayload: ${payloadPreview}`,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {ativoFilter ? (
            <>Filtrando por ativo: <span className="font-medium">{ativoFilter}</span></>
          ) : (<>Arraste as OS entre as colunas para mudar o status.</>)}
        </div>
        <Button size="sm" variant="outline" onClick={refresh} title="Recarregar">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando Kanban...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className="flex flex-col gap-3 min-h-[400px] rounded-lg border bg-background"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <div className="font-medium">{col.title}</div>
                <div className="text-xs text-muted-foreground">
                  {byColumn[col.key].length} itens
                </div>
              </div>

              <div className="p-3 space-y-3">
                {byColumn[col.key].length === 0 ? (
                  <div className="text-xs text-muted-foreground border border-dashed rounded-md p-4 text-center">
                    Solte aqui para marcar como “{col.title}”
                  </div>
                ) : (
                  byColumn[col.key].map(card => (
                    <Card
                      key={card.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, card.id)}
                      className="p-3 cursor-grab active:cursor-grabbing shadow-sm border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-medium leading-tight">{card.titulo}</div>
                          {card.responsavel && (
                            <div className="text-xs text-muted-foreground">
                              Resp.: {card.responsavel}
                            </div>
                          )}
                          {card.data_abertura && (
                            <div className="text-[10px] text-muted-foreground">
                              Abertura: {new Date(card.data_abertura).toLocaleString()}
                            </div>
                          )}
                        </div>
                        {savingId === card.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
