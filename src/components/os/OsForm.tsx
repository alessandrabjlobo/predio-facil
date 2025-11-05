// FILE: src/components/os/OsForm.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

import { createOS, updateOS, type OSRow } from "@/lib/api";
import { normalizeOsFormValues } from "@/utils/os-normalize";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";

const schema = z.object({
  titulo: z.string().min(1, "Informe um título"),
  descricao: z.string().optional().nullable(),
  ativo_id: z.string().optional().nullable(),
  tipo_manutencao: z.enum(["preventiva", "corretiva", "preditiva"]),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
  data_prevista: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD").nullable().optional(),
  responsavel: z.string().optional().nullable(),
  fornecedor_toggle: z.boolean().default(false),
  fornecedor_nome: z.string().optional().nullable(),
  fornecedor_contato: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  mode: "create" | "edit";
  initial?: Partial<FormData> & Partial<Pick<OSRow, "id">>;
  onCreated?: (os: OSRow) => void;
  onUpdated?: (os: OSRow) => void;
  onCancel?: () => void;
};

export default function OsForm({ mode, initial, onCreated, onUpdated, onCancel }: Props) {
  const { condominio } = useCondominioAtual();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: initial?.titulo ?? "",
      descricao: initial?.descricao ?? "",
      ativo_id: (initial as any)?.ativo_id ?? null,
      tipo_manutencao: (initial?.tipo_manutencao as any) ?? "preventiva",
      prioridade: (initial?.prioridade as any) ?? "media",
      data_prevista: (initial?.data_prevista as any) ?? "",
      responsavel: initial?.responsavel ?? "",
      fornecedor_toggle: !!(initial?.fornecedor_nome || initial?.fornecedor_contato),
      fornecedor_nome: initial?.fornecedor_nome ?? "",
      fornecedor_contato: initial?.fornecedor_contato ?? "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      if (name === "fornecedor_toggle" && !values.fornecedor_toggle) {
        form.setValue("fornecedor_nome", "");
        form.setValue("fornecedor_contato", "");
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  async function handleSubmit(raw: FormData) {
    try {
      const norm = normalizeOsFormValues({
        tipo_manutencao: raw.tipo_manutencao,
        prioridade: raw.prioridade,
        data_prevista: raw.data_prevista || "",
      });

      const payload = {
        titulo: raw.titulo,
        descricao: raw.descricao ?? null,
        ativo_id: raw.ativo_id ?? null,
        condominio_id: condominio?.id ?? null,
        tipo_manutencao: norm.tipo_manutencao,
        prioridade: norm.prioridade,
        data_prevista: norm.data_prevista, // null se vazio
        responsavel: raw.responsavel ?? null,
        fornecedor_nome: raw.fornecedor_toggle ? (raw.fornecedor_nome || null) : null,
        fornecedor_contato: raw.fornecedor_toggle ? (raw.fornecedor_contato || null) : null,
      };

      if (mode === "create") {
        const created = await createOS(payload);
        toast({ title: "OS criada com sucesso" });
        onCreated?.(created);
      } else {
        if (!initial?.id) throw new Error("ID não informado para edição");
        const updated = await updateOS(initial.id, {
          titulo: payload.titulo!,
          descricao: payload.descricao ?? null,
          responsavel: payload.responsavel ?? null,
          ativo_id: payload.ativo_id ?? null,
        });
        toast({ title: "OS atualizada com sucesso" });
        onUpdated?.(updated);
      }
    } catch (error: any) {
      const payloadPreview = (() => {
        try { return JSON.stringify(form.getValues(), null, 2).slice(0, 400) + "..."; }
        catch { return "(payload indisponível)"; }
      })();
      console.error("Falha ao salvar OS:", error);
      toast({
        title: "Erro ao salvar OS",
        description: `${error?.message || "Falha desconhecida"}\nPayload: ${payloadPreview}`,
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Título da OS *</Label>
        <Input {...form.register("titulo")} placeholder="Ex.: Manutenção - Rampa Garagem" />
        {form.formState.errors.titulo && (
          <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Descrição Detalhada</Label>
        <Textarea {...form.register("descricao")} placeholder="Descreva os serviços..." rows={4} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Manutenção *</Label>
          <Select
            value={form.watch("tipo_manutencao")}
            onValueChange={(v) => form.setValue("tipo_manutencao", v as any, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="preventiva">Preventiva</SelectItem>
              <SelectItem value="corretiva">Corretiva</SelectItem>
              <SelectItem value="preditiva">Preditiva</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade *</Label>
          <Select
            value={form.watch("prioridade")}
            onValueChange={(v) => form.setValue("prioridade", v as any, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">🟢 Baixa</SelectItem>
              <SelectItem value="media">🟡 Média</SelectItem>
              <SelectItem value="alta">🟠 Alta</SelectItem>
              <SelectItem value="urgente">🔴 Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data Prevista</Label>
          <Input
            type="date"
            {...form.register("data_prevista")}
            onChange={(e) => form.setValue("data_prevista", (e.target.value || null) as any)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Responsável pela Execução</Label>
        <Select
          value={form.watch("responsavel") || ""}
          onValueChange={(v) => form.setValue("responsavel", v)}
        >
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="interno">Interno</SelectItem>
            <SelectItem value="externo">Fornecedor Externo</SelectItem>
            <SelectItem value="terceiro">Terceiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.watch("fornecedor_toggle")}
          onCheckedChange={(v) => form.setValue("fornecedor_toggle", v)}
        />
        <Label>Fornecedor Externo</Label>
      </div>

      {form.watch("fornecedor_toggle") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Empresa</Label>
            <Input {...form.register("fornecedor_nome")} placeholder="Empresa XYZ Ltda" />
          </div>
          <div className="space-y-2">
            <Label>Contato</Label>
            <Input {...form.register("fornecedor_contato")} placeholder="(85) 00000-0000" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">
          {mode === "create" ? "Criar Ordem de Serviço" : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
