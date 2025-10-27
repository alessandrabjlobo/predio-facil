import { ManutencaoCalendar } from "@/components/manutencoes/ManutencaoCalendar";

export function AgendaTab() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Visualize todas as manutenções programadas, em execução e concluídas em formato de calendário.
        Eventos são coloridos por status para facilitar a identificação.
      </div>
      <ManutencaoCalendar />
    </div>
  );
}
