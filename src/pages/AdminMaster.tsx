import { useMemo, useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { KPICards } from "@/components/patterns/KPICards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  UserPlus,
  Settings,
  Download,
  PlusCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useUsuarios } from "@/hooks/useUsuarios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function Empty({ text }: { text: string }) {
  return (
    <div className="p-6 text-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}

type CondoForm = {
  id?: string;
  nome: string;
  endereco?: string;
  unidades?: string;
  cnpj?: string;
  cidade?: string;
  uf?: string;
  sindico_id?: string;
};

export default function AdminMaster() {
  const [activeTab, setActiveTab] = useState("condominios");

  const {
    condominios,
    isLoading: condominiosLoading,
    createCondominio,
    updateCondominio,
    deleteCondominio,
    assignSindico,
  } = useCondominios();

  const {
    usuarios,
    isLoading: usuariosLoading,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  } = useUsuarios();

  const totalCondominios = condominios?.length || 0;
  const totalUsuarios = usuarios?.length || 0;
  const totalSindicos = (usuarios || []).filter(
    (u: any) => String(u.papel || "").toLowerCase() === "sindico"
  ).length;

  const kpis = [
    { label: "Condomínios", value: totalCondominios, icon: Building2 },
    { label: "Usuários", value: totalUsuarios, icon: Users },
    { label: "Síndicos", value: totalSindicos, icon: UserPlus },
  ];

  const [qConds, setQConds] = useState("");
  const [qUsers, setQUsers] = useState("");

  const condsFiltered = useMemo(() => {
    const t = qConds.trim().toLowerCase();
    if (!t) return condominios || [];
    return (condominios || []).filter((c: any) => {
      const nome = (c.nome ?? "").toLowerCase();
      const end = (c.endereco ?? "").toLowerCase();
      const id = (c.id ?? "").toLowerCase();
      return nome.includes(t) || end.includes(t) || id.includes(t);
    });
  }, [condominios, qConds]);

  const usersFiltered = useMemo(() => {
    const t = qUsers.trim().toLowerCase();
    if (!t) return usuarios || [];
    return (usuarios || []).filter((u: any) => {
      const nome = (u.nome ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const papel = (u.papel ?? "").toLowerCase();
      return nome.includes(t) || email.includes(t) || papel.includes(t);
    });
  }, [usuarios, qUsers]);

  const [openNewCondo, setOpenNewCondo] = useState(false);
  const [openEditCondo, setOpenEditCondo] = useState<CondoForm | null>(null);
  const [openEditUser, setOpenEditUser] = useState<any | null>(null);
  const [openNewUser, setOpenNewUser] = useState(false);

  const [condoForm, setCondoForm] = useState<CondoForm>({
    nome: "",
    endereco: "",
    unidades: "",
    cnpj: "",
    cidade: "",
    uf: "",
    sindico_id: "",
  });

  const [userForm, setUserForm] = useState<{ nome: string; email: string; papel: string }>({
    nome: "",
    email: "",
    papel: "sindico",
  });

  function resetCondoForm() {
    setCondoForm({
      nome: "",
      endereco: "",
      unidades: "",
      cnpj: "",
      cidade: "",
      uf: "",
      sindico_id: "",
    });
  }

  function resetUserForm() {
    setUserForm({ nome: "", email: "", papel: "sindico" });
  }

  async function handleCreateCondo(e: React.FormEvent) {
    e.preventDefault();
    if (!condoForm.nome.trim()) return;

    const payload = {
      nome: condoForm.nome.trim(),
      endereco: condoForm.endereco?.trim() || null,
      unidades: condoForm.unidades ? Number(condoForm.unidades) : null,
      cnpj: condoForm.cnpj?.trim() || null,
      cidade: condoForm.cidade?.trim() || null,
      uf: condoForm.uf?.trim() || null,
    };

    const created: any = await createCondominio.mutateAsync(payload);

    if (condoForm.sindico_id) {
      try {
        await assignSindico.mutateAsync({
          usuario_id: condoForm.sindico_id,
          condominio_id: created.id,
          is_principal: true,
        });
      } catch {}
    }

    setOpenNewCondo(false);
    resetCondoForm();
  }

  async function handleUpdateCondo(e: React.FormEvent) {
    e.preventDefault();
    if (!openEditCondo?.id || !openEditCondo.nome.trim()) return;

    await updateCondominio.mutateAsync({
      id: openEditCondo.id,
      patch: {
        nome: openEditCondo.nome.trim(),
        endereco: openEditCondo.endereco?.trim() || null,
        unidades: openEditCondo.unidades ? Number(openEditCondo.unidades) : null,
        cnpj: openEditCondo.cnpj?.trim() || null,
      },
    });

    setOpenEditCondo(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.email.trim()) return;
    await createUsuario.mutateAsync({
      email: userForm.email.trim(),
      password: "123456",
      metadata: { nome: userForm.nome || userForm.email.split("@")[0] },
    });
    setOpenNewUser(false);
    resetUserForm();
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Painel Administrativo"
        subtitle="Visão executiva do produto. Cadastre condomínios e usuários; configuração detalhada fica na página de Configurações."
        actions={
          <>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Download className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setOpenNewCondo(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Condomínio
            </Button>
          </>
        }
      />

      <KPICards data={kpis} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="condominios">
            <Building2 className="h-4 w-4 mr-2" />
            Condomínios
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates de Manutenção
          </TabsTrigger>
        </TabsList>

        {/* CONDOMÍNIOS */}
        <TabsContent value="condominios" className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder="Buscar condomínio (nome/endereço/id)…"
              value={qConds}
              onChange={(e) => setQConds(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={() => setQConds("")}>
              Limpar
            </Button>
          </div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="[&>th]:p-2 text-left">
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Unidades</th>
                  <th>Síndico(s)</th>
                  <th>ID</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {condominiosLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <Empty text="Carregando…" />
                    </td>
                  </tr>
                ) : condsFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Empty text="Nenhum condomínio encontrado." />
                    </td>
                  </tr>
                ) : (
                  condsFiltered.map((c: any) => (
                    <tr key={c.id} className="border-t [&>td]:p-2 align-middle">
                      <td>
                        <a
                          className="text-primary hover:underline"
                          href={`/condominios/${c.id}`}
                        >
                          {c.nome ?? "—"}
                        </a>
                      </td>
                      <td>{c.endereco ?? "—"}</td>
                      <td>{c.unidades ?? "—"}</td>
                      <td className="text-xs">
                        {(c.usuarios_condominios ?? [])
                          .filter(
                            (uc: any) =>
                              String(uc.papel || "").toLowerCase() === "sindico"
                          )
                          .map(
                            (uc: any) =>
                              uc.usuarios?.nome || uc.usuarios?.email || "—"
                          )
                          .join(", ") || "—"}
                      </td>
                      <td className="text-xs text-muted-foreground">{c.id}</td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setOpenEditCondo({
                                id: c.id,
                                nome: c.nome ?? "",
                                endereco: c.endereco ?? "",
                                unidades: c.unidades ?? "",
                                cnpj: c.cnpj ?? "",
                                cidade: c.cidade ?? "",
                                uf: c.uf ?? "",
                              })
                            }
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const ok = window.confirm(
                                "Excluir este condomínio? Essa ação não pode ser desfeita."
                              );
                              if (!ok) return;
                              await deleteCondominio.mutateAsync(c.id);
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

        {/* USUÁRIOS */}
        <TabsContent value="usuarios" className="mt-6">
          <div className="p-6 border rounded bg-blue-50 dark:bg-blue-950/20">
            <h3 className="font-semibold mb-2">Gestão Completa de Usuários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para gerenciar usuários, atribuir roles globais e vincular a condomínios, acesse:
            </p>
            <Button onClick={() => (window.location.href = "/admin/usuarios")}>
              <Users className="h-4 w-4 mr-2" />
              Ir para Gestão de Usuários
            </Button>
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-6">
          <div className="p-6 border rounded">
            <p className="text-sm text-muted-foreground">
              A edição de templates está em{" "}
              <strong>Configurações → Templates de Manutenção</strong>.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: Novo Condomínio */}
      <Dialog open={openNewCondo} onOpenChange={setOpenNewCondo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Condomínio</DialogTitle>
            <DialogDescription>
              Preencha os dados do condomínio e, opcionalmente, selecione um síndico já cadastrado.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={handleCreateCondo}>
            <div>
              <Label>Nome *</Label>
              <Input
                required
                value={condoForm.nome}
                onChange={(e) =>
                  setCondoForm((s) => ({ ...s, nome: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                value={condoForm.endereco}
                onChange={(e) =>
                  setCondoForm((s) => ({ ...s, endereco: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unidades</Label>
                <Input
                  type="number"
                  min={0}
                  value={condoForm.unidades}
                  onChange={(e) =>
                    setCondoForm((s) => ({ ...s, unidades: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={condoForm.cnpj}
                  onChange={(e) =>
                    setCondoForm((s) => ({ ...s, cnpj: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={condoForm.cidade}
                  onChange={(e) =>
                    setCondoForm((s) => ({ ...s, cidade: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  value={condoForm.uf}
                  onChange={(e) =>
                    setCondoForm((s) => ({
                      ...s,
                      uf: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Síndico (já cadastrado)</Label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={condoForm.sindico_id}
                onChange={(e) =>
                  setCondoForm((s) => ({ ...s, sindico_id: e.target.value }))
                }
              >
                <option value="">— selecionar —</option>
                {(usuarios || []).map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.nome || u.email} {u.papel ? `(${u.papel})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenNewCondo(false);
                  resetCondoForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createCondominio.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Editar Condomínio */}
      <Dialog open={!!openEditCondo} onOpenChange={(v) => !v && setOpenEditCondo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Condomínio</DialogTitle>
            <DialogDescription>
              Atualize os dados do condomínio conforme necessário.
            </DialogDescription>
          </DialogHeader>

          {openEditCondo && (
            <form className="grid gap-3" onSubmit={handleUpdateCondo}>
              <div>
                <Label>Nome *</Label>
                <Input
                  required
                  value={openEditCondo.nome}
                  onChange={(e) =>
                    setOpenEditCondo((s) => s && ({ ...s, nome: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Endereço</Label>
                <Input
                  value={openEditCondo.endereco}
                  onChange={(e) =>
                    setOpenEditCondo((s) => s && ({ ...s, endereco: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Unidades</Label>
                  <Input
                    type="number"
                    min={0}
                    value={openEditCondo.unidades}
                    onChange={(e) =>
                      setOpenEditCondo((s) => s && ({ ...s, unidades: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={openEditCondo.cnpj}
                    onChange={(e) =>
                      setOpenEditCondo((s) => s && ({ ...s, cnpj: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={openEditCondo.cidade}
                    onChange={(e) =>
                      setOpenEditCondo((s) => s && ({ ...s, cidade: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input
                    value={openEditCondo.uf}
                    onChange={(e) =>
                      setOpenEditCondo(
                        (s) =>
                          s && ({ ...s, uf: e.target.value.toUpperCase() })
                      )
                    }
                  />
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setOpenEditCondo(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Novo Usuário */}
      <Dialog open={openNewUser} onOpenChange={setOpenNewUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Cria apenas o perfil na tabela <code>usuarios</code>. (A criação/convite de autenticação é feita depois.)
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={handleCreateUser}>
            <div>
              <Label>Nome</Label>
              <Input
                value={userForm.nome}
                onChange={(e) => setUserForm((s) => ({ ...s, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Papel</Label>
              <select
                className="border rounded px-3 py-2 w-full capitalize"
                value={userForm.papel}
                onChange={(e) => setUserForm((s) => ({ ...s, papel: e.target.value }))}
              >
                <option value="sindico">sindico</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
                <option value="morador">morador</option>
              </select>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenNewUser(false);
                  resetUserForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUsuario.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Editar Usuário */}
      <Dialog open={!!openEditUser} onOpenChange={(v) => !v && setOpenEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize o nome, papel e (se desejar) o e-mail do usuário.
            </DialogDescription>
          </DialogHeader>

          {openEditUser && (
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await updateUsuario.mutateAsync({
                  id: openEditUser.id,
                  nome: openEditUser.nome || null,
                  email: openEditUser.email || null,
                });
                setOpenEditUser(null);
              }}
            >
              <div>
                <Label>Nome</Label>
                <Input
                  value={openEditUser.nome ?? ""}
                  onChange={(e) =>
                    setOpenEditUser((s: any) => ({ ...s, nome: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={openEditUser.email ?? ""}
                  onChange={(e) =>
                    setOpenEditUser((s: any) => ({ ...s, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Papel</Label>
                <select
                  className="border rounded px-3 py-2 w-full capitalize"
                  value={openEditUser.papel ?? ""}
                  onChange={(e) =>
                    setOpenEditUser((s: any) => ({ ...s, papel: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="sindico">sindico</option>
                  <option value="morador">morador</option>
                </select>
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setOpenEditUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
