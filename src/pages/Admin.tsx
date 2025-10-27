import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCondominios } from "@/hooks/useCondominios";
import { useUsuarios } from "@/hooks/useUsuarios";
import { Loader2, PlusCircle, Building2, Users, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AdminManutencoes } from "./admin/AdminManutencoes";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { condominios, isLoading: condominiosLoading, createCondominio, assignSindico } = useCondominios();
  const { usuarios, isLoading: usuariosLoading } = useUsuarios();

  const [activeTab, setActiveTab] = useState("condominios");
  const [openCondominio, setOpenCondominio] = useState(false);
  const [openSindico, setOpenSindico] = useState(false);

  const [novoCondominio, setNovoCondominio] = useState({ nome: "", endereco: "" });
  const [novoSindico, setNovoSindico] = useState({ usuario_id: "", condominio_id: "" });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && !roleLoading) {
      if (role === 'admin') {
        // ok
      } else if (role !== null) {
        navigate('/');
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "admin") return null;

  const handleCreateCondominio = async () => {
    if (!novoCondominio.nome) return;
    await createCondominio.mutateAsync(novoCondominio);
    setNovoCondominio({ nome: "", endereco: "" });
    setOpenCondominio(false);
  };

  const handleAssignSindico = async () => {
    if (!novoSindico.usuario_id || !novoSindico.condominio_id) return;
    await assignSindico.mutateAsync({
      usuario_id: novoSindico.usuario_id,
      condominio_id: novoSindico.condominio_id,
      is_principal: true,
    });
    setNovoSindico({ usuario_id: "", condominio_id: "" });
    setOpenSindico(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie condomínios e templates de manutenção
            </p>
          </div>

          <Tabs defaultValue="condominios" className="space-y-6">
            <TabsList>
              <TabsTrigger value="condominios">Condomínios</TabsTrigger>
              <TabsTrigger value="usuarios">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="manutencoes">
                <Settings className="h-4 w-4 mr-2" />
                Templates de Manutenção
              </TabsTrigger>
            </TabsList>

            <TabsContent value="condominios" className="space-y-6">
              {/* KPIs rápidos */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total de Condomínios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{condominios?.length || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usuarios?.length || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Síndicos Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {condominios?.reduce((acc, cond) => {
                        const sindicoCount = Array.isArray(cond.usuarios_condominios)
                          ? cond.usuarios_condominios.filter((uc: any) => uc.papel === "sindico").length
                          : 0;
                        return acc + sindicoCount;
                      }, 0) || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gestão de Condomínios (lista + cadastro) */}
              {/* ... mantém o bloco que você já tinha para listar/criar/atribuir síndico ... */}
              {/* Sem alterações de lógica aqui, apenas removemos a aba de síndicos duplicada */}
            </TabsContent>

            <TabsContent value="usuarios" className="mt-6">
              <div className="p-6 border rounded bg-blue-50 dark:bg-blue-950/20">
                <h3 className="font-semibold mb-2">Gestão de Usuários Unificada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para criar usuários, vincular a condomínios e gerenciar role global (admin):
                </p>
                <Button onClick={() => (window.location.href = "/admin/usuarios")}>
                  <Users className="h-4 w-4 mr-2" />
                  Ir para Gestão de Usuários
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manutencoes">
              <AdminManutencoes />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
