import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Wrench, User, Building2, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreateOSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo?: any;
  plano?: any;
  onSuccess?: () => void;
}

export function CreateOSDialog({ 
  open, 
  onOpenChange, 
  ativo,
  plano,
  onSuccess 
}: CreateOSDialogProps) {
  const { condominio } = useCondominioAtual();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoManutencao, setTipoManutencao] = useState<string>("preventiva");
  const [prioridade, setPrioridade] = useState<string>("media");
  const [tipoExecutor, setTipoExecutor] = useState<string>("externo");
  const [executorNome, setExecutorNome] = useState("");
  const [executorContato, setExecutorContato] = useState("");
  const [dataPrevista, setDataPrevista] = useState<Date>();
  const [nbrRequisitos, setNbrRequisitos] = useState<any[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);

  // Load NBR requirements and checklist when ativo changes
  useEffect(() => {
    if (!ativo) return;

    const loadNBRData = async () => {
      // Load NBR requirements
      if (ativo.ativo_tipos?.slug) {
        const { data: nbr } = await supabase
          .from("nbr_requisitos")
          .select("*")
          .eq("ativo_tipo_slug", ativo.ativo_tipos.slug);
        
        if (nbr) setNbrRequisitos(nbr);
      }

      // Load checklist from plan or NBR
      if (plano?.checklist) {
        setChecklistItems(plano.checklist);
      } else if (nbrRequisitos.length > 0 && nbrRequisitos[0].checklist_items) {
        setChecklistItems(nbrRequisitos[0].checklist_items);
      }
    };

    loadNBRData();
  }, [ativo, plano, nbrRequisitos.length]);

  // Auto-fill form when plano is provided
  useEffect(() => {
    if (plano) {
      setTitulo(plano.titulo || "");
      setDescricao(plano.descricao || "");
      setTipoManutencao("preventiva");
      setPrioridade(plano.prioridade || "media");
      setTipoExecutor(plano.responsavel === "interno" ? "interno" : "externo");
    } else if (ativo) {
      setTitulo(`Manutenção - ${ativo.nome}`);
    }
  }, [plano, ativo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condominio?.id || !ativo?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("criar_os_detalhada" as any, {
        p_condominio_id: condominio.id,
        p_ativo_id: ativo.id,
        p_titulo: titulo,
        p_plano_id: plano?.id || null,
        p_descricao: descricao,
        p_tipo_manutencao: tipoManutencao,
        p_prioridade: prioridade,
        p_tipo_executor: tipoExecutor,
        p_executor_nome: executorNome || null,
        p_executor_contato: executorContato || null,
        p_data_prevista: dataPrevista ? format(dataPrevista, "yyyy-MM-dd") : null,
        p_nbr_referencias: nbrRequisitos.map(nbr => nbr.nbr_codigo),
        p_checklist_items: checklistItems,
      }) as any;

      if (error) throw error;

      if (data && data[0]?.success) {
        toast({
          title: "OS Criada com Sucesso!",
          description: `Ordem de Serviço ${data[0].os_numero} foi criada.`,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(data?.[0]?.message || "Erro ao criar OS");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Criar OS",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ativo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Nova Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Criar OS {plano ? "do plano preventivo" : "manual"} conforme NBR 5674
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4" />
              Ativo: {ativo.nome}
            </div>
            <div className="text-sm text-muted-foreground">
              Tipo: {ativo.ativo_tipos?.nome || "N/A"}
            </div>
            {ativo.local && (
              <div className="text-sm text-muted-foreground">
                Local: {ativo.local}
              </div>
            )}
          </div>

          {/* NBR References */}
          {nbrRequisitos.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Normas NBR Aplicáveis
              </Label>
              <div className="flex flex-wrap gap-2">
                {nbrRequisitos.map((nbr) => (
                  <Badge key={nbr.id} variant="outline" className="font-mono">
                    {nbr.nbr_codigo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="titulo">Título da OS *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Manutenção preventiva mensal"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição Detalhada</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva os serviços a serem realizados..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Manutenção *</Label>
              <Select value={tipoManutencao} onValueChange={setTipoManutencao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="preditiva">Preditiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="urgente">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-prevista">Data Prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataPrevista && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataPrevista ? format(dataPrevista, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataPrevista}
                    onSelect={setDataPrevista}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Executor Info */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsável pela Execução
            </Label>

            <div className="space-y-2">
              <Select value={tipoExecutor} onValueChange={setTipoExecutor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interno">Funcionário Interno</SelectItem>
                  <SelectItem value="externo">Fornecedor Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="executor-nome">
                  {tipoExecutor === "interno" ? "Nome do Funcionário" : "Nome da Empresa"}
                </Label>
                <Input
                  id="executor-nome"
                  value={executorNome}
                  onChange={(e) => setExecutorNome(e.target.value)}
                  placeholder={tipoExecutor === "interno" ? "João Silva" : "Empresa XYZ Ltda"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="executor-contato">Contato</Label>
                <Input
                  id="executor-contato"
                  value={executorContato}
                  onChange={(e) => setExecutorContato(e.target.value)}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>
          </div>

          {/* Checklist Preview */}
          {checklistItems && checklistItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Checklist de Execução ({checklistItems.length} itens)
                </Label>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 max-h-40 overflow-y-auto">
                  {checklistItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <span>{typeof item === 'string' ? item : item.descricao || item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Ordem de Serviço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
