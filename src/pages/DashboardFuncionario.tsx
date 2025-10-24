import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Wrench, Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function DashboardFuncionario() {
  const [osAtribuidas, setOsAtribuidas] = useState<any[]>([]);
  const [chamados, setChamados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario) return;

        // Buscar OSs atribuídas
        const { data: os } = await supabase
          .from("os")
          .select("*, ativos(nome)")
          .eq("executante_id", usuario.id)
          .in("status", ["aberta", "em_execucao"])
          .order("data_prevista", { ascending: true })
          .limit(5);

        setOsAtribuidas(os || []);

        // Buscar chamados em andamento
        const { data: chamadosData } = await supabase
          .from("chamados")
          .select("*")
          .eq("criado_por", usuario.id)
          .in("status", ["aberto", "em_andamento"])
          .order("created_at", { ascending: false })
          .limit(5);

        setChamados(chamadosData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard do Funcionário</h2>
        <p className="text-gray-600">Suas tarefas e atividades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OSs Atribuídas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{osAtribuidas.length}</div>
            <p className="text-xs text-muted-foreground">
              {osAtribuidas.filter(os => os.status === "em_execucao").length} em execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chamados.length}</div>
            <p className="text-xs text-muted-foreground">
              {chamados.filter(c => c.prioridade === "alta").length} alta prioridade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>OSs Atribuídas</CardTitle>
            <CardDescription>Ordens de serviço para você executar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : osAtribuidas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma OS atribuída no momento</p>
            ) : (
              <div className="space-y-3">
                {osAtribuidas.map((os) => (
                  <div key={os.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{os.titulo}</p>
                      <p className="text-xs text-gray-500">{os.ativos?.nome || "Sem ativo"}</p>
                      <p className="text-xs text-gray-400">
                        Prevista: {os.data_prevista ? new Date(os.data_prevista).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <Badge variant={os.status === "em_execucao" ? "default" : "secondary"}>
                      {os.status === "em_execucao" ? "Em execução" : "Aberta"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chamados Recentes</CardTitle>
            <CardDescription>Chamados abertos por você</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : chamados.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum chamado aberto</p>
            ) : (
              <div className="space-y-3">
                {chamados.map((chamado) => (
                  <div key={chamado.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{chamado.titulo}</p>
                      <p className="text-xs text-gray-500">{chamado.categoria || "Sem categoria"}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(chamado.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={chamado.prioridade === "alta" ? "destructive" : "secondary"}>
                      {chamado.prioridade}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
