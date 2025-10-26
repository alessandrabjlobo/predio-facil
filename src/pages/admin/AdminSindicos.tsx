import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUsuarios } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, UserPlus, Mail, Phone, Shield, Loader2 } from "lucide-react";
import { z } from "zod";

// Schema de validação
const sindicoSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  cpf: z.string().trim().optional(),
  papel: z.enum(["sindico", "zelador", "admin"], { required_error: "Selecione um papel" }),
});

type SindicoForm = z.infer<typeof sindicoSchema>;

export const AdminSindicos = () => {
  const { usuarios, isLoading } = useUsuarios();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<SindicoForm>({
    nome: "",
    email: "",
    cpf: "",
    papel: "sindico",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCreateSindico = async () => {
    try {
      // Validar dados do formulário
      const validated = sindicoSchema.parse(formData);
      setFormErrors({});
      setCreating(true);

      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: Math.random().toString(36).slice(-12) + "Aa1!", // Senha temporária forte
        options: {
          data: {
            nome: validated.nome,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Usuário não foi criado");

      // 2. Aguardar um pouco para garantir que o trigger handle_new_user executou
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Buscar o usuário na tabela usuarios
      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (usuarioError) throw usuarioError;
      if (!usuario) throw new Error("Usuário não encontrado na tabela usuarios");

      // 4. Atualizar CPF se fornecido
      if (validated.cpf) {
        await supabase
          .from("usuarios")
          .update({ cpf: validated.cpf })
          .eq("id", usuario.id);
      }

      // 5. Criar role para o usuário se for admin
      if (validated.papel === "admin") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: usuario.id,
            role: "admin",
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Sucesso!",
        description: `${validated.papel === "admin" ? "Administrador" : "Síndico"} ${validated.nome} cadastrado com sucesso! Um email de confirmação foi enviado.`,
      });

      setOpen(false);
      setFormData({ nome: "", email: "", cpf: "", papel: "sindico" });
      
      // Recarregar a lista
      window.location.reload();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao cadastrar síndico",
          variant: "destructive",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const getPapelBadge = (papel: string | undefined) => {
    if (!papel) return null;
    
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      admin: { variant: "destructive", label: "Administrador" },
      sindico: { variant: "default", label: "Síndico" },
      zelador: { variant: "secondary", label: "Zelador" },
    };

    const config = variants[papel] || { variant: "outline", label: papel };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Gerenciar Síndicos e Administradores
              </CardTitle>
              <CardDescription>
                Cadastre síndicos, zeladores e administradores para vincular aos condomínios
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo síndico ou administrador
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="João da Silva"
                      maxLength={100}
                    />
                    {formErrors.nome && (
                      <p className="text-sm text-destructive">{formErrors.nome}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="joao@exemplo.com"
                        className="pl-10"
                        maxLength={255}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-sm text-destructive">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF (opcional)</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="papel">Papel no Sistema *</Label>
                    <Select
                      value={formData.papel}
                      onValueChange={(value: any) => setFormData({ ...formData, papel: value })}
                    >
                      <SelectTrigger id="papel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sindico">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Síndico - Gerencia um condomínio
                          </div>
                        </SelectItem>
                        <SelectItem value="zelador">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Zelador - Manutenções e operações
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-destructive" />
                            Administrador - Acesso total ao sistema
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.papel && (
                      <p className="text-sm text-destructive">{formErrors.papel}</p>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Importante:</strong> Uma senha temporária será gerada automaticamente e um email de confirmação será enviado para o endereço cadastrado.
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateSindico}
                    className="w-full"
                    disabled={creating}
                  >
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Cadastrar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !usuarios || usuarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum usuário cadastrado ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Condomínios</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario: any) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nome || "Não informado"}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.cpf || "-"}</TableCell>
                    <TableCell>
                      {usuario.usuarios_condominios?.[0]?.papel 
                        ? getPapelBadge(usuario.usuarios_condominios[0].papel)
                        : <Badge variant="outline">Sem papel</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      {usuario.usuarios_condominios?.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {usuario.usuarios_condominios.map((uc: any) => (
                            <span key={uc.condominio_id} className="text-sm">
                              {uc.condominios?.nome || "Condomínio"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhum</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
