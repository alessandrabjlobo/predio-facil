import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useManutTemplates } from "@/hooks/useManutTemplates";
import { ChecklistEditor } from "@/components/ChecklistEditor";
import { DocumentoSelector } from "@/components/DocumentoSelector";
import { FileText, Settings, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AdminManutencoes = () => {
  const { templates, tiposAtivos, documentoTipos, isLoading, getTemplateDocumentos, updateTemplateDocumentos } = useManutTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<any[]>([]);
  const [editingDocs, setEditingDocs] = useState<string[]>([]);

  const { data: templateDocs } = selectedTemplate 
    ? getTemplateDocumentos(selectedTemplate) 
    : { data: [] };

  const handleEditTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates?.find(t => t.id === templateId);
    const checklist = template?.checklist;
    setEditingChecklist(Array.isArray(checklist) ? checklist : []);
    setEditingDocs(templateDocs?.map(d => d.documento_tipo_id) || []);
  };

  const handleSaveDocumentos = () => {
    if (!selectedTemplate) return;
    updateTemplateDocumentos.mutate({
      templateId: selectedTemplate,
      documentoIds: editingDocs,
    });
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Manutenções</h1>
        <p className="text-muted-foreground">Configure templates globais e tipos de ativos</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates de Manutenção</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Ativos</TabsTrigger>
          <TabsTrigger value="documentos">Tipos de Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Manutenção</CardTitle>
              <CardDescription>
                Configure templates padrão baseados na NBR 5674 e outras normas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates?.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.titulo_plano}</CardTitle>
                        <CardDescription>{template.descricao}</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template.id)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Configurar Template: {template.titulo_plano}</DialogTitle>
                            <DialogDescription>
                              Configure checklist e documentos obrigatórios
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div>
                              <Label>Checklist</Label>
                              <div className="mt-2">
                                <ChecklistEditor
                                  items={editingChecklist}
                                  onChange={setEditingChecklist}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Documentos Obrigatórios</Label>
                              <div className="mt-2">
                                <DocumentoSelector
                                  documentoTipos={documentoTipos || []}
                                  selectedIds={editingDocs}
                                  onChange={setEditingDocs}
                                />
                              </div>
                            </div>

                            <Button onClick={handleSaveDocumentos} className="w-full">
                              Salvar Configurações
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Sistema: {template.sistema}</Badge>
                      <Badge variant="outline">Periodicidade: {String(template.periodicidade)}</Badge>
                      {template.is_conformidade && (
                        <Badge variant="secondary">Conformidade Legal</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Ativos</CardTitle>
              <CardDescription>
                Gerencie os tipos de ativos disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tiposAtivos?.map((tipo) => (
                <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{tipo.nome}</h4>
                    <p className="text-sm text-muted-foreground">Sistema: {tipo.sistema_manutencao}</p>
                  </div>
                  <div className="flex gap-2">
                    {tipo.impacta_conformidade && <Badge>Conformidade</Badge>}
                    <Badge variant="outline">{tipo.criticidade}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Documentos</CardTitle>
                  <CardDescription>
                    Gerencie os tipos de documentos que podem ser exigidos
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {documentoTipos?.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.nome}</h4>
                    <p className="text-sm text-muted-foreground">{doc.descricao}</p>
                    <Badge variant="outline" className="mt-2">
                      {doc.codigo}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
