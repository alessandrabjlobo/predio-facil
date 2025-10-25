import { useState, useMemo } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EventoCalendario } from "@/hooks/useCalendarioManutencoes";
import { useConformidadeItens } from "@/hooks/useConformidadeItens";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, AlertTriangle, Calendar as CalendarIcon } from "lucide-react";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);

interface MaintenanceCalendarProps {
  eventos: EventoCalendario[];
}

interface CalendarEvent extends BigCalendarEvent {
  resource: EventoCalendario;
}

const MaintenanceCalendar = ({ eventos }: MaintenanceCalendarProps) => {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null);
  const { marcarComoExecutado } = useConformidadeItens();

  // Converter eventos para formato do calendário
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return eventos.map((evento) => ({
      title: evento.titulo,
      start: new Date(evento.data_evento),
      end: new Date(evento.data_evento),
      resource: evento,
    }));
  }, [eventos]);

  // Definir cores dos eventos baseado no status
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status_visual;
    let backgroundColor = "";
    
    switch (status) {
      case "executado":
        backgroundColor = "hsl(var(--success))";
        break;
      case "atrasado":
        backgroundColor = "hsl(var(--destructive))";
        break;
      case "iminente":
        backgroundColor = "hsl(var(--warning))";
        break;
      case "agendado":
        backgroundColor = "hsl(var(--primary))";
        break;
      default:
        backgroundColor = "hsl(var(--muted))";
    }

    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        display: "block",
      },
    };
  };

  const handleMarcarExecutado = async () => {
    if (!eventoSelecionado) return;

    try {
      // Aqui você precisaria buscar o conformidade_item_id relacionado ao plano
      // Por simplicidade, vou assumir que existe uma relação
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A marcação de execução será implementada em breve.",
      });
      setEventoSelecionado(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como executado.",
        variant: "destructive",
      });
    }
  };

  const messages = {
    allDay: "Dia inteiro",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Não há manutenções agendadas neste período.",
    showMore: (total: number) => `+ ${total} mais`,
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário de Manutenções
            </CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Executado
              </Badge>
              <Badge className="bg-warning text-warning-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Iminente
              </Badge>
              <Badge className="bg-destructive text-destructive-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Atrasado
              </Badge>
              <Badge className="bg-primary text-primary-foreground">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Agendado
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: "600px" }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => setEventoSelecionado(event.resource)}
              messages={messages}
              views={["month", "week", "day", "agenda"]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Evento */}
      <Dialog open={!!eventoSelecionado} onOpenChange={(open) => !open && setEventoSelecionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{eventoSelecionado?.titulo}</DialogTitle>
          </DialogHeader>
          {eventoSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ativo</p>
                  <p className="font-medium">{eventoSelecionado.ativo_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{eventoSelecionado.ativo_tipo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Agendada</p>
                  <p className="font-medium">
                    {new Date(eventoSelecionado.data_evento).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Periodicidade</p>
                  <p className="font-medium">{eventoSelecionado.periodicidade}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      eventoSelecionado.status_visual === "executado"
                        ? "default"
                        : eventoSelecionado.status_visual === "atrasado"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {eventoSelecionado.status_visual === "executado" && "Executado"}
                    {eventoSelecionado.status_visual === "atrasado" && "Atrasado"}
                    {eventoSelecionado.status_visual === "iminente" && "Iminente"}
                    {eventoSelecionado.status_visual === "agendado" && "Agendado"}
                  </Badge>
                </div>
                {eventoSelecionado.requer_conformidade && (
                  <div>
                    <p className="text-muted-foreground">Conformidade</p>
                    <Badge variant="outline">NBR 5674</Badge>
                  </div>
                )}
              </div>

              {eventoSelecionado.ultima_execucao && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Última Execução</p>
                  <p className="font-medium">
                    {new Date(eventoSelecionado.ultima_execucao).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventoSelecionado(null)}>
              Fechar
            </Button>
            {eventoSelecionado?.status_visual !== "executado" && (
              <Button onClick={handleMarcarExecutado}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Executado
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaintenanceCalendar;
