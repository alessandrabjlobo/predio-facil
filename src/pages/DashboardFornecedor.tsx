import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";

export default function DashboardFornecedor() {
  const [osEmAndamento, setOsEmAndamento] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
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

        // Buscar OSs em andamento (assumindo que fornecedor tem relação via executor_empresa ou similar)
        const { data: os } = await supabase
          .from("os")
          .select("*, ativos(nome)")
          .eq("tipo_executor", "fornecedor")
          .in("status", ["aberta", "em_execucao", "aguardando_aprovacao"])
          .order("data_prevista", { ascending: true })
          .limit(5);

        setOsEmAndamento(os || []);

        // Buscar funcionários da empresa (se houver tabela de fornecedores)
        // Por enquanto, placeholder
        setFuncionarios([]);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard do Fornecedor</h2>
        <p className="text-gray-600">Gerencie sua empresa e serviços</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios.length}</div>
            <p className="text-xs text-muted-foreground">Funcionários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OSs em Andamento</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{osEmAndamento.length}</div>
            <p className="text-xs text-muted-foreground">
              {osEmAndamento.filter(os => os.status === "aguardando_aprovacao").length} aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>OSs em Andamento</CardTitle>
            <CardDescription>Serviços sendo executados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : osEmAndamento.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma OS em andamento</p>
            ) : (
              <div className="space-y-3">
                {osEmAndamento.map((os) => (
                  <div key={os.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{os.titulo}</p>
                      <p className="text-xs text-gray-500">{os.ativos?.nome || "Sem ativo"}</p>
                      <p className="text-xs text-gray-400">
                        Prevista: {os.data_prevista ? new Date(os.data_prevista).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <Badge variant={
                      os.status === "em_execucao" ? "default" : 
                      os.status === "aguardando_aprovacao" ? "secondary" : 
                      "outline"
                    }>
                      {os.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minha Equipe</CardTitle>
            <CardDescription>Funcionários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : funcionarios.length === 0 ? (
              <p className="text-sm text-gray-500">Cadastre seus funcionários para gerenciar sua equipe</p>
            ) : (
              <div className="space-y-3">
                {funcionarios.map((func: any) => (
                  <div key={func.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{func.nome}</p>
                      <p className="text-xs text-gray-500">{func.email}</p>
                    </div>
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
