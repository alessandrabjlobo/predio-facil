import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import TabsContainer from "@/components/patterns/TabsContainer";
import { Button } from "@/components/ui/button";
import { Wrench, CheckCircle, Calendar as CalendarIcon } from "lucide-react";

export default function Manutencoes() {
  const tabs = [
    {
      id: "pendentes",
      label: "Pendentes",
      content: (
        <div className="p-6 text-center text-muted-foreground">
          Lista de manutenções pendentes (implementar)
        </div>
      ),
    },
    {
      id: "execucao",
      label: "Em Execução",
      content: (
        <div className="p-6 text-center text-muted-foreground">
          Manutenções em execução (implementar)
        </div>
      ),
    },
    {
      id: "concluidas",
      label: "Concluídas",
      content: (
        <div className="p-6 text-center text-muted-foreground">
          Manutenções concluídas (implementar)
        </div>
      ),
    },
    {
      id: "calendario",
      label: "Calendário",
      content: (
        <div className="p-6 text-center text-muted-foreground">
          Calendário de manutenções (implementar)
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
    </div>
  );
}
