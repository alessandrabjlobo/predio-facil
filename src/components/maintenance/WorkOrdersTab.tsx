import { useState } from "react";
import { useOrdemServico } from "@/hooks/useOrdemServico";
import OSKanban from "@/components/os/OSKanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OSList from "@/components/os/OSList";
import { LayoutGrid, List } from "lucide-react";

export function WorkOrdersTab() {
  const { ordens, isLoading } = useOrdemServico();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando ordens de serviço...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <OSKanban />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <OSList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
