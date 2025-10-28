import { useState, useMemo } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useCondominios } from "@/hooks/useCondominios";
import { Users, UserPlus, Link as LinkIcon, Edit3, Trash2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type Papel = "admin" | "conselho" | "fornecedor" | "funcionario" | "morador" | "sindico" | "zelador";

export default function AdminUsuarios() {
  const {
    usuarios,
    isLoading,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    assignRole,
    removeRole,
    linkUsuarioCondominio,
    unlinkUsuarioCondominio,
  } = useUsuarios();

  const { condominios } = useCondominios();

  const [search, setSearch] = useState("");
  const [openNewUser, setOpenNewUser] = useState(false);
  const [openEditUser, setOpenEditUser] = useState<any>(null);
  const [openRoleDialog, setOpenRoleDialog] = useState<any>(null);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [openUnlinkDialog, setOpenUnlinkDialog] = useState<{ usuario_id: string; condominio_id: string } | null>(null);

  // Forms
  const [newUserForm, setNewUserForm] = useState({ nome: "", email: "", senha: "", isAdmin: false });
  const [linkForm, setLinkForm] = useState<{ usuario_id: string; condominio_id: string; papel: Papel; is_principal: boolean }>({
    usuario_id: "",
    condominio_id: "",
    papel: "morador",
    is_principal: false,
  });

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return usuarios || [];
    const q = search.toLowerCase();
    return (usuarios || []).filter((u: any) =>
      (u.nome || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [usuarios, search]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    await createUsuario.mutateAsync({
      email: newUserForm.email,
      password: newUserForm.senha,
      metadata: { nome: newUserForm.nome },
      globalRole: newUserForm.isAdmin ? "admin" : undefined,
    });
    setOpenNewUser(false);
    setNewUserForm({ nome: "", email: "", senha: "", isAdmin: false });
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!openEditUser?.id) return;
    await updateUsuario.mutateAsync({
      id: openEditUser.id,
      email: openEditUser.email,
      nome: openEditUser.nome,
      cpf: openEditUser.cpf || null,
    });
    setOpenEditUser(null);
  }

  async function handleAssignRole(userId: string, role: "admin") {
    await assignRole.mutateAsync({ user_id: userId, role });
    setOpenRoleDialog(null);
  }

  async function handleRemoveRole(userId: string, role: "admin") {
    await removeRole.mutateAsync({ user_id: userId, role });
  }

  async function handleLinkUser(e: React.FormEvent) {
    e.preventDefault();
    await linkUsuarioCondominio.mutateAsync({
      usuario_id: linkForm.usuario_id,
      condominio_id: linkForm.condominio_id,
      papel: linkForm.papel,
      is_principal: linkForm.is_principal,
    });
    setOpenLinkDialog(false);
    setLinkForm({ usuario_id: "", condominio_id: "", papel: "morador", is_principal: false });
  }

  async function handleUnlinkUser() {
    if (!openUnlinkDialog) return;
    await unlinkUsuarioCondominio.mutateAsync(openUnlinkDialog);
    setOpenUnlinkDialog(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Crie, vincule a condomínios e gerencie roles globais (apenas admin)."
        icon={Users}
        actions={
          <Button onClick={() => setOpenNewUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        }
      />

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="h-4 w-4 mr-2" />
            Todos os Usuários
          </TabsTrigger>
          <TabsTrigger value="vinculos">
            <LinkIcon className="h-4 w-4 mr-2" />
            Vínculos Condomínios
          </TabsTrigger>
        </TabsList>

        {/* ABA: USUÁRIOS */}
        <TabsContent value="usuarios" className="mt-6">
          <div className="mb-4">
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="[&>th]:p-3 text-left">
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Role Global</th>
                  <th>Condomínios</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
                ) : (
                  filteredUsers.map((u: any) => (
                    <tr key={u.id} className="border-t [&>td]:p-3">
                      <td>{u.nome || "—"}</td>
                      <td>{u.email}</td>
                      <td>
                        <div className="flex gap-2 items-center flex-wrap">
                          {(u.user_roles || [])
                            .filter((r: any) => r.role === "admin")
                            .map((r: any, i: number) => (
                              <Badge key={i} variant="secondary">{r.role}</Badge>
                            ))}
                          {(u.user_roles || []).filter((r: any) => r.role === "admin").length === 0 && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs">
                        {(u.usuarios_condominios || []).map((uc: any) => (
                          <div key={`${uc.condominio_id}-${uc.papel}`} className="flex items-center gap-2 mb-1">
                            <span>
                              {uc.condominios?.nome} ({uc.papel}
                              {uc.is_principal ? ", principal" : ""})
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Desvincular"
                              onClick={() => setOpenUnlinkDialog({ usuario_id: u.id, condominio_id: uc.condominio_id })}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {(u.usuarios_condominios || []).length === 0 && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {/* Role Global (apenas admin) */}
                          {!(u.user_roles || []).some((r: any) => r.role === "admin") ? (
                            <Button size="sm" variant="outline" onClick={() => setOpenRoleDialog(u)}>
                              Tornar Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveRole(u.id, "admin")}
                            >
                              Remover Admin
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setOpenEditUser({
                              id: u.id,
                              nome: u.nome || "",
                              email: u.email || "",
                              cpf: u.cpf || ""
                            })}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (!window.confirm(`Excluir usuário ${u.nome || u.email}? Esta ação não pode ser desfeita. Os vínculos com condomínios e OSs serão preservados (executante ficará como NULL).`)) return;
                              try {
                                await deleteUsuario.mutateAsync(u.id);
                                toast({ title: "Sucesso", description: "Usuário excluído com segurança." });
                              } catch (error: any) {
                                toast({ 
                                  title: "Erro ao excluir", 
                                  description: error.message,
                                  variant: "destructive" 
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ABA: VÍNCULOS */}
        <TabsContent value="vinculos" className="mt-6">
          <div className="space-y-4">
            <Button onClick={() => setOpenLinkDialog(true)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Vincular Usuário a Condomínio
            </Button>

            <div className="border rounded p-4">
              <p className="text-sm text-muted-foreground">
                Vincule usuários a condomínios e defina papéis (síndico, zelador, morador, etc).
                Use a tabela "Todos os Usuários" para visualizar e remover vínculos existentes.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: Novo Usuário */}
      <Dialog open={openNewUser} onOpenChange={setOpenNewUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário. A senha inicial pode ser alterada posteriormente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                required
                value={newUserForm.nome}
                onChange={(e) => setNewUserForm({ ...newUserForm, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={newUserForm.senha}
                onChange={(e) => setNewUserForm({ ...newUserForm, senha: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={newUserForm.isAdmin}
                onCheckedChange={(checked) => setNewUserForm({ ...newUserForm, isAdmin: checked as boolean })}
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">
                Tornar Admin Global
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenNewUser(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Editar Usuário */}
      <Dialog open={!!openEditUser} onOpenChange={() => setOpenEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário. O email pode ser alterado se necessário.
            </DialogDescription>
          </DialogHeader>
          {openEditUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  required
                  value={openEditUser.nome}
                  onChange={(e) => setOpenEditUser({ ...openEditUser, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={openEditUser.email}
                  onChange={(e) => setOpenEditUser({ ...openEditUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label>CPF (opcional)</Label>
                <Input
                  value={openEditUser.cpf}
                  onChange={(e) => setOpenEditUser({ ...openEditUser, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenEditUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Tornar Admin */}
      <Dialog open={!!openRoleDialog} onOpenChange={() => setOpenRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tornar Admin Global</DialogTitle>
            <DialogDescription>
              Conceda permissões de administrador global para este usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Usuário: <strong>{openRoleDialog?.email}</strong></p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => handleAssignRole(openRoleDialog?.id, "admin")}>
                Conceder Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Vincular a Condomínio */}
      <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário a Condomínio</DialogTitle>
            <DialogDescription>
              Selecione um usuário, condomínio e defina o papel (síndico, zelador, etc).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLinkUser} className="space-y-4">
            <div>
              <Label>Usuário</Label>
              <Select
                value={linkForm.usuario_id}
                onValueChange={(v) => setLinkForm({ ...linkForm, usuario_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(usuarios || []).map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Condomínio</Label>
              <Select
                value={linkForm.condominio_id}
                onValueChange={(v) => setLinkForm({ ...linkForm, condominio_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um condomínio..." />
                </SelectTrigger>
                <SelectContent>
                  {(condominios || []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Papel</Label>
              <Select
                value={linkForm.papel}
                onValueChange={(v: Papel) => setLinkForm({ ...linkForm, papel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sindico">Síndico</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="zelador">Zelador</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="morador">Morador</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrincipal"
                checked={linkForm.is_principal}
                onCheckedChange={(checked) => setLinkForm({ ...linkForm, is_principal: checked as boolean })}
              />
              <Label htmlFor="isPrincipal" className="cursor-pointer">
                Condomínio Principal
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenLinkDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Vincular</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Desvincular */}
      <Dialog open={!!openUnlinkDialog} onOpenChange={() => setOpenUnlinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover vínculo</DialogTitle>
            <DialogDescription>
              Confirma remover o vínculo deste usuário com o condomínio?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenUnlinkDialog(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleUnlinkUser}>
                Remover
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
