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
import { Loader2, PlusCircle, Building2, Users, UserPlus, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AdminManutencoes } from "./admin/AdminManutencoes";
import { AdminSindicos } from "./admin/AdminSindicos";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { condominios, isLoading: condominiosLoading, createCondominio, assignSindico } = useCondominios();
  const { usuarios, isLoading: usuariosLoading } = useUsuarios();
  
  const [activeTab, setActiveTab] = useState("admin");
  const [openCondominio, setOpenCondominio] = useState(false);
  const [openSindico, setOpenSindico] = useState(false);
  const [condominioSelecionado, setCondominioSelecionado] = useState("");
  
  const [novoCondominio, setNovoCondominio] = useState({
    nome: "",
    endereco: "",
  });

  const [novoSindico, setNovoSindico] = useState({
    usuario_id: "",
    condominio_id: "",
  });

  useEffect(() => {
    console.log('[Admin Page] Auth state:', { user: !!user, role, authLoading, roleLoading });

    // 1) Se já sabemos que não há usuário, redireciona para login imediatamente
    if (!authLoading && !user) {
      console.log('[Admin Page] No user, redirecting to /auth');
      navigate('/auth');
      return;
    }

    // 2) Só decide sobre permissão depois que a role terminar de carregar
    if (!authLoading && !roleLoading) {
      if (role === 'admin') {
        console.log('[Admin Page] User is admin, staying on page');
      } else if (role !== null) {
        console.log('[Admin Page] User is not admin (role:', role, '), redirecting to /');
        navigate('/');
      } else {
        console.log('[Admin Page] Role ainda indefinida, aguardando...');
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

  if (!user || role !== "admin") {
    return null;
  }

  const handleCreateCondominio = async () => {
    if (!novoCondominio.nome) {
      return;
    }

    await createCondominio.mutateAsync(novoCondominio);
    setNovoCondominio({ nome: "", endereco: "" });
    setOpenCondominio(false);
  };

  const handleAssignSindico = async () => {
    if (!novoSindico.usuario_id || !novoSindico.condominio_id) {
      return;
    }

    await assignSindico.mutateAsync({
      usuario_id: novoSindico.usuario_id,
      condominio_id: novoSindico.condominio_id,
      is_principal: true,
    });
    
    setNovoSindico({ usuario_id: "", condominio_id: "" });
    setOpenSindico(false);
    setCondominioSelecionado("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie condomínios, síndicos, usuários e templates de manutenção
            </p>
          </div>

          <Tabs defaultValue="condominios" className="space-y-6">
            <TabsList>
              <TabsTrigger value="condominios">Condomínios</TabsTrigger>
              <TabsTrigger value="sindicos">
                <UserPlus className="h-4 w-4 mr-2" />
                Síndicos & Usuários
              </TabsTrigger>
              <TabsTrigger value="manutencoes">
                <Settings className="h-4 w-4 mr-2" />
                Templates de Manutenção
              </TabsTrigger>
            </TabsList>

            <TabsContent value="condominios" className="space-y-6">

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

          {/* Gestão de Condomínios */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Condomínios Cadastrados
                  </CardTitle>
                  <CardDescription>
                    Gerencie os condomínios do sistema
                  </CardDescription>
                </div>
                <Dialog open={openCondominio} onOpenChange={setOpenCondominio}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo Condomínio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Condomínio</DialogTitle>
                      <DialogDescription>
                        Preencha as informações do novo condomínio
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Condomínio *</Label>
                        <Input
                          id="nome"
                          value={novoCondominio.nome}
                          onChange={(e) => setNovoCondominio({ ...novoCondominio, nome: e.target.value })}
                          placeholder="Ex: Edifício Solar das Palmeiras"
                          maxLength={200}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Textarea
                          id="endereco"
                          value={novoCondominio.endereco}
                          onChange={(e) => setNovoCondominio({ ...novoCondominio, endereco: e.target.value })}
                          placeholder="Endereço completo"
                          maxLength={500}
                        />
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Atenção:</strong> Após criar o condomínio, ativos padrão serão automaticamente criados. 
                          Vincule um síndico na aba "Síndicos & Usuários".
                        </p>
                      </div>
                      <Button 
                        onClick={handleCreateCondominio} 
                        className="w-full"
                        disabled={createCondominio.isPending || !novoCondominio.nome}
                      >
                        {createCondominio.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cadastrar Condomínio
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {condominiosLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !condominios || condominios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum condomínio cadastrado ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {condominios.map((condominio) => (
                    <Card key={condominio.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{condominio.nome}</h3>
                          {condominio.endereco && (
                            <p className="text-sm text-muted-foreground">{condominio.endereco}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {Array.isArray(condominio.usuarios_condominios) && 
                              condominio.usuarios_condominios
                                .filter((uc: any) => uc.papel === "sindico")
                                .map((uc: any, index: number) => (
                                  <Badge key={uc.usuario_id || index} variant="secondary">
                                    <Users className="h-3 w-3 mr-1" />
                                    Síndico: {uc.usuarios?.nome || uc.usuarios?.email}
                                  </Badge>
                                ))
                            }
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setCondominioSelecionado(condominio.id);
                            setNovoSindico({ ...novoSindico, condominio_id: condominio.id });
                            setOpenSindico(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Designar Síndico
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog para designar síndico */}
          <Dialog open={openSindico} onOpenChange={setOpenSindico}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Designar Síndico</DialogTitle>
                <DialogDescription>
                  Selecione um usuário para ser síndico deste condomínio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário</Label>
                  <Select 
                    value={novoSindico.usuario_id} 
                    onValueChange={(value) => setNovoSindico({ ...novoSindico, usuario_id: value })}
                  >
                    <SelectTrigger id="usuario">
                      <SelectValue placeholder="Selecione o usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuariosLoading ? (
                        <div className="p-2">Carregando...</div>
                      ) : (
                        usuarios?.map((usuario) => (
                          <SelectItem key={usuario.id} value={usuario.id}>
                            {usuario.nome || usuario.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAssignSindico} 
                  className="w-full"
                  disabled={assignSindico.isPending || !novoSindico.usuario_id}
                >
                  {assignSindico.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Designar como Síndico
                </Button>
              </div>
            </DialogContent>
          </Dialog>
            </TabsContent>

            <TabsContent value="sindicos">
              <AdminSindicos />
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
