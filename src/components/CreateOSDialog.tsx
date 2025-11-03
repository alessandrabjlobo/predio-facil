import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

import { listAtivos, createOS, type OSRow } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (os: OSRow) => void;
};

type FormData = {
  ativo_id?: string;
  ativo_tipo?: string;
  local?: string;

  titulo: string;
  descricao?: string;

  tipo_manutencao: "preventiva" | "corretiva" | "preditiva";
  prioridade: "baixa" | "media" | "alta" | "urgente";

  data_prevista?: string; // yyyy-MM-dd

  responsavel: "interno" | "externo";
  fornecedor_nome?: string;
  fornecedor_contato?: string;
};

export default function CreateOSDialog({ open, onOpenChange, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [ativos, setAtivos] = useState<Array<{ id: string; nome: string; tipo?: string | null; local?: string | null }>>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      titulo: "",
      descricao: "",
      tipo_manutencao: "preventiva",
      prioridade: "media",
      responsavel: "interno"
    }
  });

  const selectedAtivoId = watch("ativo_id");
  const responsavel = watch("responsavel");

  // Carrega Ativos
  useEffect(() => {
    (async () => {
      try {
        const rows = await listAtivos();
        setAtivos(rows.map((a: any) => ({ id: a.id, nome: a.nome, tipo: a.tipo ?? null, local: a.local ?? null })));
      } catch (e: any) {
        toast({ variant: "destructive", title: "Erro", description: e.message ?? "Falha ao carregar ativos" });
      }
    })();
  }, []);

  // Prefill de tipo/local quando selecionar Ativo
  useEffect(() => {
    if (!selectedAtivoId) return;
    const a = ativos.find(x => x.id === selectedAtivoId);
    if (a) {
      setValue("ativo_tipo", a.tipo ?? "");
      setValue("local", a.local ?? "");
      if (!watch("titulo")) {
        setValue("titulo", `OS – ${a.nome}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAtivoId, ativos]);

  const onClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Monta título se usuário não preencheu
      const titulo =
        data.titulo?.trim() ||
        (ativos.find(a => a.id === data.ativo_id)?.nome
          ? `OS – ${ativos.find(a => a.id === data.ativo_id)!.nome}`
          : "Ordem de Serviço");

      // Seu backend aceita estes campos com segurança:
      const payloadBase = {
        titulo,
        descricao: data.descricao ?? null,
        ativo_id: data.ativo_id ?? null,
        prioridade: data.prioridade,              // ok no api.ts (atualiza depois do insert)
        origem: data.tipo_manutencao as any,      // usamos tipo como origem
        responsavel: data.responsavel,            // campo textual no seu api.ts
      };

      // 1) cria a OS com o contrato mínimo compatível
      const os = await createOS(payloadBase);

      // 2) best-effort: tenta gravar campos “novos” se existirem no schema
      //    (não falha a criação caso a coluna não exista ainda)
      const patch: Record<string, any> = {};
      if (data.data_prevista) patch.data_prevista = data.data_prevista;
      patch.tipo_executor = data.responsavel === "externo" ? "externo" : "interno";
      if (data.responsavel === "externo") {
        if (data.fornecedor_nome) patch.executor_empresa = data.fornecedor_nome;
        if (data.fornecedor_contato) patch.executor_contato = data.fornecedor_contato;
      }
      if (Object.keys(patch).length > 0) {
        try {
          await supabase.from("os").update(patch).eq("id", (os as any).id);
        } catch {
          // ignora: coluna pode não existir ainda
        }
      }

      toast({ title: "OS criada", description: "A ordem de serviço foi criada com sucesso." });
      onCreated?.(os);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao criar OS", description: e.message ?? "Falha inesperada" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ATIVO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Ativo</Label>
              <Select
                onValueChange={(v) => setValue("ativo_id", v)}
                value={watch("ativo_id") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ativo" />
                </SelectTrigger>
                <SelectContent>
                  {ativos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo (do ativo)</Label>
              <Input placeholder="Ex.: Acessibilidade" {...register("ativo_tipo")} />
            </div>
          </div>

          {/* Local */}
          <div>
            <Label>Local</Label>
            <Input placeholder="Ex.: Garagem" {...register("local")} />
          </div>

          {/* Título / Descrição */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Título da OS *</Label>
              <Input {...register("titulo", { required: "Informe um título" })} />
              {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
            </div>
            <div>
              <Label>Descrição Detalhada</Label>
              <Textarea rows={4} placeholder="Descreva os serviços a serem realizados..." {...register("descricao")} />
            </div>
          </div>

          {/* Tipo de Manutenção / Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Manutenção *</Label>
              <Select
                onValueChange={(v: any) => setValue("tipo_manutencao", v)}
                value={watch("tipo_manutencao")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="preditiva">Preditiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade *</Label>
              <Select
                onValueChange={(v: any) => setValue("prioridade", v)}
                value={watch("prioridade")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="urgente">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Prevista / Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Data Prevista</Label>
              <DatePicker
                valueISO={watch("data_prevista") || ""}
                onChangeISO={(iso) => setValue("data_prevista", iso)}
              />
            </div>

            <div>
              <Label>Responsável pela Execução</Label>
              <Select
                onValueChange={(v: any) => setValue("responsavel", v)}
                value={responsavel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interno">Equipe Interna</SelectItem>
                  <SelectItem value="externo">Fornecedor Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fornecedor (condicional) */}
          {responsavel === "externo" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nome da Empresa</Label>
                <Input placeholder="Empresa XYZ Ltda" {...register("fornecedor_nome")} />
              </div>
              <div>
                <Label>Contato</Label>
                <Input placeholder="(11) 99999-9999" {...register("fornecedor_contato")} />
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Ordem de Serviço
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------- DatePicker ------------------------- */
function DatePicker({ valueISO, onChangeISO }: { valueISO: string; onChangeISO: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => (valueISO ? new Date(valueISO) : undefined), [valueISO]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : <span>Selecionar data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            setOpen(false);
            onChangeISO(d ? d.toISOString().slice(0, 10) : "");
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
