import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAtivos } from "@/hooks/useAtivos";
import { useUsuariosCondominio } from "@/hooks/useUsuariosCondominio";
import { useOrdemServico } from "@/hooks/useOrdemServico";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreateOSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    ativoId?: string;
    titulo?: string;
    tipo?: string;
    dataPrevista?: string;
    planoId?: string;
  };
}

export const CreateOSDialog = ({ open, onOpenChange, initialData }: CreateOSDialogProps) => {
  const { ativos } = useAtivos();
  const { zeladores } = useUsuariosCondominio();
  const { createOS } = useOrdemServico();

  const [titulo, setTitulo] = useState(initialData?.titulo || "");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState(initialData?.tipo || "preventiva");
  const [prioridade, setPrioridade] = useState("media");
  const [ativoId, setAtivoId] = useState(initialData?.ativoId || ""); // manter como string
  const [dataPrevista, setDataPrevista] = useState<Date | undefined>(
    initialData?.dataPrevista ? new Date(initialData.dataPrevista) : undefined
  );
  const [slaDias, setSlaDias] = useState("30");
  const [tipoExecutor, setTipoExecutor] = useState<"interno" | "externo">("interno");
  const [executanteId, setExecutanteId] = useState(""); // string
  const [executorNome, setExecutorNome] = useState("");
  const [executorContato, setExecutorContato] = useState("");
  const [executorEmpresa, setExecutorEmpresa] = useState("");
  const [executorCnpj, setExecutorCnpj] = useState("");
  const [custoPrevisto, setCustoPrevisto] = useState("");

  const handleSubmit = async () => {
    if (!titulo || !ativoId) return;

    // comparar ids como string pra evitar bugs entre number/string
    const ativo = ativos?.find((a: any) => String(a.id) === String(ativoId));

    // UMA ÚNICA chamada ao mutateAsync (antes tinham duas)
    await createOS.mutateAsync({
  titulo,
  descricao,
  ativoId, // string
  planoId: initialData?.planoId,
  tipo,
  prioridade,
  dataPrevista: dataPrevista?.toISOString().split("T")[0],
  slaDias: parseInt(slaDias || "0", 10),
});


    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setTipo("preventiva");
    setPrioridade("media");
    setAtivoId("");
    setDataPrevista(undefined);
    setSlaDias("30");
    setTipoExecutor("interno");
    setExecutanteId("");
    setExecutorNome("");
    setExecutorContato("");
    setExecutorEmpresa("");
    setExecutorCnpj("");
    setCustoPrevisto("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Descreva brevemente o serviço"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais sobre o serviço"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de OS</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="emergencial">Emergencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger id="prioridade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="ativo">Ativo *</Label>
            <Select value={ativoId} onValueChange={(v) => setAtivoId(String(v))}>
              <SelectTrigger id="ativo">
                <SelectValue placeholder="Selecione o ativo" />
              </SelectTrigger>
              <SelectContent>
                {ativos?.map((ativo: any, idx: number) => (
                  <SelectItem key={`${ativo.id}-${idx}`} value={String(ativo.id)}>
                    {ativo.nome} {ativo.local && `- ${ativo.local}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Prevista</Label>
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
                    {dataPrevista ? format(dataPrevista, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dataPrevista} onSelect={setDataPrevista} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="sla">SLA (dias)</Label>
              <Input
                id="sla"
                type="number"
                value={slaDias}
                onChange={(e) => setSlaDias(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="custo">Custo Previsto (R$)</Label>
            <Input
              id="custo"
              type="number"
              step="0.01"
              value={custoPrevisto}
              onChange={(e) => setCustoPrevisto(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Tipo de Executor *</Label>
            <RadioGroup
              value={tipoExecutor}
              onValueChange={(v) => setTipoExecutor(v as "interno" | "externo")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interno" id="interno" />
                <Label htmlFor="interno" className="font-normal cursor-pointer">
                  Executor Interno (Zelador/Funcionário)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="externo" id="externo" />
                <Label htmlFor="externo" className="font-normal cursor-pointer">
                  Fornecedor Externo
                </Label>
              </div>
            </RadioGroup>
          </div>

          {tipoExecutor === "interno" ? (
            <div>
              <Label htmlFor="executante">Executante *</Label>
              <Select value={executanteId} onValueChange={(v) => setExecutanteId(String(v))}>
                <SelectTrigger id="executante">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {zeladores?.map((z: any, idx: number) => (
                    <SelectItem key={`${z.id}-${idx}`} value={String(z.id)}>
                      {z.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empresa">Nome da Empresa *</Label>
                  <Input
                    id="empresa"
                    value={executorEmpresa}
                    onChange={(e) => setExecutorEmpresa(e.target.value)}
                    placeholder="Razão social"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={executorCnpj}
                    onChange={(e) => setExecutorCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavel">Nome do Responsável *</Label>
                  <Input
                    id="responsavel"
                    value={executorNome}
                    onChange={(e) => setExecutorNome(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="contato">Contato *</Label>
                  <Input
                    id="contato"
                    value={executorContato}
                    onChange={(e) => setExecutorContato(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createOS.isPending}>
            {createOS.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
