// src/components/dashboard/MiniCalendar.tsx
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ymd, addDays, firstDayOfMonth, lastDayOfMonth, startOfWeekMon } from "@/lib/date";

type AgendaEvent = {
  id: string;
  evento_tipo: "manutencao" | "conformidade";
  titulo: string;
  start_date: string;
  end_date: string | null;
  status: string;
  ativo_id: string | null;
  conformidade_item_id: string | null;
};

type Props = { onOpenAgenda: (iso?: string) => void };

export default function MiniCalendar({ onOpenAgenda }: Props) {
  const [cursor, setCursor] = useState<Date>(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const monthStart = firstDayOfMonth(cursor);
  const monthEnd = lastDayOfMonth(cursor);
  const gridStart = startOfWeekMon(monthStart);
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      // Agenda events é uma view - usar calendario_manutencoes como fallback
      const { data, error } = await supabase
        .from("calendario_manutencoes")
        .select("*")
        .gte("data_evento", ymd(monthStart))
        .lte("data_evento", ymd(monthEnd))
        .order("data_evento", { ascending: true });
      if (error) setErr(error.message);
      
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
      
      setEvents(mapped);
      setLoading(false);
    })();
  }, [cursor]);

  const byDay = useMemo(() => {
    const m: Record<string, AgendaEvent[]> = {};
    for (const ev of events) (m[ymd(ev.start_date)] ||= []).push(ev);
    return m;
  }, [events]);

  function DotRow({ d }: { d: Date }) {
    const list = byDay[ymd(d)] || [];
    const manut = list.filter((e) => e.evento_tipo === "manutencao").length;
    const conf = list.filter((e) => e.evento_tipo === "conformidade").length;
    return (
      <div className="flex items-center gap-1 mt-1.5">
        {Array.from({ length: Math.min(manut, 3) }).map((_, i) => (
          <span key={`m${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
        ))}
        {Array.from({ length: Math.min(conf, 3) }).map((_, i) => (
          <span key={`c${i}`} className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
        ))}
        {list.length > 6 && <span className="text-[10px] text-slate-500 ml-1">+{list.length - 6}</span>}
      </div>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setCursor(new Date())}>Hoje</Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCursor(addDays(firstDayOfMonth(cursor), -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[150px] text-center text-sm font-medium">
              {cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </div>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCursor(addDays(lastDayOfMonth(cursor), 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-8" onClick={() => onOpenAgenda(ymd(cursor))}>
              <CalendarDays className="h-4 w-4 mr-1" /> Ver agenda
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {err ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">
            Falha ao carregar mini calendário: {err}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 text-[12px] text-slate-500 mb-1.5">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="px-2 py-1 text-center">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-[6px]">
              {cells.map((d) => {
                const iso = ymd(d);
                const isOut = d.getMonth() !== cursor.getMonth();
                const isToday = iso === ymd(new Date());
                return (
                  <button
                    key={iso}
                    onClick={() => onOpenAgenda(iso)}
                    className={[
                      "h-[74px] rounded-md border text-left px-2 py-1.5 transition",
                      isOut ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-white border-slate-200",
                      isToday ? "ring-1 ring-blue-500" : "hover:shadow-sm"
                    ].join(" ")}
                    title={iso}
                  >
                    <div className="text-[12px] font-medium">{d.getDate()}</div>
                    {loading ? (
                      <div className="mt-2 h-2 w-10 rounded bg-slate-100 animate-pulse" />
                    ) : (
                      <DotRow d={d} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Manutenção
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Conformidade
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
