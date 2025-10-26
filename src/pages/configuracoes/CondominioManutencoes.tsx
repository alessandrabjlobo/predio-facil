import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ChecklistEditor } from "@/components/ChecklistEditor";
import { DocumentoSelector } from "@/components/DocumentoSelector";
import { useManutTemplates } from "@/hooks/useManutTemplates";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export const CondominioManutencoes = () => {
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();
  const { templates, documentoTipos, getTemplateDocumentos } = useManutTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [checklistAdicional, setChecklistAdicional] = useState<any[]>([]);
  const [docsAdicionais, setDocsAdicionais] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const { data: overrides } = useQuery({
    queryKey: ["condominio-overrides", condominio?.id],
    queryFn: async () => {
      if (!condominio?.id) return [];
      
      const { data, error } = await supabase
        .from("condominio_template_overrides")
        .select("*")
        .eq("condominio_id", condominio.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!condominio?.id,
  });

  const { data: templateDocs } = selectedTemplate 
    ? getTemplateDocumentos(selectedTemplate) 
    : { data: [] };

  const saveOverride = useMutation({
    mutationFn: async () => {
      if (!condominio?.id || !selectedTemplate) return;

      const { error } = await supabase
        .from("condominio_template_overrides")
        .upsert({
          condominio_id: condominio.id,
          template_id: selectedTemplate,
          checklist_adicional: checklistAdicional,
          documentos_adicionais: docsAdicionais,
          observacoes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condominio-overrides"] });
      toast({
        title: "Sucesso",
        description: "Customizações salvas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao salvar: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCustomize = (templateId: string) => {
    setSelectedTemplate(templateId);
    const override = overrides?.find(o => o.template_id === templateId);
    const checklist = override?.checklist_adicional;
    const docs = override?.documentos_adicionais;
    setChecklistAdicional(Array.isArray(checklist) ? checklist : []);
    setDocsAdicionais(Array.isArray(docs) ? docs : []);
    setObservacoes(override?.observacoes || "");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Manutenção</h1>
        <p className="text-muted-foreground">
          Personalize os templates de manutenção para este condomínio
        </p>
      </div>

      <div className="space-y-4">
        {templates?.map((template) => {
          const override = overrides?.find(o => o.template_id === template.id);
          const hasCustomization = !!override;

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.titulo_plano}</CardTitle>
                    <CardDescription>{template.descricao}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant={hasCustomization ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleCustomize(template.id)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {hasCustomization ? "Editar Customização" : "Personalizar"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Personalizar: {template.titulo_plano}</DialogTitle>
                        <DialogDescription>
                          Adicione itens extras ao checklist e documentos adicionais obrigatórios
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div>
                          <Label>Checklist</Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            Itens em cinza são obrigatórios pelo template padrão
                          </p>
                          <ChecklistEditor
                            items={checklistAdicional}
                            onChange={setChecklistAdicional}
                            readonlyItems={Array.isArray(template.checklist) ? template.checklist as any[] : []}
                          />
                        </div>

                        <div>
                          <Label>Documentos Obrigatórios</Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            Documentos padrão não podem ser removidos
                          </p>
                          <DocumentoSelector
                            documentoTipos={documentoTipos || []}
                            selectedIds={docsAdicionais}
                            onChange={setDocsAdicionais}
                            readonlyIds={templateDocs?.map(d => d.documento_tipo_id) || []}
                          />
                        </div>

                        <div>
                          <Label>Observações</Label>
                          <Textarea
                            placeholder="Justifique as customizações..."
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="mt-2"
                          />
                        </div>

                        <Button onClick={() => saveOverride.mutate()} className="w-full">
                          Salvar Customizações
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Sistema: {template.sistema}</Badge>
                  {hasCustomization && (
                    <Badge variant="secondary">Customizado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
