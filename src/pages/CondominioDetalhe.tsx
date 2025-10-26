import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import TabsContainer from "@/components/patterns/TabsContainer";
import { Button } from "@/components/ui/button";
import { Download, Edit, MoreHorizontal, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CondominioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [condominio, setCondominio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("condominios")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) throw error;
        setCondominio(data);
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

  if (!condominio) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="text-center text-muted-foreground">
          Condomínio não encontrado.
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "visao-geral",
      label: "Visão Geral",
      content: <div className="p-6 text-center text-muted-foreground">Visão Geral do Condomínio (implementar)</div>
    },
    {
      id: "sindico",
      label: "Síndico & Acessos",
      content: <div className="p-6 text-center text-muted-foreground">Síndico & Acessos (implementar)</div>
    },
    {
      id: "ativos",
      label: "Ativos",
      content: <div className="p-6 text-center text-muted-foreground">Ativos do Condomínio (implementar)</div>
    },
    {
      id: "plano",
      label: "Plano de Manutenção",
      content: <div className="p-6 text-center text-muted-foreground">Plano de Manutenção (implementar)</div>
    },
    {
      id: "os",
      label: "OS & Calendário",
      content: <div className="p-6 text-center text-muted-foreground">OS & Calendário (implementar)</div>
    },
    {
      id: "conformidade",
      label: "Conformidade",
      content: <div className="p-6 text-center text-muted-foreground">Conformidade (implementar)</div>
    },
    {
      id: "documentos",
      label: "Documentos",
      content: <div className="p-6 text-center text-muted-foreground">Documentos (implementar)</div>
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={condominio.nome || "Condomínio"}
        subtitle={condominio.endereco || ""}
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Arquivar</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        icon={Building2}
      />

      <TabsContainer tabs={tabs} />
    </div>
  );
}
