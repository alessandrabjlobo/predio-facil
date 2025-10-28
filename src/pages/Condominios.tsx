import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCondominios } from "@/hooks/useCondominios";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CondominiosPage() {
  const navigate = useNavigate();
  const { condominios, isLoading, createCondominio, updateCondominio, deleteCondominio } = useCondominios();
  
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cnpj: "",
    cidade: "",
    uf: "",
    unidades: "",
  });

  const resetForm = () => {
    setFormData({ nome: "", endereco: "", cnpj: "", cidade: "", uf: "", unidades: "" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCondominio.mutateAsync({
      nome: formData.nome,
      endereco: formData.endereco || null,
      cnpj: formData.cnpj || null,
      cidade: formData.cidade || null,
      uf: formData.uf || null,
      unidades: formData.unidades ? parseInt(formData.unidades) : null,
    });
    setOpenNew(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openEdit?.id) return;
    await updateCondominio.mutateAsync({
      id: openEdit.id,
      patch: {
        nome: formData.nome,
        endereco: formData.endereco || null,
        cnpj: formData.cnpj || null,
        cidade: formData.cidade || null,
        uf: formData.uf || null,
        unidades: formData.unidades ? parseInt(formData.unidades) : null,
      },
    });
    setOpenEdit(null);
    resetForm();
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir condomínio "${nome}"? Esta ação não pode ser desfeita.`)) return;
    await deleteCondominio.mutateAsync(id);
  };

  const openEditDialog = (condo: any) => {
    setFormData({
      nome: condo.nome || "",
      endereco: condo.endereco || "",
      cnpj: condo.cnpj || "",
      cidade: condo.cidade || "",
      uf: condo.uf || "",
      unidades: condo.unidades?.toString() || "",
    });
    setOpenEdit(condo);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Condomínios"
        subtitle="Gerencie todos os condomínios cadastrados no sistema"
        icon={Building2}
        actions={
          <Button onClick={() => { resetForm(); setOpenNew(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Condomínio
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando condomínios...</div>
      ) : !condominios || condominios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum condomínio cadastrado. Clique em "Novo Condomínio" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="[&>th]:p-4 text-left text-sm font-medium">
                <th>Nome</th>
                <th>Endereço</th>
                <th>Cidade/UF</th>
                <th>CNPJ</th>
                <th>Unidades</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {condominios.map((condo: any) => (
                <tr key={condo.id} className="[&>td]:p-4 hover:bg-muted/20 transition-colors">
                  <td className="font-medium">{condo.nome}</td>
                  <td className="text-sm text-muted-foreground">{condo.endereco || "—"}</td>
                  <td className="text-sm">
                    {condo.cidade && condo.uf ? `${condo.cidade}/${condo.uf}` : condo.cidade || condo.uf || "—"}
                  </td>
                  <td className="text-sm">{condo.cnpj || "—"}</td>
                  <td className="text-sm">{condo.unidades || "—"}</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(condo)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(condo.id, condo.nome)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog: Novo Condomínio */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Condomínio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome do Condomínio *</Label>
                <Input
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Residencial Flor de Lis"
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label>Número de Unidades</Label>
                <Input
                  type="number"
                  value={formData.unidades}
                  onChange={(e) => setFormData({ ...formData, unidades: e.target.value })}
                  placeholder="Ex: 120"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpenNew(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit">Criar Condomínio</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Condomínio */}
      <Dialog open={!!openEdit} onOpenChange={(open) => { if (!open) { setOpenEdit(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Condomínio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome do Condomínio *</Label>
                <Input
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div>
                <Label>Número de Unidades</Label>
                <Input
                  type="number"
                  value={formData.unidades}
                  onChange={(e) => setFormData({ ...formData, unidades: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpenEdit(null); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
