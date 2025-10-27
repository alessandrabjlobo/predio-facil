import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import TabsContainer from "@/components/patterns/TabsContainer";
import { Button } from "@/components/ui/button";
import { Wrench, CheckCircle } from "lucide-react";
import { useManutencoes } from "@/hooks/useManutencoes";
import { ManutencaoCard } from "@/components/manutencoes/ManutencaoCard";
import { ConcluirManutencaoDialog } from "@/components/manutencoes/ConcluirManutencaoDialog";
import { RemarcarDialog } from "@/components/manutencoes/RemarcarDialog";

export default function Manutencoes() {
  const [concluirDialogId, setConcluirDialogId] = useState<string | null>(null);
  const [remarcarDialogId, setRemarcarDialogId] = useState<string | null>(null);

  const { data: pendentes, isLoading: loadingPendentes } = useManutencoes({ status: "pendente" });
  const { data: emExecucao, isLoading: loadingExecucao } = useManutencoes({ status: "em_execucao" });
  const { data: concluidas, isLoading: loadingConcluidas } = useManutencoes({ status: "concluida" });

  const tabs = [
    {
      id: "pendentes",
      label: "Pendentes",
      content: (
        <div className="p-6 space-y-4">
          {loadingPendentes ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : (pendentes || []).length === 0 ? (
            <div className="text-center text-muted-foreground">Nenhuma manutenção pendente</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(pendentes || []).map((m: any) => (
                <ManutencaoCard
                  key={m.id}
                  manutencao={m}
                  onConcluir={setConcluirDialogId}
                  onRemarcar={setRemarcarDialogId}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "execucao",
      label: "Em Execução",
      content: (
        <div className="p-6 space-y-4">
          {loadingExecucao ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : (emExecucao || []).length === 0 ? (
            <div className="text-center text-muted-foreground">Nenhuma manutenção em execução</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(emExecucao || []).map((m: any) => (
                <ManutencaoCard
                  key={m.id}
                  manutencao={m}
                  onConcluir={setConcluirDialogId}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "concluidas",
      label: "Concluídas",
      content: (
        <div className="p-6 space-y-4">
          {loadingConcluidas ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : (concluidas || []).length === 0 ? (
            <div className="text-center text-muted-foreground">Nenhuma manutenção concluída</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(concluidas || []).map((m: any) => (
                <ManutencaoCard key={m.id} manutencao={m} />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "calendario",
      label: "Calendário",
      content: (
        <div className="p-6 text-center text-muted-foreground">
          Calendário de manutenções (em desenvolvimento)
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Manutenções"
        subtitle="Gerencie todas as manutenções preventivas e corretivas"
        icon={Wrench}
        actions={
          <Button>
            <CheckCircle className="h-4 w-4 mr-2" />
            Nova Manutenção
          </Button>
        }
      />
      <TabsContainer tabs={tabs} />

      <ConcluirManutencaoDialog
        open={!!concluirDialogId}
        onOpenChange={(open) => !open && setConcluirDialogId(null)}
        manutencaoId={concluirDialogId}
      />

      <RemarcarDialog
        open={!!remarcarDialogId}
        onOpenChange={(open) => !open && setRemarcarDialogId(null)}
        manutencaoId={remarcarDialogId}
      />
    </div>
  );
}
