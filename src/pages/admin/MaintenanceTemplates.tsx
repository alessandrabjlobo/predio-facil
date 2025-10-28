import { useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Wrench, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useManutTemplates } from "@/hooks/useManutTemplates";
import { MaintenanceTemplateDialog } from "@/components/admin/MaintenanceTemplateDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function MaintenanceTemplates() {
  const { templates, isLoading, refetch } = useManutTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!window.confirm(`Excluir template "${titulo}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const { error } = await supabase.from("manut_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Template excluído com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Templates de Manutenção"
          subtitle="Biblioteca global de templates NBR"
          icon={Wrench}
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Templates de Manutenção"
        subtitle="Biblioteca global de templates baseados em NBR 5674 e normas relacionadas"
        icon={Wrench}
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Templates Cadastrados</CardTitle>
          <CardDescription>
            Gerencie os templates de manutenção que serão aplicados automaticamente aos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sistema</TableHead>
                <TableHead>Título do Plano</TableHead>
                <TableHead>Periodicidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Conformidade</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates && templates.length > 0 ? (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.sistema}</TableCell>
                    <TableCell>{template.titulo_plano}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {String(template.periodicidade)}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{template.responsavel || "N/A"}</TableCell>
                    <TableCell>
                      {template.is_conformidade ? (
                        <Badge variant="default">Obrigatório</Badge>
                      ) : (
                        <Badge variant="secondary">Opcional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.checklist && Array.isArray(template.checklist) ? (
                        <span className="text-sm text-muted-foreground">
                          {template.checklist.length} itens
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">Ações ▾</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(template.id, template.titulo_plano)}>
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Excluir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { /* placeholder for details */ }}>
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum template cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MaintenanceTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
