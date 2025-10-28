import { PageHeader } from "@/components/patterns/PageHeader";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AssetLibrary() {
  const { tipos: tiposAtivos, isLoading } = useAtivoTipos();

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
          <Button>
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
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
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
    </div>
  );
}
