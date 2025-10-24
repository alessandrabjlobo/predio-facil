import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2, TrendingUp, DollarSign, Shield, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardAdmin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [condominioNome, setCondominioNome] = useState("Condomínio");
  const [stats, setStats] = useState({
    usuarios: 0,
    sindicos: 0,
    ativos: 0,
    gastos: "R$ 0",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario) return;

        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("condominio_id, condominios(nome)")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        if (relacao?.condominios) {
          setCondominioNome((relacao.condominios as any).nome);
        }

        // Buscar estatísticas
        const condoId = relacao?.condominio_id;
        if (condoId) {
          const [usuariosRes, ativosRes] = await Promise.all([
            supabase.from("usuarios_condominios").select("id", { count: "exact" }).eq("condominio_id", condoId),
            supabase.from("ativos").select("id", { count: "exact" }).eq("condominio_id", condoId),
          ]);

          setStats({
            usuarios: usuariosRes.count || 0,
            sindicos: 3,
            ativos: ativosRes.count || 0,
            gastos: "R$ 85.450",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="px-6 py-5 max-w-[1320px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Dashboard Administrativo
          </h2>
          <p className="text-muted-foreground text-sm">{condominioNome}</p>
        </div>
        <Button onClick={() => nav("/owner/condominios")} className="h-8">
          <Plus className="w-4 h-4 mr-2" />
          Gerenciar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.usuarios}</div>
            <p className="text-xs text-muted-foreground">Total cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Síndicos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.sindicos}</div>
            <p className="text-xs text-muted-foreground">Administradores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.ativos}</div>
            <p className="text-xs text-muted-foreground">Equipamentos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gastos}</div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gestão de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gestão de Usuários</CardTitle>
            <CardDescription>Usuários do condomínio por papel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Síndicos</p>
                  <p className="text-xs text-muted-foreground">Administradores principais</p>
                </div>
              </div>
              <Badge>3</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Funcionários</p>
                  <p className="text-xs text-muted-foreground">Equipe operacional</p>
                </div>
              </div>
              <Badge variant="secondary">8</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Fornecedores</p>
                  <p className="text-xs text-muted-foreground">Prestadores de serviço</p>
                </div>
              </div>
              <Badge variant="secondary">12</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Moradores</p>
                  <p className="text-xs text-muted-foreground">Residentes</p>
                </div>
              </div>
              <Badge variant="secondary">22</Badge>
            </div>

            <Button className="w-full mt-4" onClick={() => nav("/owner/condominios")}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Atividade Recente</CardTitle>
            <CardDescription>Últimas ações importantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">OS #123 alterada</p>
                <p className="text-xs text-muted-foreground">João Silva atualizou status para concluída</p>
                <p className="text-xs text-muted-foreground mt-1">há 2 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Novo chamado criado</p>
                <p className="text-xs text-muted-foreground">Maria Santos criou chamado #456</p>
                <p className="text-xs text-muted-foreground mt-1">há 5 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Backup executado</p>
                <p className="text-xs text-muted-foreground">Sistema executou backup automático</p>
                <p className="text-xs text-muted-foreground mt-1">ontem</p>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => nav("/relatorios")}>
              Ver todas as atividades
            </Button>
          </CardContent>
        </Card>

        {/* Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Relatórios</CardTitle>
            <CardDescription>Acesso rápido aos principais relatórios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => nav("/relatorios")}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório Financeiro
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => nav("/relatorios")}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório de Manutenções
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => nav("/relatorios")}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório de Chamados
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => nav("/conformidade")}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório de Conformidade
            </Button>
          </CardContent>
        </Card>

        {/* Conformidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status de Conformidade</CardTitle>
            <CardDescription>Situação atual do condomínio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status Geral</span>
              <Badge className="bg-green-600">OK</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Itens vencendo</span>
              <Badge variant="secondary">2 itens</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Atrasados</span>
              <Badge variant="outline">0 itens</Badge>
            </div>
            <Button className="w-full" onClick={() => nav("/conformidade")}>
              Ver detalhes da conformidade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
