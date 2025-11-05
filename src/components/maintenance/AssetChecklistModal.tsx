import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo: any;
}

export function AssetChecklistModal({ open, onOpenChange, ativo }: AssetChecklistModalProps) {
  const [loading, setLoading] = useState(true);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open && ativo?.id) {
      loadAssetInfo();
    }
  }, [open, ativo?.id]);

  const loadAssetInfoFallback = async () => {
    try {
      const { data: planos } = await supabase
        .from("planos_manutencao")
        .select("checklist, titulo")
        .eq("ativo_id", ativo.id)
        .limit(1)
        .maybeSingle();

      if (planos?.checklist) {
        setChecklistItems(Array.isArray(planos.checklist) ? planos.checklist : []);
      }

      const { data: manutencoes } = await supabase
        .from("manutencoes")
        .select("id, vencimento, status")
        .eq("ativo_id", ativo.id)
        .order("vencimento", { ascending: false })
        .limit(10);

      if (manutencoes) {
        setMaintenanceHistory(manutencoes);
      }
    } catch (e) {
      console.warn("Fallback also failed:", e);
    }
  };

  const loadAssetInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_asset_maintenance_info", {
        p_ativo_id: ativo.id,
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.warn("get_asset_maintenance_info RPC not available, using fallback");
          await loadAssetInfoFallback();
          return;
        }
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setChecklistItems(Array.isArray(result.checklist_items) ? result.checklist_items : []);
        setMaintenanceHistory(Array.isArray(result.maintenance_history) ? result.maintenance_history : []);
      }
    } catch (error) {
      console.error("Error loading asset info:", error);
      await loadAssetInfoFallback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checklist e Histórico - {ativo?.nome}</DialogTitle>
          <DialogDescription>
            Requisitos NBR e histórico de manutenções realizadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NBR Checklist Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📋 Checklist NBR</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : checklistItems.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {checklistItems.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.item || item.descricao || item}</p>
                      {item.obrigatorio && (
                        <Badge variant="destructive" className="mt-1">Obrigatório</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
                Nenhum checklist NBR vinculado a este tipo de ativo.
              </p>
            )}
          </div>

          {/* Maintenance History Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📝 Histórico de Manutenções</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : maintenanceHistory.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {maintenanceHistory.map((record: any, idx: number) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {record.status === "concluida" ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : record.status === "aberta" ? (
                          <Clock className="h-5 w-5 text-warning" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-semibold">{record.os_numero}</span>
                      </div>
                      <Badge variant={record.tipo === "preventiva" ? "default" : "secondary"}>
                        {record.tipo}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Data: {new Date(record.data_conclusao).toLocaleDateString("pt-BR")}</p>
                      {record.responsavel && <p>Responsável: {record.responsavel}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
                Nenhuma manutenção registrada para este ativo.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
