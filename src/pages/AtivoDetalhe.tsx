import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import TabsContainer from "@/components/patterns/TabsContainer";
import { Button } from "@/components/ui/button";
import { Edit, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AtivoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [ativo, setAtivo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("ativos")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) throw error;
        setAtivo(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!ativo) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="text-center text-muted-foreground">
          Ativo não encontrado.
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "visao-geral",
      label: "Visão Geral",
      content: <div className="p-6 text-center text-muted-foreground">Visão Geral do Ativo (implementar)</div>
    },
    {
      id: "plano",
      label: "Plano",
      content: <div className="p-6 text-center text-muted-foreground">Plano de Manutenção (implementar)</div>
    },
    {
      id: "os",
      label: "OS",
      content: <div className="p-6 text-center text-muted-foreground">Ordens de Serviço (implementar)</div>
    },
    {
      id: "historico",
      label: "Histórico",
      content: <div className="p-6 text-center text-muted-foreground">Histórico de Manutenções (implementar)</div>
    },
    {
      id: "documentos",
      label: "Documentos",
      content: <div className="p-6 text-center text-muted-foreground">Documentos (implementar)</div>
    },
    {
      id: "conformidade",
      label: "Conformidade",
      content: <div className="p-6 text-center text-muted-foreground">Status de Conformidade (implementar)</div>
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={ativo.nome || "Ativo"}
        subtitle={`${ativo.local || ""} • ${ativo.tipo || ""}`}
        actions={
          <>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </>
        }
        icon={Package}
      />

      <TabsContainer tabs={tabs} />
    </div>
  );
}
