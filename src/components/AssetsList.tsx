import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Droplets, Zap, Wind, Camera, Eye, Edit, Power, Search } from "lucide-react";
import { useAtivos } from "@/hooks/useAtivos";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AtivoDetalhes } from "./AtivoDetalhes";

const AssetsList = () => {
  const { ativos, isLoading, updateAtivo } = useAtivos();
  const { tipos } = useAtivoTipos();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterConformidade, setFilterConformidade] = useState<string>("todos");
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhesAtivoId, setDetalhesAtivoId] = useState<string>("");
  const [editandoAtivo, setEditandoAtivo] = useState<any | null>(null);
  const [formEdit, setFormEdit] = useState({
    nome: "",
    local: "",
    descricao: "",
    torre: "",
    andar: "",
    modelo: "",
    fabricante: "",
  });

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category) {
      case "Elevador": return <Building2 className={iconClass} />;
      case "Hidráulico": return <Droplets className={iconClass} />;
      case "Elétrico": return <Zap className={iconClass} />;
      case "Climatização": return <Wind className={iconClass} />;
      case "Segurança": return <Camera className={iconClass} />;
      default: return <Building2 className={iconClass} />;
    }
  };

  const handleEditAtivo = (ativo: any) => {
    setEditandoAtivo(ativo);
    setFormEdit({
      nome: ativo.nome || "",
      local: ativo.local || "",
      descricao: ativo.descricao || "",
      torre: ativo.torre || "",
      andar: ativo.andar || "",
      modelo: ativo.modelo || "",
      fabricante: ativo.fabricante || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editandoAtivo) return;
    
    try {
      await updateAtivo.mutateAsync({
        id: editandoAtivo.id,
        updates: formEdit,
      });
      setEditandoAtivo(null);
      toast({
        title: "Ativo atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o ativo.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAtivo = async (ativo: any) => {
    try {
      await updateAtivo.mutateAsync({
        id: ativo.id,
        updates: { is_ativo: !ativo.is_ativo },
      });
      toast({
        title: ativo.is_ativo ? "Ativo desativado" : "Ativo ativado",
        description: `O ativo foi ${ativo.is_ativo ? "desativado" : "ativado"} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do ativo.",
        variant: "destructive",
      });
    }
  };

  const filteredAtivos = ativos?.filter((ativo) => {
    const matchSearch = ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ativo.local?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "todos" || (ativo as any).tipo_id === filterTipo;
    const matchStatus = filterStatus === "todos" || 
                       (filterStatus === "ativo" && ativo.is_ativo) ||
                       (filterStatus === "inativo" && !ativo.is_ativo);
    const matchConformidade = filterConformidade === "todos" ||
                             (filterConformidade === "sim" && ativo.requer_conformidade) ||
                             (filterConformidade === "nao" && !ativo.requer_conformidade);
    
    return matchSearch && matchTipo && matchStatus && matchConformidade;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Ativos</h1>
          <p className="text-muted-foreground mt-1">Controle todos os ativos do condomínio</p>
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Ativos</h1>
        <p className="text-muted-foreground mt-1">
          Controle todos os ativos do condomínio - {filteredAtivos.length} ativo(s) encontrado(s)
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Ativo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tipos?.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conformidade NBR</Label>
              <Select value={filterConformidade} onValueChange={setFilterConformidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Requer conformidade</SelectItem>
                  <SelectItem value="nao">Não requer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Ativos */}
      {!ativos || ativos.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum ativo cadastrado ainda.</p>
        </Card>
      ) : filteredAtivos.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum ativo encontrado com os filtros aplicados.</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Ativo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">NBR 5674</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAtivos.map((ativo) => (
                    <TableRow key={ativo.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon((ativo as any).ativo_tipos?.nome || "Geral")}
                          <span>{ativo.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(ativo as any).ativo_tipos?.nome || "Sem categoria"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ativo.torre && <div>Torre: {ativo.torre}</div>}
                          {ativo.andar && <div>Andar: {ativo.andar}</div>}
                          {ativo.local && <div>{ativo.local}</div>}
                          {!ativo.torre && !ativo.andar && !ativo.local && (
                            <span className="text-muted-foreground">Não especificado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ativo.modelo && <div>{ativo.modelo}</div>}
                          {ativo.fabricante && <div className="text-muted-foreground">{ativo.fabricante}</div>}
                          {!ativo.modelo && !ativo.fabricante && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ativo.is_ativo ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                          {ativo.is_ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {ativo.requer_conformidade ? (
                          <Badge variant="secondary">Sim</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetalhesAtivoId(ativo.id);
                              setDetalhesOpen(true);
                            }}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAtivo(ativo)}
                            title="Editar ativo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(ativo)}
                            title={ativo.is_ativo ? "Desativar" : "Ativar"}
                          >
                            <Power className={`h-4 w-4 ${ativo.is_ativo ? "text-destructive" : "text-success"}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      {detalhesAtivoId && (
        <AtivoDetalhes
          ativoId={detalhesAtivoId}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
        />
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editandoAtivo} onOpenChange={(open) => !open && setEditandoAtivo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ativo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome do Ativo</Label>
              <Input
                id="edit-nome"
                value={formEdit.nome}
                onChange={(e) => setFormEdit({ ...formEdit, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-torre">Torre</Label>
                <Input
                  id="edit-torre"
                  value={formEdit.torre}
                  onChange={(e) => setFormEdit({ ...formEdit, torre: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-andar">Andar</Label>
                <Input
                  id="edit-andar"
                  value={formEdit.andar}
                  onChange={(e) => setFormEdit({ ...formEdit, andar: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-local">Local</Label>
              <Input
                id="edit-local"
                value={formEdit.local}
                onChange={(e) => setFormEdit({ ...formEdit, local: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-modelo">Modelo</Label>
                <Input
                  id="edit-modelo"
                  value={formEdit.modelo}
                  onChange={(e) => setFormEdit({ ...formEdit, modelo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fabricante">Fabricante</Label>
                <Input
                  id="edit-fabricante"
                  value={formEdit.fabricante}
                  onChange={(e) => setFormEdit({ ...formEdit, fabricante: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formEdit.descricao}
                onChange={(e) => setFormEdit({ ...formEdit, descricao: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoAtivo(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsList;
