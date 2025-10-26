import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";

import "@/styles/fullcalendar-theme.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, CheckCircle2, FileDown, Loader2, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ======================= Tipos ======================= */
export type AgendaEvent = {
  id: string;
  evento_tipo: "manutencao" | "conformidade";
  titulo: string;
  start_date: string; // yyyy-mm-dd
  end_date: string | null;
  status: string;
  ativo_id: string | null;
  conformidade_item_id: string | null;
};

/* ======================= API helpers ======================= */
async function listAgendaEvents(fromISO?: string, toISO?: string): Promise<AgendaEvent[]> {
  let q = supabase.from("calendario_manutencoes").select("*");
  if (fromISO) q = q.gte("data_evento", fromISO);
  if (toISO) q = q.lte("data_evento", toISO);
  q = q.order("data_evento", { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  
  // Mapear para AgendaEvent
  const mapped = (data || []).map((d: any) => ({
    id: d.id ?? '',
    evento_tipo: 'manutencao' as const,
    titulo: d.titulo ?? '',
    start_date: d.data_evento ?? '',
    end_date: null,
    status: d.status_visual ?? '',
    ativo_id: d.ativo_id,
    conformidade_item_id: null,
  }));
  
  return mapped;
}

async function updateEventDate(ev: AgendaEvent, newDateISO: string) {
  if (ev.evento_tipo === "manutencao") {
    const { error } = await supabase.from("manutencoes").update({ vencimento: newDateISO }).eq("id", ev.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("conformidade_itens").update({ proximo: newDateISO }).eq("id", ev.id);
    if (error) throw error;
  }
}

async function quickConclude(ev: AgendaEvent) {
  if (ev.evento_tipo === "manutencao") {
    const { error } = await supabase
      .from("manutencoes")
      .update({ status: "concluida", executada_em: new Date().toISOString() })
      .eq("id", ev.id);
    if (error) throw error;
  } else {
    const { data: item, error: eFetch } = await supabase
      .from("conformidade_itens")
      .select("id, periodicidade, ultimo, proximo, status")
      .eq("id", ev.id)
      .single();
    if (eFetch) throw eFetch;

    const base = item?.proximo ?? new Date().toISOString().slice(0, 10);
    // Calcular próximo manualmente
    let nextDate: string | null = null;
    try {
      const d = new Date(base);
      const periodoDias = 30; // padrão mensal, ajustar conforme necessário
      d.setDate(d.getDate() + periodoDias);
      nextDate = d.toISOString().slice(0, 10);
    } catch {
      const d = new Date(base);
      d.setDate(d.getDate() + 30);
      nextDate = d.toISOString().slice(0, 10);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { error: eUp } = await supabase
      .from("conformidade_itens")
      .update({ status: "verde", ultimo: today, proximo: nextDate })
      .eq("id", ev.id);
    if (eUp) throw eUp;
  }
}

/* ======================= Util/Estilo ======================= */
function statusBadgeColor(status: string) {
  switch (status) {
    case "concluida":
    case "verde":
      return "bg-green-600";
    case "agendada":
    case "executando":
    case "amarelo":
      return "bg-yellow-600";
    case "cancelada":
    case "vermelho":
      return "bg-rose-600";
    default:
      return "bg-slate-600";
  }
}
const tipoBorder = (t: AgendaEvent["evento_tipo"]) => (t === "manutencao" ? "border-blue-500" : "border-emerald-500");

/* ======================= Filtros ======================= */
type TipoFiltro = "todos" | "manutencao" | "conformidade";
type StatusFiltro = "todos" | "abertos" | "concluidos" | "atrasados";

function aplicaFiltros(ev: AgendaEvent, tipo: TipoFiltro, status: StatusFiltro) {
  if (tipo !== "todos" && ev.evento_tipo !== tipo) return false;

  if (status === "todos") return true;

  if (status === "concluidos") {
    return ev.status === "concluida" || ev.status === "verde";
  }
  if (status === "abertos") {
    if (ev.evento_tipo === "manutencao") return ev.status !== "concluida" && ev.status !== "cancelada";
    return ev.status !== "verde";
  }
  if (status === "atrasados") {
    const today = new Date(new Date().toDateString());
    const evDate = new Date(ev.start_date + "T00:00:00");
    if (ev.evento_tipo === "manutencao") {
      return ev.status !== "concluida" && ev.status !== "cancelada" && evDate < today;
    } else {
      return ev.status === "vermelho";
    }
  }
  return true;
}

/* ======================= Componente ======================= */
export default function Agenda() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const calRef = useRef<FullCalendar | null>(null);
  const lastRangeRef = useRef<{ s: number; e: number } | null>(null);

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  const [selected, setSelected] = useState<AgendaEvent | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showAnexos, setShowAnexos] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);

  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todos");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [mostrarFds, setMostrarFds] = useState<boolean>(true);

  const initialDate = params.get("date") || undefined;

  async function fetchEvents(r?: { start: string; end: string }) {
    setLoading(true);
    try {
      const data = await listAgendaEvents(r?.start, r?.end);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  function onDatesSet(arg: { start: Date; end: Date; startStr: string; endStr: string }) {
    const s = arg.start.getTime();
    const e = arg.end.getTime();
    if (lastRangeRef.current && lastRangeRef.current.s === s && lastRangeRef.current.e === e) {
      return;
    }
    lastRangeRef.current = { s, e };

    const start = arg.startStr.slice(0, 10);
    const end = arg.endStr.slice(0, 10);
    setRange({ start, end });
    fetchEvents({ start, end });
  }

  async function loadExtrasForSelected(ev: AgendaEvent) {
    setShowLogs(false);
    setShowAnexos(false);
    if (ev.evento_tipo === "conformidade") {
      const { data: l } = await supabase
        .from("conformidade_logs")
        .select("id, acao, detalhes, created_at, usuario_id")
        .eq("item_id", ev.id)
        .order("created_at", { ascending: false });
      setLogs(l || []);

      const { data: a } = await supabase
        .from("conformidade_anexos")
        .select("id, file_path, created_at")
        .eq("item_id", ev.id)
        .order("created_at", { ascending: false });
      setAnexos(a || []);
    } else {
      setLogs([]);
      setAnexos([]);
    }
  }

  // === RENDER CUSTOM DE EVENTO USANDO DOM NODES (evita conflitos de CSS) ===
  function eventContent(arg: any) {
    const ev = arg.event.extendedProps as AgendaEvent;

    const pill = document.createElement("div");
    pill.className = `fc-pill ${tipoBorder(ev.evento_tipo)}`;

    const dot = document.createElement("span");
    dot.className = ev.evento_tipo === "manutencao" ? "fc-dot fc-dot-blue" : "fc-dot fc-dot-emerald";

    const text = document.createElement("span");
    text.className = "fc-pill-text";
    text.textContent = arg.event.title ?? "";

    pill.appendChild(dot);
    pill.appendChild(text);

    // Garante cor visível mesmo se algum reset global interferir
    pill.style.color = "var(--fc-text)";
    text.style.color = "var(--fc-text)";

    return { domNodes: [pill] };
  }

  function toCalendar(ev: AgendaEvent) {
    return {
      id: ev.id,
      title: ev.titulo,
      start: ev.start_date,
      end: ev.end_date ?? undefined,
      allDay: true,
      editable: true,
      classNames: ["px-1"],
      extendedProps: ev,
    } as any;
  }

  async function handleDrop(info: EventDropArg) {
    const ev = info.event.extendedProps as AgendaEvent;
    const newDate = info.event.startStr.slice(0, 10);
    try {
      await updateEventDate(ev, newDate);
    } catch (e) {
      info.revert();
      console.error(e);
    }
  }

  function handleEventClick(arg: EventClickArg) {
    const ev = arg.event.extendedProps as AgendaEvent;
    if (ev.ativo_id) {
      const url = `/ativos?ativo=${ev.ativo_id}&tab=historico&manut=${ev.id}`;
      window.open(url, "_self");
      return;
    }
    setSelected(ev);
    loadExtrasForSelected(ev);
  }

  const fcEvents = useMemo(() => {
    const arr = events.filter((ev) => aplicaFiltros(ev, tipoFiltro, statusFiltro));
    return arr.map(toCalendar);
  }, [events, tipoFiltro, statusFiltro]);

  const headerToolbar = useMemo(
    () => ({
      left: "prev,next today",
      center: "title",
      right: "timeGridDay,timeGridWeek,dayGridMonth,multiMonthYear,listWeek",
    }),
    []
  );

  const buttonText = useMemo(
    () => ({
      today: "Hoje",
      dayGridMonth: "Mês",
      timeGridWeek: "Semana",
      timeGridDay: "Dia",
      multiMonthYear: "Ano",
      listWeek: "Lista",
    }),
    []
  );

  return (
    <div className="space-y-4">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-xl font-bold">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => range && fetchEvents(range)}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const nl = "\r\n";
              const ics = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//Condomínio Boss//Agenda//PT-BR",
                ...events.map((ev) => {
                  const dt = ev.start_date.replace(/-/g, "");
                  const uid = `${ev.evento_tipo}-${ev.id}@condominioboss`;
                  return [
                    "BEGIN:VEVENT",
                    `UID:${uid}`,
                    `DTSTAMP:${dt}T000000Z`,
                    `DTSTART;VALUE=DATE:${dt}`,
                    `SUMMARY:${ev.titulo.replace(/\n/g, " ")}`,
                    `CATEGORIES:${ev.evento_tipo}`,
                    "END:VEVENT",
                  ].join(nl);
                }),
                "END:VCALENDAR",
              ].join(nl);

              const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "agenda-condominio.ics";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <FileDown className="h-4 w-4 mr-1" /> Exportar iCal
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="fc-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Aperte para refinar rapidamente a visualização.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-3">
          {/* Tipo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Tipo:</span>
            {[
              { k: "todos", label: "Todos" },
              { k: "manutencao", label: "Manutenção" },
              { k: "conformidade", label: "Conformidade" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTipoFiltro(t.k as TipoFiltro)}
                className={[
                  "text-xs px-2.5 py-1 rounded-full border transition",
                  tipoFiltro === t.k
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            {[
              { k: "todos", label: "Todos" },
              { k: "abertos", label: "Abertos" },
              { k: "concluidos", label: "Concluídos" },
              { k: "atrasados", label: "Atrasados" },
            ].map((s) => (
              <button
                key={s.k}
                onClick={() => setStatusFiltro(s.k as StatusFiltro)}
                className={[
                  "text-xs px-2.5 py-1 rounded-full border transition",
                  statusFiltro === s.k
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Opções */}
          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mostrarFds}
                onChange={(e) => setMostrarFds(e.target.checked)}
                className="accent-blue-600"
              />
              Mostrar fins de semana
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card className="fc-card">
        <CardHeader>
          <CardTitle className="text-base">Calendário</CardTitle>
          <CardDescription>Dia, Semana, Mês ou Ano — arraste para reagendar, clique para abrir histórico.</CardDescription>
        </CardHeader>
        <CardContent>
          <FullCalendar
            ref={calRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, multiMonthPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={initialDate}
            headerToolbar={headerToolbar}
            buttonText={buttonText}
            datesSet={onDatesSet}
            events={fcEvents}
            eventContent={eventContent}
            eventClick={handleEventClick}
            eventDrop={handleDrop}
            locale="pt-br"
            locales={[ptBrLocale]}
            firstDay={1}
            weekends={mostrarFds}
            nowIndicator
            stickyHeaderDates
            expandRows
            dayMaxEventRows={3}
            height="auto"
            slotDuration="00:30:00"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
            dayHeaderFormat={{ weekday: "short", day: "2-digit" }}
            weekNumbers={false}
            selectable={false}
            dragScroll
            progressiveEventRendering
          />
        </CardContent>
      </Card>

      {/* Modal (fallback quando não há ativo_id) */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.titulo}
              {selected && <Badge className={`${statusBadgeColor(selected.status)} ml-2`}>{selected.status}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {selected.evento_tipo === "manutencao" ? "Manutenção" : "Conformidade"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Data: </span>
                {selected.start_date}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={async () => {
                    await quickConclude(selected);
                    setSelected(null);
                    range && fetchEvents(range);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                </Button>

                {selected.ativo_id ? (
                  <Button
                    variant="outline"
                    onClick={() => nav(`/ativos?ativo=${selected.ativo_id}&tab=historico&manut=${selected.id}`)}
                  >
                    Abrir histórico do ativo
                  </Button>
                ) : null}

                {selected.evento_tipo === "conformidade" && (
                  <>
                    <Button variant="outline" onClick={() => setShowLogs((v) => !v)}>
                      Histórico
                    </Button>
                    <Button variant="outline" onClick={() => setShowAnexos((v) => !v)}>
                      Anexos
                    </Button>
                  </>
                )}
              </div>

              {showLogs && (
                <div className="mt-3 border rounded-md p-2 bg-muted/30">
                  <div className="text-sm font-medium mb-2">Histórico de Conformidade</div>
                  {logs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Sem registros.</div>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {logs.map((l) => (
                        <li key={l.id} className="flex items-start justify-between">
                          <span>
                            <span className="font-medium">{String(l.acao)}</span> —{" "}
                            {new Date(l.created_at).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {showAnexos && (
                <div className="mt-3 border rounded-md p-2 bg-muted/30">
                  <div className="text-sm font-medium mb-2">Anexos</div>
                  {anexos.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum anexo encontrado.</div>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {anexos.map((a) => (
                        <li key={a.id}>
                          <a className="underline" href={a.file_path} target="_blank" rel="noreferrer">
                            {a.file_path}
                          </a>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
