import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import { AssetTypeDialog } from "@/components/admin/AssetTypeDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AssetLibrary() {
  const { tipos: tiposAtivos, isLoading, refetch } = useAtivoTipos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);

  const handleEdit = (tipo: any) => {
    setSelectedType(tipo);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedType(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir tipo de ativo "${nome}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const { error } = await supabase.from("ativo_tipos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Tipo de ativo excluído com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Biblioteca de Ativos"
          subtitle="Catálogo global de tipos de ativos"
          icon={Package}
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Biblioteca Global de Ativos"
        subtitle="Catálogo de tipos de ativos disponíveis para todos os condomínios"
        icon={Package}
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo de Ativo
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Ativos Cadastrados</CardTitle>
          <CardDescription>
            Gerencie os tipos de ativos que estarão disponíveis para os síndicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead>Conformidade</TableHead>
                <TableHead>Checklist Padrão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposAtivos && tiposAtivos.length > 0 ? (
                tiposAtivos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{tipo.slug}</code>
                    </TableCell>
                    <TableCell className="capitalize">{tipo.sistema_manutencao || "N/A"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tipo.criticidade === "alta" ? "destructive" :
                          tipo.criticidade === "media" ? "default" : "secondary"
                        }
                      >
                        {tipo.criticidade || "Não definida"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tipo.is_conformidade ? (
                        <Badge variant="default">Obrigatório</Badge>
                      ) : (
                        <Badge variant="secondary">Opcional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {tipo.checklist_default && Array.isArray(tipo.checklist_default) ? (
                        <span className="text-sm text-muted-foreground">
                          {tipo.checklist_default.length} itens
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tipo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tipo.id, tipo.nome)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum tipo de ativo cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AssetTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assetType={selectedType}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
