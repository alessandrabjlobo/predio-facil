import { useState } from "react";
import { useAtivos } from "@/hooks/useAtivos";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, RefreshCw, Search, Edit, Eye, EyeOff, Filter, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const GerenciarAtivos = () => {
  const { ativos, isLoading, updateAtivo, createAtivo } = useAtivos();
  const { tipos } = useAtivoTipos();
  const { condominio } = useCondominioAtual();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [reinicializando, setReinicializando] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newAtivoDialogOpen, setNewAtivoDialogOpen] = useState(false);
  const [newAtivoForm, setNewAtivoForm] = useState({
    tipo_id: "",
    nome: "",
    local: "",
    torre: "",
    andar: "",
    descricao: "",
    fabricante: "",
    modelo: "",
    numero_serie: "",
    data_instalacao: "",
  });

  const handleReinicializarAtivos = async () => {
    if (!condominio?.id) {
      toast({
        title: "Erro",
        description: "Condomínio não identificado",
        variant: "destructive",
      });
      return;
    }

    setReinicializando(true);
    try {
      const { error } = await supabase.rpc('inicializar_ativos_padrao', {
        p_condominio_id: condominio.id
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ativos padrão foram reinicializados! Recarregando...",
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao reinicializar ativos: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setReinicializando(false);
    }
  };

  const handleToggleAtivo = async (ativoId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      await updateAtivo.mutateAsync({
        id: ativoId,
        updates: { is_ativo: !currentStatus }
      });

      await supabase.from("ativo_status_logs").insert({
        ativo_id: ativoId,
        usuario_id: usuario.id,
        acao: !currentStatus ? "ativado" : "desativado",
        observacao: `Ativo ${!currentStatus ? "ativado" : "desativado"} via gestão`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditAtivo = (ativo: any) => {
    setEditingAtivo(ativo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAtivo) return;

    try {
      await updateAtivo.mutateAsync({
        id: editingAtivo.id,
        updates: {
          nome: editingAtivo.nome,
          local: editingAtivo.local,
          descricao: editingAtivo.descricao,
          torre: editingAtivo.torre,
          andar: editingAtivo.andar,
        }
      });

      setEditDialogOpen(false);
      setEditingAtivo(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateAtivo = async () => {
    if (!newAtivoForm.tipo_id || !newAtivoForm.nome) {
      toast({
        title: "Erro",
        description: "Tipo e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const tipo = tipos?.find(t => t.id === newAtivoForm.tipo_id);
    if (!tipo) return;

    try {
      await createAtivo.mutateAsync({
        tipo_id: newAtivoForm.tipo_id,
        nome: newAtivoForm.nome,
        local: newAtivoForm.local || undefined,
        torre: newAtivoForm.torre || undefined,
        andar: newAtivoForm.andar || undefined,
        descricao: newAtivoForm.descricao || undefined,
        fabricante: newAtivoForm.fabricante || undefined,
        modelo: newAtivoForm.modelo || undefined,
        numero_serie: newAtivoForm.numero_serie || undefined,
        data_instalacao: newAtivoForm.data_instalacao || undefined,
        requer_conformidade: tipo.is_conformidade || false,
      });

      setNewAtivoDialogOpen(false);
      setNewAtivoForm({
        tipo_id: "",
        nome: "",
        local: "",
        torre: "",
        andar: "",
        descricao: "",
        fabricante: "",
        modelo: "",
        numero_serie: "",
        data_instalacao: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filtros
  const filteredAtivos = ativos?.filter((ativo) => {
    const matchesSearch = ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ativo.local?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "all" || ativo.tipo_id === filterTipo;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && ativo.is_ativo) ||
                         (filterStatus === "inactive" && !ativo.is_ativo);
    
    return matchesSearch && matchesTipo && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Ativos</CardTitle>
          <CardDescription>Carregando ativos...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestão de Ativos
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReinicializarAtivos} disabled={reinicializando}>
                <RefreshCw className={`h-4 w-4 mr-2 ${reinicializando ? 'animate-spin' : ''}`} />
                Reinicializar Padrão
              </Button>
              <Button onClick={() => setNewAtivoDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ativo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tipos?.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Torre/Andar</TableHead>
                  <TableHead>Conformidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum ativo encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAtivos.map((ativo) => (
                    <TableRow key={ativo.id} className={!ativo.is_ativo ? "opacity-50" : ""}>
                      <TableCell>
                        <Switch
                          checked={ativo.is_ativo}
                          onCheckedChange={() => handleToggleAtivo(ativo.id, ativo.is_ativo)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {ativo.nome}
                        {!ativo.is_ativo && (
                          <span className="ml-2 text-xs text-muted-foreground">(oculto)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ativo.ativo_tipos?.nome || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ativo.local || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[ativo.torre, ativo.andar].filter(Boolean).join(" / ") || "-"}
                      </TableCell>
                      <TableCell>
                        {ativo.requer_conformidade ? (
                          <Badge variant="default" className="text-xs">Obrigatória</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Não requerida</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAtivo(ativo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(ativo.id, ativo.is_ativo)}
                          >
                            {ativo.is_ativo ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Legenda */}
          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Mostrar ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              <span>Ocultar ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>Editar informações</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ativo</DialogTitle>
            <DialogDescription>
              Atualize as informações do ativo
            </DialogDescription>
          </DialogHeader>
          {editingAtivo && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingAtivo.nome}
                  onChange={(e) => setEditingAtivo({ ...editingAtivo, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Local</Label>
                <Input
                  value={editingAtivo.local || ""}
                  onChange={(e) => setEditingAtivo({ ...editingAtivo, local: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Torre</Label>
                  <Input
                    value={editingAtivo.torre || ""}
                    onChange={(e) => setEditingAtivo({ ...editingAtivo, torre: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Andar</Label>
                  <Input
                    value={editingAtivo.andar || ""}
                    onChange={(e) => setEditingAtivo({ ...editingAtivo, andar: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={editingAtivo.descricao || ""}
                  onChange={(e) => setEditingAtivo({ ...editingAtivo, descricao: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Novo Ativo */}
      <Dialog open={newAtivoDialogOpen} onOpenChange={setNewAtivoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Ativo</DialogTitle>
            <DialogDescription>
              Preencha as informações do ativo. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tipo de Ativo *</Label>
                <Select value={newAtivoForm.tipo_id} onValueChange={(value) => setNewAtivoForm({ ...newAtivoForm, tipo_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos?.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                        {tipo.is_conformidade && (
                          <Badge variant="secondary" className="ml-2 text-xs">NBR 5674</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newAtivoForm.tipo_id && tipos?.find(t => t.id === newAtivoForm.tipo_id)?.is_conformidade && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Este tipo de ativo requer conformidade legal. Planos de manutenção serão criados automaticamente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="col-span-2">
                <Label>Nome do Ativo *</Label>
                <Input
                  value={newAtivoForm.nome}
                  onChange={(e) => setNewAtivoForm({ ...newAtivoForm, nome: e.target.value })}
                  placeholder="Ex: Elevador Social 1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-sm">Localização</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Torre/Bloco</Label>
                  <Input
                    value={newAtivoForm.torre}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, torre: e.target.value })}
                    placeholder="Ex: Torre 1"
                  />
                </div>
                <div>
                  <Label>Andar</Label>
                  <Input
                    value={newAtivoForm.andar}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, andar: e.target.value })}
                    placeholder="Ex: Térreo"
                  />
                </div>
                <div>
                  <Label>Local</Label>
                  <Input
                    value={newAtivoForm.local}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, local: e.target.value })}
                    placeholder="Ex: Hall"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-sm">Especificações Técnicas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fabricante</Label>
                  <Input
                    value={newAtivoForm.fabricante}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, fabricante: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={newAtivoForm.modelo}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, modelo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Número de Série</Label>
                  <Input
                    value={newAtivoForm.numero_serie}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, numero_serie: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data de Instalação</Label>
                  <Input
                    type="date"
                    value={newAtivoForm.data_instalacao}
                    onChange={(e) => setNewAtivoForm({ ...newAtivoForm, data_instalacao: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label>Descrição</Label>
              <Textarea
                value={newAtivoForm.descricao}
                onChange={(e) => setNewAtivoForm({ ...newAtivoForm, descricao: e.target.value })}
                placeholder="Informações adicionais sobre o ativo"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setNewAtivoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAtivo} disabled={createAtivo.isPending}>
                {createAtivo.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Cadastrar Ativo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
