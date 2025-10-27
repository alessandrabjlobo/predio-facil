import { useState, useMemo } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useCondominios } from "@/hooks/useCondominios";
import { Users, UserPlus, Link as LinkIcon, Edit3, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function AdminUsuarios() {
  const { usuarios, isLoading, createUsuario, updateUsuario, deleteUsuario, assignRole, linkUsuarioCondominio, unlinkUsuarioCondominio } = useUsuarios();
  const { condominios } = useCondominios();

  const [search, setSearch] = useState("");
  const [openNewUser, setOpenNewUser] = useState(false);
  const [openEditUser, setOpenEditUser] = useState<any>(null);
  const [openRoleDialog, setOpenRoleDialog] = useState<any>(null);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);

  // Forms
  const [newUserForm, setNewUserForm] = useState({ nome: "", email: "", senha: "", isAdmin: false });
  const [linkForm, setLinkForm] = useState({ usuario_id: "", condominio_id: "", papel: "morador", is_principal: false });

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
    globalRole: newUserForm.isAdmin ? "admin" : undefined, // Atribuir role global apenas se for admin
  });
  
  setOpenNewUser(false);
  setNewUserForm({ nome: "", email: "", senha: "", isAdmin: false });
}


  async function handleAssignRole(userId: string, role: string) {
    await assignRole.mutateAsync({ user_id: userId, role });
    setOpenRoleDialog(null);
  }

  async function handleLinkUser(e: React.FormEvent) {
    e.preventDefault();
    await linkUsuarioCondominio.mutateAsync({
      usuario_id: linkForm.usuario_id,
      condominio_id: linkForm.condominio_id,
      papel: linkForm.papel as any,
      is_principal: linkForm.is_principal,
    });
    setOpenLinkDialog(false);
    setLinkForm({ usuario_id: "", condominio_id: "", papel: "morador", is_principal: false });
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Gerencie usuários, roles globais e vínculos com condomínios"
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
                  <th>Roles Globais</th>
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
                        <div className="flex gap-1 flex-wrap">
                          {(u.user_roles || []).map((r: any, i: number) => (
                            <Badge key={i} variant="secondary">{r.role}</Badge>
                          ))}
                          {(u.user_roles || []).length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </td>
                      <td className="text-xs">
                        {(u.usuarios_condominios || []).map((uc: any) => (
                          <div key={uc.condominio_id}>
                            {uc.condominios?.nome} ({uc.papel})
                          </div>
                        ))}
                        {(u.usuarios_condominios || []).length === 0 && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setOpenRoleDialog(u)}>
                            Atribuir Role
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setOpenEditUser(u)}>
                            <Edit3 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (!window.confirm("Excluir este usuário?")) return;
                              await deleteUsuario.mutateAsync(u.id);
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
                Use esta aba para criar vínculos entre usuários e condomínios, definindo papéis (síndico, zelador, morador, etc).
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
                value={newUserForm.senha}
                onChange={(e) => setNewUserForm({ ...newUserForm, senha: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={newUserForm.isAdmin}
                onCheckedChange={(checked) => setNewUserForm({ ...newUserForm, isAdmin: checked as boolean })}
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">
                Este usuário é Admin Master
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

      {/* MODAL: Atribuir Role */}
      <Dialog open={!!openRoleDialog} onOpenChange={() => setOpenRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Role Global</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Usuário: <strong>{openRoleDialog?.email}</strong></p>
            <div className="flex gap-2 flex-wrap">
              {["admin", "sindico", "funcionario", "zelador", "fornecedor"].map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant="outline"
                  onClick={() => handleAssignRole(openRoleDialog?.id, role)}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Vincular a Condomínio */}
      <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário a Condomínio</DialogTitle>
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
                  <SelectValue placeholder="Selecione..." />
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
                onValueChange={(v) => setLinkForm({ ...linkForm, papel: v })}
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
    </div>
  );
}
