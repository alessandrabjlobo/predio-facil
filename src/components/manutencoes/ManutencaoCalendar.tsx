import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useManutencoes } from "@/hooks/useManutencoes";
import { Card } from "@/components/ui/card";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function ManutencaoCalendar() {
  const { data: manutencoes, isLoading } = useManutencoes({});

  const events = (manutencoes || [])
    .filter((m: any) => m.vencimento)
    .map((m: any) => ({
      id: m.id,
      title: `${m.titulo} - ${m.ativos?.nome || ""}`,
      start: new Date(m.vencimento),
      end: new Date(m.vencimento),
      resource: m,
    }));

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status;
    const colors: Record<string, string> = {
      pendente: "#f59e0b",
      em_execucao: "#3b82f6",
      concluida: "#10b981",
      cancelada: "#ef4444",
    };

    return {
      style: {
        backgroundColor: colors[status] || "#64748b",
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Carregando calendário...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="pt-BR"
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período.",
          }}
        />
      </div>
    </Card>
  );
}
