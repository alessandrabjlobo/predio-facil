import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/patterns/PageHeader";
import TabsContainer from "@/components/patterns/TabsContainer";
import { Building2 } from "lucide-react";
import { MaintenanceKPIs } from "@/components/maintenance/MaintenanceKPIs";
import { AlertCenter } from "@/components/maintenance/AlertCenter";
import { AssetsTab } from "@/components/maintenance/AssetsTab";
import { PreventivePlansTab } from "@/components/maintenance/PreventivePlansTab";
import { WorkOrdersTab } from "@/components/maintenance/WorkOrdersTab";
import { AgendaTab } from "@/components/maintenance/AgendaTab";
import { ComplianceReportsTab } from "@/components/maintenance/ComplianceReportsTab";

export default function ManutencaoPredial() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'ativos';

  const tabs = [
    {
      id: "ativos",
      label: "Ativos",
      content: <AssetsTab />,
    },
    {
      id: "planos",
      label: "Planos Preventivos",
      content: <PreventivePlansTab />,
    },
    {
      id: "os",
      label: "Ordens de Serviço",
      content: <WorkOrdersTab />,
    },
    {
      id: "agenda",
      label: "Agenda",
      content: <AgendaTab />,
    },
    {
      id: "relatorios",
      label: "Relatórios de Conformidade",
      content: <ComplianceReportsTab />,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Manutenção Predial"
        subtitle="Gestão completa de manutenção preventiva conforme NBR 5674"
        icon={Building2}
      />

      {/* KPIs */}
      <MaintenanceKPIs />

      {/* Alert Center */}
      <AlertCenter />

      {/* Main Tabs */}
      <TabsContainer tabs={tabs} defaultTab={defaultTab} />
    </div>
  );
}
