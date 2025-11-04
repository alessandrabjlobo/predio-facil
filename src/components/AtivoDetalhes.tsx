// FILE: src/components/AtivoDetalhes.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, MapPin, Building, AlertCircle, History, Trash2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAtivos } from "@/hooks/useAtivos";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ⬇️ IMPORTANTE: trazer o formulário completo de OS
import OsForm from "@/components/os/OsForm";

interface AtivoDetalhesProps {
  ativoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AtivoDetalhes({ ativoId, open, onOpenChange }: AtivoDetalhesProps) {
  const queryClient = useQueryClient();
  const { updateAtivo, deleteAtivo } = useAtivos();
  const { role } = useUserRole();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openOsForm, setOpenOsForm] = useState(false);

  const canEditOrDelete = role === "admin" || role === "sindico";

  // Buscar dados do ativo
  const { data: ativo, isLoading } = useQuery({
    queryKey: ["ativo-detalhes", ativoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ativos")
        .select("*, ativo_tipos(nome)")
        .eq("id", ativoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!ativoId,
  });

  // Buscar histórico de manutenção
  const { data: historico } = useQuery({
    queryKey: ["ativo-historico", ativoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ativo_historico_manutencao")
        .select("*")
        .eq("ativo_id", ativoId);

      if (error) throw error;
      return data;
    },
    enabled: open && !!ativoId,
  });

  // Buscar planos de manutenção do ativo
  const { data: planos } = useQuery({
    queryKey: ["ativo-planos", ativoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_manutencao")
        .select("*")
        .eq("ativo_id", ativoId)
        .order("proxima_execucao", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open && !!ativoId,
  });

  const [formData, setFormData] = useState({
    nome: "",
    torre: "",
    tipo_uso: "",
    andar: "",
    identificador: "",
    local: "",
    modelo: "",
    fabricante: "",
    numero_serie: "",
    data_instalacao: "",
    requer_conformidade: false,
    observacoes: "",
  });

  // ✅ Sincroniza o form com o ativo carregado (corrige uso anterior de useState como efeito)
  useEffect(() => {
    if (ativo) {
      setFormData({
        nome: ativo.nome || "",
        torre: ativo.torre || "",
        tipo_uso: ativo.tipo_uso || "",
        andar: ativo.andar || "",
        identificador: ativo.identificador || "",
        local: ativo.local || "",
        modelo: ativo.modelo || "",
        fabricante: ativo.fabricante || "",
        numero_serie: ativo.numero_serie || "",
        data_instalacao: ativo.data_instalacao || "",
        requer_conformidade: ativo.requer_conformidade || false,
        observacoes: ativo.observacoes || "",
      });
    }
  }, [ativo]);

  const handleSave = () => {
    updateAtivo.mutate(
      { id: ativoId, updates: formData },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["ativo-detalhes", ativoId] });
          toast({ title: "Ativo atualizado com sucesso" });
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteAtivo.mutate(ativoId, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["ativos"] });
        toast({ title: "Ativo excluído" });
        onOpenChange(false);
        setShowDeleteDialog(false);
      },
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ativo?.nome}
            {ativo?.requer_conformidade && (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Conformidade
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {ativo?.ativo_tipos?.nome} - Personalização completa do ativo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Ativo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificador">Identificador (ex: Elevador 1)</Label>
                <Input
                  id="identificador"
                  value={formData.identificador}
                  onChange={(e) => setFormData({ ...formData, identificador: e.target.value })}
                  placeholder="Ex: Elevador Social 1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização Detalhada
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="torre">Torre/Bloco</Label>
                <Input
                  id="torre"
                  value={formData.torre}
                  onChange={(e) => setFormData({ ...formData, torre: e.target.value })}
                  placeholder="Ex: Torre 1, Bloco A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="andar">Andar/Pavimento</Label>
                <Input
                  id="andar"
                  value={formData.andar}
                  onChange={(e) => setFormData({ ...formData, andar: e.target.value })}
                  placeholder="Ex: Térreo, 5º Andar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local">Local Específico</Label>
                <Input
                  id="local"
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  placeholder="Ex: Hall de Entrada"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_uso">Tipo de Uso</Label>
                <Select
                  value={formData.tipo_uso}
                  onValueChange={(value) => setFormData({ ...formData, tipo_uso: value })}
                >
                  <SelectTrigger id="tipo_uso">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="comum">Comum</SelectItem>
                    <SelectItem value="privativo">Privativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Especificações Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building className="h-4 w-4" />
                Especificações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fabricante">Fabricante</Label>
                <Input
                  id="fabricante"
                  value={formData.fabricante}
                  onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_serie">Número de Série</Label>
                <Input
                  id="numero_serie"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_instalacao">Data de Instalação</Label>
                <Input
                  id="data_instalacao"
                  type="date"
                  value={formData.data_instalacao}
                  onChange={(e) => setFormData({ ...formData, data_instalacao: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conformidade e Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Controle e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="conformidade"
                  checked={formData.requer_conformidade}
                  onCheckedChange={(checked) => setFormData({ ...formData, requer_conformidade: checked })}
                />
                <Label htmlFor="conformidade" className="cursor-pointer">
                  Requer controle de conformidade (NBR 5674)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o ativo..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Planos de Manutenção Previstos */}
          {planos && planos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Manutenções Previstas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {planos.map((plano: any) => {
                    const proximaData = new Date(plano.proxima_execucao);
                    const hoje = new Date();
                    const diasAteVencer = Math.floor((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={plano.id} className="flex items-center justify-between p-3 border rounded hover:bg-accent/50">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{plano.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {plano.tipo} • Periodicidade: {plano.periodicidade}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {proximaData.toLocaleDateString("pt-BR")}
                          </p>
                          {diasAteVencer > 0 && diasAteVencer <= 15 && (
                            <Badge variant="secondary" className="text-xs">
                              Em {diasAteVencer} dias
                            </Badge>
                          )}
                          {diasAteVencer < 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Vencido
                            </Badge>
                          )}
                          {diasAteVencer > 15 && (
                            <Badge variant="outline" className="text-xs">
                              Em dia
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Manutenção */}
          {historico && historico.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico de Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {historico.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{item.manutencao_titulo || "Sem título"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.manutencao_tipo} - {item.status}
                        </p>
                      </div>
                      <Badge variant={item.status === "executada" ? "default" : "secondary"}>
                        {item.executada_em ? new Date(item.executada_em).toLocaleDateString() : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                  {historico.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{historico.length - 5} manutenções anteriores
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4">
            <div>
              {canEditOrDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Ativo
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {/* Botão para abrir o formulário COMPLETO de OS */}
              {canEditOrDelete && (
                <Button variant="outline" onClick={() => setOpenOsForm(true)}>
                  Gerar OS
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {canEditOrDelete && (
                <Button onClick={handleSave} disabled={updateAtivo.isPending}>
                  {updateAtivo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Dialog com o OsForm completo */}
      <Dialog open={openOsForm} onOpenChange={setOpenOsForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <DialogDescription>Crie a OS completa vinculada a este ativo.</DialogDescription>
          </DialogHeader>
          <OsForm
            mode="create"
            initial={{
              ativo_id: ativoId,
              titulo: ativo?.nome ? `Manutenção - ${ativo.nome}` : "",
              tipo_manutencao: "preventiva",
              prioridade: "media",
            }}
            onCreated={async () => {
              toast({ title: "OS criada com sucesso" });
              setOpenOsForm(false);
              // opcional: invalida listas relacionadas
              await queryClient.invalidateQueries({ queryKey: ["os"] });
            }}
            onCancel={() => setOpenOsForm(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ativo "{ativo?.nome}" será permanentemente excluído
              do sistema, incluindo todo o histórico de manutenções associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAtivo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
