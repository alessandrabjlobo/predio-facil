import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { KPICards } from "@/components/patterns/KPICards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, Users, UserPlus, Settings, Download } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useUsuarios } from "@/hooks/useUsuarios";

export default function AdminMaster() {
  const [activeTab, setActiveTab] = useState("condominios");
  const { condominios, isLoading: condominiosLoading } = useCondominios();
  const { usuarios, isLoading: usuariosLoading } = useUsuarios();

  const kpis = [
    { label: "Total de Condomínios", value: condominios?.length || 0, icon: Building2 },
    { label: "Total de Usuários", value: usuarios?.length || 0, icon: Users },
    { label: "Síndicos Ativos", value: 0, icon: UserPlus },
    { label: "Conformidades Críticas", value: 0, icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Painel Administrativo"
        subtitle="Gerencie condomínios, síndicos, usuários e templates de manutenção"
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              Novo Condomínio
            </Button>
          </>
        }
      />

      <KPICards data={kpis} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="condominios">
            <Building2 className="h-4 w-4 mr-2" />
            Condomínios
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <UserPlus className="h-4 w-4 mr-2" />
            Síndicos & Usuários
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates de Manutenção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="condominios" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Conteúdo de Condomínios (implementar tabela com toolbar)
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Conteúdo de Usuários (implementar tabela com toolbar)
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Conteúdo de Templates (implementar versionamento)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
