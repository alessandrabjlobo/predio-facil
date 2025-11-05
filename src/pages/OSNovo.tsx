// src/pages/OSNovo.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createOS } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function OSNovo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Pré-preenchidos via querystring (?title=&asset=&origin=&due=&condo=&plan=&description=&priority=)
  const pre = useMemo(() => {
    return {
      titulo: params.get("title") || params.get("titulo") || "",
      ativo_id: params.get("asset") || params.get("ativo") || "",
      origem: params.get("origin") || params.get("origem") || "manual",
      vencimento: params.get("due") || params.get("vencimento") || "",
      condominio_id: params.get("condo") || params.get("condominio") || "",
      plano_id: params.get("plan") || "",
      descricao: params.get("description") || "",
      prioridade: params.get("priority") || "media",
    };
  }, [params]);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // Básico
    titulo: pre.titulo,
    descricao: pre.descricao,
    tipo_manutencao: (pre.origem === "plan" ? "preventiva" : "corretiva") as "preventiva" | "corretiva" | "preditiva",
    prioridade: (pre.prioridade || "media") as "baixa" | "media" | "alta" | "urgente",
    data_prevista: pre.vencimento,

    // Identificação / origem
    ativo_id: pre.ativo_id || "",
    condominio_id: pre.condominio_id || "",
    plano_id: pre.plano_id || "",
    solicitante_nome: "",
    solicitante_contato: "",
    aprovador_nome: "",
    origem: pre.origem,

    // Escopo / checklist / recursos
    escopo: "",
    checklistText: "",
    materiaisText: "",
    equipeText: "",

    // Segurança / PT
    risco_nivel: "medio" as "baixo" | "medio" | "alto",
    riscos_identificados: "",
    epi_text: "",
    pt_numero: "",
    pt_tipo: "",

    // Prazos / SLA
    sla_inicio: "",
    sla_fim: "",

    // Custos
    custo_estimado: "",
    custo_materiais: "",
    custo_total: "",

    // Fornecedor
    fornecedor_nome: "",
    fornecedor_contato: "",

    // Aceite / validação
    aceite_responsavel: "",
    aceite_data: "",
    validacao_obs: "",
  });

  useEffect(() => {
    setForm((s) => ({
      ...s,
      titulo: pre.titulo || s.titulo,
      descricao: pre.descricao || s.descricao,
      ativo_id: pre.ativo_id || s.ativo_id,
      condominio_id: pre.condominio_id || s.condominio_id,
      plano_id: pre.plano_id || s.plano_id,
      origem: pre.origem || s.origem,
      data_prevista: pre.vencimento || s.data_prevista,
      prioridade: (pre.prioridade || s.prioridade) as "baixa" | "media" | "alta" | "urgente",
      tipo_manutencao: (pre.origem === "plan" ? "preventiva" : s.tipo_manutencao) as "preventiva" | "corretiva" | "preditiva",
    }));
  }, [pre]);

  function parseArrayOfObjects(text: string, mode: "checklist" | "materiais" | "equipe" | "epi") {
    if (!text.trim()) return null;
    try {
      const j = JSON.parse(text);
      return Array.isArray(j) ? j : null;
    } catch {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) return null;

      if (mode === "epi") return lines; // array de strings
      if (mode === "checklist") return lines.map((item) => ({ item, obrigatorio: true }));
      if (mode === "materiais") return lines.map((l) => ({ descricao: l, qtd: 1 }));
      if (mode === "equipe") return lines.map((l) => ({ funcao: l }));

      return null;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast({ title: "Informe o título da OS.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const checklist = parseArrayOfObjects(form.checklistText, "checklist");
      const materiais = parseArrayOfObjects(form.materiaisText, "materiais");
      const equipe = parseArrayOfObjects(form.equipeText, "equipe");
      const epi_lista = parseArrayOfObjects(form.epi_text, "epi");

      const novo = await createOS({
        // Campos já existentes no seu backend
        titulo: form.titulo,
        descricao: form.descricao || null,
        responsavel: null,
        ativo_id: form.ativo_id || null,
        condominio_id: form.condominio_id || null,
        tipo_manutencao: form.tipo_manutencao,
        prioridade: form.prioridade,
        data_prevista: form.data_prevista || null,
        origem: form.origem || "manual",

        // Fornecedor
        fornecedor_nome: form.fornecedor_nome || null,
        fornecedor_contato: form.fornecedor_contato || null,

        // Campos normativos extras (createOS já trata como opcionais)
        solicitante_nome: form.solicitante_nome || null as any,
        solicitante_contato: form.solicitante_contato || null as any,
        aprovador_nome: form.aprovador_nome || null as any,

        escopo: form.escopo || null as any,
        checklist: (checklist as any) ?? null,
        materiais: (materiais as any) ?? null,
        equipe: (equipe as any) ?? null,

        risco_nivel: form.risco_nivel,
        riscos_identificados: form.riscos_identificados || null as any,
        epi_lista: (epi_lista as any) ?? null,
        pt_numero: form.pt_numero || null as any,
        pt_tipo: form.pt_tipo || null as any,

        sla_inicio: form.sla_inicio || null as any,
        sla_fim: form.sla_fim || null as any,

        custo_estimado: form.custo_estimado ? Number(form.custo_estimado) : null,
        custo_materiais: form.custo_materiais ? Number(form.custo_materiais) : null,
        custo_total: form.custo_total ? Number(form.custo_total) : null,

        aceite_responsavel: form.aceite_responsavel || null as any,
        aceite_data: form.aceite_data || null as any,
        validacao_obs: form.validacao_obs || null as any,
      } as any);

      toast({ title: "OS criada com sucesso!" });

      if (novo?.ativo_id) navigate(`/os?ativo=${novo.ativo_id}`);
      else navigate(`/os`);
    } catch (e: any) {
      toast({
        title: "Erro ao criar OS",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 grid gap-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Nova Ordem de Serviço — NBR 5674</h1>
      </div>
      <p className="text-muted-foreground">Preencha os dados completos exigidos pela norma.</p>

      <Card>
        <CardHeader>
          <CardTitle>Dados da OS</CardTitle>
          <CardDescription>Campos marcados com * são obrigatórios.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-6">
            {/* Básico */}
            <section className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
              </div>
              <div>
                <Label>Data Prevista</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={form.data_prevista}
                    onChange={(e) => setForm({ ...form, data_prevista: e.target.value })}
                  />
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Label>Tipo de Manutenção *</Label>
                <Select
                  value={form.tipo_manutencao}
                  onValueChange={(v: any) => setForm({ ...form, tipo_manutencao: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                  value={form.prioridade}
                  onValueChange={(v: any) => setForm({ ...form, prioridade: v })}
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

              <div className="md:col-span-2">
                <Label>Descrição detalhada</Label>
                <Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
            </section>

            <Separator />

            {/* Identificação / origem */}
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Ativo (ID)</Label>
                <Input
                  value={form.ativo_id}
                  onChange={(e) => setForm({ ...form, ativo_id: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Condomínio (ID)</Label>
                <Input
                  value={form.condominio_id}
                  onChange={(e) => setForm({ ...form, condominio_id: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Input
                  value={form.origem}
                  onChange={(e) => setForm({ ...form, origem: e.target.value })}
                  placeholder="manual / plano / inspeção..."
                />
              </div>
              <div>
                <Label>Solicitante</Label>
                <Input
                  value={form.solicitante_nome}
                  onChange={(e) => setForm({ ...form, solicitante_nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Contato do solicitante</Label>
                <Input
                  value={form.solicitante_contato}
                  onChange={(e) => setForm({ ...form, solicitante_contato: e.target.value })}
                />
              </div>
              <div>
                <Label>Aprovador</Label>
                <Input
                  value={form.aprovador_nome}
                  onChange={(e) => setForm({ ...form, aprovador_nome: e.target.value })}
                />
              </div>
            </section>

            <Separator />

            {/* Escopo / checklist / recursos */}
            <section className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Escopo do serviço</Label>
                <Textarea rows={3} value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })} />
              </div>
              <div>
                <Label>Checklist (uma linha por item ou JSON)</Label>
                <Textarea
                  rows={4}
                  placeholder={`Ex.: Inspecionar fixações\nLubrificar rolamentos`}
                  value={form.checklistText}
                  onChange={(e) => setForm({ ...form, checklistText: e.target.value })}
                />
              </div>
              <div>
                <Label>Materiais (uma linha por item ou JSON)</Label>
                <Textarea
                  rows={4}
                  placeholder={`Ex.: Graxa NLGI-2\nParafuso M8x25`}
                  value={form.materiaisText}
                  onChange={(e) => setForm({ ...form, materiaisText: e.target.value })}
                />
              </div>
              <div>
                <Label>Equipe (uma linha por função ou JSON)</Label>
                <Textarea
                  rows={4}
                  placeholder={`Ex.: Mecânico\nEletricista`}
                  value={form.equipeText}
                  onChange={(e) => setForm({ ...form, equipeText: e.target.value })}
                />
              </div>
            </section>

            <Separator />

            {/* Segurança */}
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Nível de risco</Label>
                <Select
                  value={form.risco_nivel}
                  onValueChange={(v: any) => setForm({ ...form, risco_nivel: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Riscos identificados</Label>
                <Textarea
                  rows={2}
                  value={form.riscos_identificados}
                  onChange={(e) => setForm({ ...form, riscos_identificados: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <Label>EPIs (uma por linha ou JSON)</Label>
                <Textarea
                  rows={2}
                  placeholder={`Ex.: Capacete\nÓculos de proteção`}
                  value={form.epi_text}
                  onChange={(e) => setForm({ ...form, epi_text: e.target.value })}
                />
              </div>
              <div>
                <Label>Nº PT</Label>
                <Input value={form.pt_numero} onChange={(e) => setForm({ ...form, pt_numero: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Tipo de PT</Label>
                <Input value={form.pt_tipo} onChange={(e) => setForm({ ...form, pt_tipo: e.target.value })} />
              </div>
            </section>

            <Separator />

            {/* Prazos / SLA */}
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>SLA início</Label>
                <Input
                  type="date"
                  value={form.sla_inicio}
                  onChange={(e) => setForm({ ...form, sla_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>SLA fim</Label>
                <Input
                  type="date"
                  value={form.sla_fim}
                  onChange={(e) => setForm({ ...form, sla_fim: e.target.value })}
                />
              </div>
            </section>

            <Separator />

            {/* Custos */}
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Custo estimado (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.custo_estimado}
                  onChange={(e) => setForm({ ...form, custo_estimado: e.target.value })}
                />
              </div>
              <div>
                <Label>Custo materiais (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.custo_materiais}
                  onChange={(e) => setForm({ ...form, custo_materiais: e.target.value })}
                />
              </div>
              <div>
                <Label>Custo total (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.custo_total}
                  onChange={(e) => setForm({ ...form, custo_total: e.target.value })}
                />
              </div>
            </section>

            <Separator />

            {/* Fornecedor */}
            <section className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Fornecedor (empresa)</Label>
                <Input
                  value={form.fornecedor_nome}
                  onChange={(e) => setForm({ ...form, fornecedor_nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Contato do fornecedor</Label>
                <Input
                  value={form.fornecedor_contato}
                  onChange={(e) => setForm({ ...form, fornecedor_contato: e.target.value })}
                />
              </div>
            </section>

            <Separator />

            {/* Aceite / validação */}
            <section className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>Responsável pelo aceite</Label>
                <Input
                  value={form.aceite_responsavel}
                  onChange={(e) => setForm({ ...form, aceite_responsavel: e.target.value })}
                />
              </div>
              <div>
                <Label>Data do aceite</Label>
                <Input
                  type="date"
                  value={form.aceite_data}
                  onChange={(e) => setForm({ ...form, aceite_data: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <Label>Observações da validação</Label>
                <Textarea
                  rows={2}
                  value={form.validacao_obs}
                  onChange={(e) => setForm({ ...form, validacao_obs: e.target.value })}
                />
              </div>
            </section>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar Ordem de Serviço"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
