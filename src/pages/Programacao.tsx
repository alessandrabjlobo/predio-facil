import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar as CalendarIcon, List, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ProgramacaoItem = {
  id: string;
  plano_id: string;
  ativo_id: string;
  data_prevista: string;
  status: string;
  os_id: string | null;
  planos_manutencao: {
    titulo: string;
  } | null;
  ativos: {
    nome: string;
    tipo_id: string;
  } | null;
};

const statusConfig = {
  programada: { label: "Programada", icon: CheckCircle2, color: "bg-green-500", variant: "default" as const },
  atrasada: { label: "Atrasada", icon: AlertCircle, color: "bg-red-500", variant: "destructive" as const },
  em_execucao: { label: "Em Execução", icon: Clock, color: "bg-blue-500", variant: "secondary" as const },
  concluida: { label: "Concluída", icon: CheckCircle2, color: "bg-gray-500", variant: "outline" as const },
  cancelada: { label: "Cancelada", icon: XCircle, color: "bg-gray-400", variant: "outline" as const },
};

export default function Programacao() {
  const navigate = useNavigate();
  const [programacao, setProgramacao] = useState<ProgramacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadProgramacao();
  }, [currentDate]);

  async function loadProgramacao() {
    try {
      setLoading(true);
      const { data: condominios } = await supabase
        .from("usuarios_condominios")
        .select("condominio_id")
        .limit(1)
        .single();

      if (!condominios) return;

      const inicio = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const fim = format(endOfMonth(addMonths(currentDate, 2)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from("programacao_manutencao")
        .select(`
          *,
          planos_manutencao(titulo),
          ativos(nome, tipo_id)
        `)
        .eq("condominio_id", condominios.condominio_id)
        .gte("data_prevista", inicio)
        .lte("data_prevista", fim)
        .order("data_prevista");

      if (error) throw error;
      setProgramacao(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar programação: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  }

  function getItemsForDate(date: Date) {
    return programacao.filter(item => 
      isSameDay(parseISO(item.data_prevista), date)
    );
  }

  function getStatusCounts(items: ProgramacaoItem[]) {
    return {
      atrasada: items.filter(i => i.status === 'atrasada').length,
      programada: items.filter(i => i.status === 'programada').length,
      em_execucao: items.filter(i => i.status === 'em_execucao').length,
    };
  }

  async function criarOS(item: ProgramacaoItem) {
    navigate('/os-novo', { state: { programacaoId: item.id } });
  }

  const days = getDaysInMonth(currentDate);
  const diasProximos7 = programacao.filter(item => {
    const diff = (new Date(item.data_prevista).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && item.status !== 'concluida';
  });
  const atrasadas = programacao.filter(item => item.status === 'atrasada');

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Programação de Manutenções</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie a programação de manutenções preventivas
          </p>
        </div>

        <Tabs defaultValue="calendario" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendario">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="lista">
              <List className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendario" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                      ← Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Hoje
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                      Próximo →
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Atrasada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm">Próximos 7 dias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Programada</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center font-semibold p-2 text-sm">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: days[0].getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  
                  {days.map(day => {
                    const items = getItemsForDate(day);
                    const counts = getStatusCounts(items);
                    const hasItems = items.length > 0;
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "min-h-[80px] p-2 rounded-lg border-2 transition-all hover:border-primary",
                          !isSameMonth(day, currentDate) && "opacity-50",
                          selectedDate && isSameDay(day, selectedDate) && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="text-sm font-semibold mb-1">
                          {format(day, 'd')}
                        </div>
                        {hasItems && (
                          <div className="space-y-1">
                            {counts.atrasada > 0 && (
                              <div className="text-xs bg-red-500 text-white rounded px-1 py-0.5">
                                {counts.atrasada} 🔴
                              </div>
                            )}
                            {counts.programada > 0 && (
                              <div className="text-xs bg-green-500 text-white rounded px-1 py-0.5">
                                {counts.programada} 🟢
                              </div>
                            )}
                            {counts.em_execucao > 0 && (
                              <div className="text-xs bg-blue-500 text-white rounded px-1 py-0.5">
                                {counts.em_execucao} 🔵
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Tarefas para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getItemsForDate(selectedDate).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma manutenção programada para esta data
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {getItemsForDate(selectedDate).map(item => (
                        <Card key={item.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {item.planos_manutencao?.titulo || 'Sem título'}
                                </CardTitle>
                                <CardDescription>
                                  {item.ativos?.nome || 'Ativo não identificado'}
                                </CardDescription>
                              </div>
                              <Badge variant={statusConfig[item.status as keyof typeof statusConfig]?.variant || "default"}>
                                {statusConfig[item.status as keyof typeof statusConfig]?.label || item.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex gap-2">
                              {!item.os_id && item.status !== 'concluida' && (
                                <Button size="sm" onClick={() => criarOS(item)}>
                                  Criar OS
                                </Button>
                              )}
                              {item.os_id && (
                                <Button size="sm" variant="outline" onClick={() => navigate(`/os/${item.os_id}`)}>
                                  Ver OS
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lista" className="space-y-4">
            {atrasadas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Atrasadas ({atrasadas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {atrasadas.map(item => (
                      <Card key={item.id} className="border-red-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                🔴 {format(parseISO(item.data_prevista), "dd/MM/yyyy")} - {item.planos_manutencao?.titulo}
                              </CardTitle>
                              <CardDescription>{item.ativos?.nome}</CardDescription>
                            </div>
                            <Badge variant="destructive">Atrasada</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button size="sm" onClick={() => criarOS(item)}>
                            Criar OS Urgente
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {diasProximos7.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    Próximos 7 Dias ({diasProximos7.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diasProximos7.map(item => (
                      <Card key={item.id} className="border-yellow-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                🟡 {format(parseISO(item.data_prevista), "dd/MM/yyyy")} - {item.planos_manutencao?.titulo}
                              </CardTitle>
                              <CardDescription>{item.ativos?.nome}</CardDescription>
                            </div>
                            <Badge variant="secondary">{item.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            {!item.os_id && (
                              <Button size="sm" onClick={() => criarOS(item)}>
                                Criar OS
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Todas as Programações</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-4">Carregando...</p>
                ) : programacao.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma manutenção programada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {programacao.map(item => (
                      <Card key={item.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {format(parseISO(item.data_prevista), "dd/MM/yyyy")} - {item.planos_manutencao?.titulo}
                              </CardTitle>
                              <CardDescription>{item.ativos?.nome}</CardDescription>
                            </div>
                            <Badge variant={statusConfig[item.status as keyof typeof statusConfig]?.variant || "default"}>
                              {statusConfig[item.status as keyof typeof statusConfig]?.label || item.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        {item.status !== 'concluida' && (
                          <CardContent className="pt-0">
                            <div className="flex gap-2">
                              {!item.os_id && (
                                <Button size="sm" onClick={() => criarOS(item)}>
                                  Criar OS
                                </Button>
                              )}
                              {item.os_id && (
                                <Button size="sm" variant="outline" onClick={() => navigate(`/os/${item.os_id}`)}>
                                  Ver OS
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
