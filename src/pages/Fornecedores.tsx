import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Phone, Mail, FileText, Plus, Pencil, Trash2, Star } from "lucide-react";
import Layout from "@/components/Layout";
import { Checkbox } from "@/components/ui/checkbox";

type Fornecedor = {
  id: string;
  condominio_id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  especialidade: string[] | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
};

const especialidadesDisponiveis = [
  { value: 'elevadores', label: 'Elevadores' },
  { value: 'incendio', label: 'Combate a Incêndio' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'spda', label: 'SPDA (Para-raios)' },
  { value: 'pmoc', label: 'PMOC (Ar Condicionado)' },
  { value: 'gas', label: 'Gás' },
  { value: 'estrutura', label: 'Estrutura/Engenharia' },
  { value: 'jardinagem', label: 'Jardinagem' },
  { value: 'limpeza', label: 'Limpeza' },
];

export default function Fornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    especialidade: [] as string[],
    observacoes: "",
  });

  useEffect(() => {
    loadFornecedores();
  }, []);

  async function loadFornecedores() {
    try {
      setLoading(true);
      const { data: condominios } = await supabase
        .from("usuarios_condominios")
        .select("condominio_id")
        .limit(1)
        .single();

      if (!condominios) {
        toast.error("Condomínio não encontrado");
        return;
      }

      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("condominio_id", condominios.condominio_id)
        .order("nome");

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar fornecedores: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const { data: condominios } = await supabase
        .from("usuarios_condominios")
        .select("condominio_id")
        .limit(1)
        .single();

      if (!condominios) {
        toast.error("Condomínio não encontrado");
        return;
      }

      const payload = {
        ...formData,
        condominio_id: condominios.condominio_id,
        cnpj: formData.cnpj || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        observacoes: formData.observacoes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("fornecedores")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("fornecedores")
          .insert(payload);

        if (error) throw error;
        toast.success("Fornecedor cadastrado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      loadFornecedores();
    } catch (error: any) {
      toast.error("Erro ao salvar fornecedor: " + error.message);
    }
  }

  function resetForm() {
    setFormData({
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      especialidade: [],
      observacoes: "",
    });
    setEditingId(null);
  }

  function handleEdit(fornecedor: Fornecedor) {
    setFormData({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      especialidade: fornecedor.especialidade || [],
      observacoes: fornecedor.observacoes || "",
    });
    setEditingId(fornecedor.id);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      const { error } = await supabase
        .from("fornecedores")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Fornecedor excluído com sucesso!");
      loadFornecedores();
    } catch (error: any) {
      toast.error("Erro ao excluir fornecedor: " + error.message);
    }
  }

  function toggleEspecialidade(value: string) {
    setFormData(prev => ({
      ...prev,
      especialidade: prev.especialidade.includes(value)
        ? prev.especialidade.filter(e => e !== value)
        : [...prev.especialidade, value]
    }));
  }

  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.includes(searchTerm) ||
    f.especialidade?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie fornecedores e prestadores de serviço
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar" : "Novo"} Fornecedor</DialogTitle>
                <DialogDescription>
                  Preencha os dados do fornecedor/prestador de serviço
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome / Razão Social *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Especialidades *</Label>
                    <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
                      {especialidadesDisponiveis.map((esp) => (
                        <div key={esp.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={esp.value}
                            checked={formData.especialidade.includes(esp.value)}
                            onCheckedChange={() => toggleEspecialidade(esp.value)}
                          />
                          <label
                            htmlFor={esp.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {esp.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Buscar por nome, CNPJ ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando fornecedores...</div>
        ) : fornecedoresFiltrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {fornecedoresFiltrados.map((fornecedor) => (
              <Card key={fornecedor.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {fornecedor.nome}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        {fornecedor.cnpj && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            CNPJ: {fornecedor.cnpj}
                          </div>
                        )}
                        {fornecedor.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {fornecedor.telefone}
                          </div>
                        )}
                        {fornecedor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {fornecedor.email}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(fornecedor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold">Especialidades:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fornecedor.especialidade && fornecedor.especialidade.length > 0 ? (
                          fornecedor.especialidade.map((esp) => (
                            <Badge key={esp} variant="secondary">
                              {especialidadesDisponiveis.find(e => e.value === esp)?.label || esp}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Nenhuma especialidade definida</span>
                        )}
                      </div>
                    </div>
                    
                    {fornecedor.observacoes && (
                      <div>
                        <Label className="text-sm font-semibold">Observações:</Label>
                        <p className="text-sm text-muted-foreground mt-1">{fornecedor.observacoes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
