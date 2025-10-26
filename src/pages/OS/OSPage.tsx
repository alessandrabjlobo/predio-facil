// FILE: src/pages/OS/OSPage.tsx
import { useRef } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import TabsContainer from "@/components/patterns/TabsContainer";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download, ClipboardList } from "lucide-react";
import OSList, { OSListHandle } from "@/components/os/OSList";
import OSKanban from "@/components/os/OSKanban";

export default function OSPage() {
  const listRef = useRef<OSListHandle | null>(null);

  const tabs = [
    {
      id: "lista",
      label: "Lista",
      content: (
        <div className="p-0">
          <OSList ref={listRef} />
        </div>
      ),
    },
    {
      id: "kanban",
      label: "Kanban",
      content: (
        <div className="p-0">
          <OSKanban />
        </div>
      ),
    },
    {
      id: "calendario",
      label: "Calendário",
      content: (
        <div className="p-6 text-center text-muted-foreground">
          Calendário de OS (implementar)
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Gerencie e acompanhe todas as ordens de serviço"
        actions={
          <>
            <Button variant="outline" onClick={() => listRef.current?.exportarCSV?.()}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => listRef.current?.abrirCriar?.()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </>
        }
        icon={ClipboardList}
      />
      <TabsContainer tabs={tabs} />
    </div>
  );
}
