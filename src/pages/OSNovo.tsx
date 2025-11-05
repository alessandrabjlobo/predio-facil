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
import { supabase } from "@/integrations/supabase/client"; // para buscar checklist da NBR, se necessário

type RiscoNivel = "baixo" | "medio" | "alto";

const KEYWORDS_PT = ["elétric", "eletric", "solda", "quente", "espaço confinado", "espaco confinado"];
const EPIS_SUGERIDOS: Record<string, string[]> = {
  preventiva: ["Capacete", "Óculos de proteção"],
  preditiva: ["Capacete", "Luvas de segurança"],
  corretiva: ["Capacete", "Óculos de proteção", "Luvas de segurança"],
};

function sugereNivelRisco(tipo: string, prioridade: string): RiscoNivel {
  if (prioridade === "urgente") return "alto";
  if (tipo === "corretiva" && (prioridade === "alta" || prioridade === "urgente")) return "alto";
  if (tipo === "preditiva") return "medio";
  return "medio";
}
function precisaPT(nivel: RiscoNivel, texto: string) {
  if (nivel === "alto") return true;
  const t = (texto || "").toLowerCase();
  return KEYWORDS_PT.some(k => t.includes(k));
}

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
      prioridade: (params.get("priority") || "media") as "baixa" | "media" | "alta" | "urgente",
    };
  }, [params]);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // Básico
    titulo: pre.titulo,
    descricao: pre.descricao,
    tipo_manutencao: (pre.origem === "plan" ? "preventiva" : "corretiva") as "preventiva" | "corretiva" | "preditiva",
    prioridade: pre.prioridade,
    data_prevista: pre.vencimento,

    // Identificação / origem (travados no UI)
    ativo_id: pre.ativo_id || "",
    condominio_id: pre.condominio_id || "",
    plano_id: pre.plano_id || "",
    origem: pre.origem,

    // Escopo / checklist / recursos
    escopo: "",
    checklistText: "",
    materiaisText: "",
    equipeText: "",

    // Segurança / PT
    risco_nivel: "medio" as RiscoNivel,
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

    // Execução
    fornecedor_nome: "",
    fornecedor_contato: "",
  });

  // Em qualquer mudança de pre, garante consistência
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
      prioridade: pre.prioridade,
      tipo_manutencao: (pre.origem === "plan" ? "preventiva" : s.tipo_manutencao),
    }));
  }, [pre]);

  // Prefill por plano: checklist do plano ou checklist da NBR do tipo do ativo
  useEffect(() => {
    (async () => {
      if (pre.plano_id) {
        // tenta carregar checklist do plano
        const { data: plano } = await supabase
          .from("planos_preventivos")
          .select("checklist, titulo, descricao, prioridade, responsavel, proxima_execucao")
          .eq("id", pre.plano_id)
          .maybeSingle();

        if (plano) {
          setForm((s) => ({
            ...s,
            tipo_manutencao: "preventiva",
            prioridade: (plano.prioridade as any) || s.prioridade,
            data_prevista: plano.proxima_execucao?.slice(0, 10) || s.data_prevista,
            titulo: s.titulo || (plano.titulo ? `Manutenção — ${plano.titulo}` : s.titulo),
            descricao: s.descricao || plano.descricao || s.descricao,
            escopo: `Execução preventiva conforme plano e NBR 5674.`,
            checklistText: Array.isArray(plano.checklist) ? plano.checklist.join("\n") : s.checklistText,
          }));
        }

        // fallback NBR se não houver checklist no plano
        if (!form.checklistText && pre.ativo_id) {
          const { data: ativo } = await supabase
            .from("ativos")
            .select("ativo_tipos(slug)")
            .eq("id", pre.ativo_id)
            .maybeSingle();

          const ativoTipos = ativo?.ativo_tipos as { slug?: string } | { slug?: string }[] | null;
          const slug = Array.isArray(ativoTipos) ? ativoTipos[0]?.slug : ativoTipos?.slug;
          if (slug) {
            const { data: req } = await supabase
              .from("nbr_requisitos")
              .select("checklist_items")
              .eq("ativo_tipo_slug", slug)
              .limit(1)
              .maybeSingle();

            const linhas: string[] =
              (req?.checklist_items as string[] | null | undefined)?.filter(Boolean) ?? [];

            if (linhas.length) {
              setForm((s) => ({ ...s, checklistText: linhas.join("\n") }));
            }
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pre.plano_id, pre.ativo_id]);

  // Sugestões automáticas (EPIs, risco, exibição do bloco de PT)
  const [mostrarPT, setMostrarPT] = useState(false);
  useEffect(() => {
    const nivel = sugereNivelRisco(form.tipo_manutencao, form.prioridade);
    const episBase = EPIS_SUGERIDOS[form.tipo_manutencao] ?? EPIS_SUGERIDOS["corretiva"];

    setForm((s) => ({
      ...s,
      risco_nivel: nivel,
      epi_text: s.epi_text?.trim() ? s.epi_text : episBase.join("\n"),
    }));

    const texto = `${form.escopo}\n${form.checklistText}`;
    setMostrarPT(precisaPT(nivel, texto));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo_manutencao, form.prioridade, form.escopo, form.checklistText]);

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

      if (!lines.length) return null;

      if (mode === "epi") return lines; // strings
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
    if (!form.ativo_id || !form.condominio_id) {
      toast({ title: "Dados obrigatórios", description: "Ativo e condomínio são obrigatórios.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const checklist = parseArrayOfObjects(form.checklistText, "checklist");
      const materiais = parseArrayOfObjects(form.materiaisText, "materiais");
      const equipe = parseArrayOfObjects(form.equipeText, "equipe");
      const epi_lista = parseArrayOfObjects(form.epi_text, "epi");

      // Campos de aceite NÃO fazem parte do formulário — serão definidos automaticamente
      // (ex.: quando a OS for concluída, setar síndico autenticado como responsável pelo aceite)

      const novo = await createOS({
        titulo: form.titulo,
        descricao: form.descricao || null,
        ativo_id: form.ativo_id,
        condominio_id: form.condominio_id,
        tipo_manutencao: form.tipo_manutencao,
        prioridade: form.prioridade,
        data_prevista: form.data_prevista || null,
        origem: form.origem || "manual",
        plano_id: form.plano_id || null,

        // Execução
        fornecedor_nome: form.fornecedor_nome || null,
        fornecedor_contato: form.fornecedor_contato || null,

        // Normativos
        escopo: form.escopo || null,
        checklist: (checklist as any) ?? null,
        materiais: (materiais as any) ?? null,
        equipe: (equipe as any) ?? null,

        risco_nivel: form.risco_nivel,
        riscos_identificados: form.riscos_identificados || null,
        epi_lista: (epi_lista as any) ?? null,
        pt_numero: mostrarPT ? form.pt_numero || null : null,
        pt_tipo: mostrarPT ? form.pt_tipo || null : null,

        // SLA
        sla_inicio: form.sla_inicio || null,
        sla_fim: form.sla_fim || null,

        // Custos
        custo_estimado: form.custo_estimado ? Number(form.custo_estimado) : null,
        custo_materiais: form.custo_materiais ? Number(form.custo_materiais) : null,
        custo_total: form.custo_total ? Number(form.custo_total) : null,
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
            {/* Cabeçalho travado */}
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Ativo (ID)</Label>
                <Input value={form.ativo_id} disabled />
                <input type="hidden" name="ativo_id" value={form.ativo_id} />
              </div>
              <div>
                <Label>Condomínio (ID)</Label>
                <Input value={form.condominio_id} disabled />
                <input type="hidden" name="condominio_id" value={form.condominio_id} />
              </div>
              <div>
                <Label>Origem</Label>
                <Input value={form.origem} disabled />
                <input type="hidden" name="origem" value={form.origem} />
              </div>
            </section>

            <Separator />

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
                {form.plano_id && <p className="text-xs text-muted-foreground mt-1">Definido pelo plano</p>}
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
                {form.plano_id && <p className="text-xs text-muted-foreground mt-1">Carregado do plano / NBR</p>}
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

            {/* Segurança — PT condicional e EPIs sugeridos */}
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Nível de risco (sugerido)</Label>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Sugestão automática pelo tipo/prioridade – editável.
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">EPIs sugeridos automaticamente; edite se precisar.</p>
              </div>

              {mostrarPT && (
                <>
                  <div>
                    <Label>Nº PT</Label>
                    <Input value={form.pt_numero} onChange={(e) => setForm({ ...form, pt_numero: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Tipo de PT</Label>
                    <Input value={form.pt_tipo} onChange={(e) => setForm({ ...form, pt_tipo: e.target.value })} />
                  </div>
                </>
              )}
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

            {/* Execução (simplificado para síndicos) */}
            <section className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{/* título mantido igual ao seu layout */}Fornecedor (empresa) / Funcionário</Label>
                <Input
                  value={form.fornecedor_nome}
                  onChange={(e) => setForm({ ...form, fornecedor_nome: e.target.value })}
                  placeholder="Ex.: Empresa XYZ ou João da Manutenção"
                />
              </div>
              <div>
                <Label>Contato</Label>
                <Input
                  value={form.fornecedor_contato}
                  onChange={(e) => setForm({ ...form, fornecedor_contato: e.target.value })}
                  placeholder="(85) 9xxxx-xxxx"
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
