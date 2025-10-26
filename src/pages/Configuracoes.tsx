import { useEffect, useMemo, useState } from "react";
import {
  listAtivoTipos,
  createAtivoTipo,
  updateAtivoTipo,
  deleteAtivoTipo,
  listLocais,
  createLocal,
  updateLocal,
  deleteLocal,
  getCondoConfig,
  upsertCondoConfig,
  listManutTemplates,
  upsertManutTemplate,
  deleteManutTemplate,
  AtivoTipoRow,
  LocalRow,
  CondoConfig,
  ManutTemplate,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import { Page } from "@/components/layout/CheckPage";

// --- helpers locais ---
type ConfCategoria = {
  id: string;
  slug: string;
  nome: string;
  created_at?: string | null;
};

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function Section({ title, subtitle, children }: any) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<"tipos" | "templates" | "categorias" | "locais" | "condo">("tipos");

  return (
    <Page>
      <Page.Header
        icon={Settings}
        title="Configurações"
        subtitle="Ajuste padrões do sistema e cadastre referências para facilitar o dia a dia."
      />

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="tipos">Tipos de ativo</TabsTrigger>
          <TabsTrigger value="templates">Templates de manutenção</TabsTrigger>
          <TabsTrigger value="categorias">Categorias (conformidade)</TabsTrigger>
          <TabsTrigger value="locais">Locais</TabsTrigger>
          <TabsTrigger value="condo">Dados do condomínio</TabsTrigger>
          <TabsTrigger value="nbr">Base NBR 5674</TabsTrigger>
        </TabsList>

        <TabsContent value="tipos" className="mt-4">
          <TiposDeAtivoTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <CategoriasTab />
        </TabsContent>

        <TabsContent value="locais" className="mt-4">
          <LocaisTab />
        </TabsContent>

        <TabsContent value="condo" className="mt-4">
          <CondominioTab />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

/* ==================== Categorias (conformidade) ==================== */
function CategoriasTab() {
  const [rows, setRows] = useState<ConfCategoria[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabelaExiste, setTabelaExiste] = useState(true);

  async function listFromTable(): Promise<ConfCategoria[]> {
    const { data, error } = await supabase
      .from("conf_categorias")
      .select("*")
      .order("nome", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ConfCategoria[];
  }

  async function listFallbackFromAtivoTipos(): Promise<ConfCategoria[]> {
    const tipos = await listAtivoTipos();
    const set = new Set<string>();
    for (const t of tipos) {
      if (t.conf_tipo) set.add(t.conf_tipo);
    }
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((slug) => ({
        id: slug,
        slug,
        nome: slug.toUpperCase(),
      }));
  }

  async function refresh() {
    setLoading(true);
    try {
      const data = await listFromTable();
      setRows(data);
      setTabelaExiste(true);
    } catch {
      const fb = await listFallbackFromAtivoTipos();
      setRows(fb);
      setTabelaExiste(false);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    const slug = slugify(novoNome);
    try {
      if (!tabelaExiste) {
        alert("Atenção: a tabela conf_categorias não existe. Crie-a no banco para poder cadastrar categorias.");
        return;
      }
      const { error } = await supabase
        .from("conf_categorias")
        .insert({ slug, nome: novoNome.trim() })
        .select()
        .single();
      if (error) throw error;
      setNovoNome("");
      await refresh();
      alert("Categoria adicionada!");
    } catch (err: any) {
      alert(`Falha ao adicionar: ${err?.message || err}`);
    }
  }

  async function salvar(r: ConfCategoria) {
    try {
      if (!tabelaExiste) {
        alert("Não é possível salvar no modo fallback (sem tabela conf_categorias).");
        return;
      }
      const slug = slugify(r.nome);
      const { error } = await supabase
        .from("conf_categorias")
        .update({ nome: r.nome, slug })
        .eq("id", r.id);
      if (error) throw error;
      await refresh();
      alert("Categoria salva!");
    } catch (err: any) {
      alert(`Falha ao salvar: ${err?.message || err}`);
    }
  }

  async function excluir(id: string) {
    try {
      if (!tabelaExiste) {
        alert("Não é possível excluir no modo fallback (sem tabela conf_categorias).");
        return;
      }
      const ok = window.confirm("Excluir esta categoria? Tipos de ativo com esse conf_tipo poderão falhar no constraint se o banco ainda exigir.");
      if (!ok) return;
      const { error } = await supabase.from("conf_categorias").delete().eq("id", id);
      if (error) throw error;
      await refresh();
      alert("Categoria excluída!");
    } catch (err: any) {
      alert(`Falha ao excluir: ${err?.message || err}`);
    }
  }

  return (
    <div className="grid gap-4">
      <Section
        title="Categorias de conformidade"
        subtitle={
          tabelaExiste
            ? "Cadastre aqui as categorias aceitas (ex.: spda, incendio, reservatorios…)."
            : "Tabela conf_categorias não encontrada. Mostrando categorias em modo somente leitura (a partir dos tipos já cadastrados)."
        }
      >
        <form onSubmit={add} className="flex gap-2 items-end">
          <div className="w-full max-w-md">
            <Label>Nome da categoria</Label>
            <Input
              placeholder="Ex.: SPDA, Incêndio, Reservatórios…"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              disabled={!tabelaExiste}
            />
          </div>
          <Button type="submit" disabled={!tabelaExiste}>Adicionar</Button>
        </form>
      </Section>

      <Section title="Categorias cadastradas">
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Input
                value={r.nome}
                onChange={(e) =>
                  setRows((s) => s.map((x) => (x.id === r.id ? { ...x, nome: e.target.value } : x)))
                }
                className="max-w-md"
                disabled={!tabelaExiste}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => salvar(r)}
                disabled={!tabelaExiste}
              >
                Salvar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => excluir(r.id)}
                disabled={!tabelaExiste}
              >
                Excluir
              </Button>
            </div>
          ))}
          {!loading && rows.length === 0 && <div className="text-gray-500 text-sm">Nenhuma categoria.</div>}
        </div>
      </Section>
    </div>
  );
}

/* ==================== Tipos de Ativo ==================== */
function TiposDeAtivoTab() {
  const [rows, setRows] = useState<AtivoTipoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [categorias, setCategorias] = useState<string[]>([]);
  async function carregarCategorias() {
    try {
      const { data, error } = await supabase
        .from("conf_categorias")
        .select("slug, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      setCategorias((data ?? []).map((c: any) => c.slug));
    } catch {
      const tipos = await listAtivoTipos();
      const set = new Set<string>();
      for (const t of tipos) if (t.conf_tipo) set.add(t.conf_tipo);
      setCategorias(Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR")));
    }
  }

  const [form, setForm] = useState<{
    nome: string;
    is_conformidade: boolean;
    conf_tipo: string;
  }>({
    nome: "",
    is_conformidade: false,
    conf_tipo: "",
  });

  async function refresh() {
    setLoading(true);
    try {
      const data = await listAtivoTipos();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    carregarCategorias();
  }, []);

  async function addTipo(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;

    try {
      await createAtivoTipo({
        nome: form.nome,
        is_conformidade: form.is_conformidade,
        conf_tipo: form.conf_tipo?.trim() ? (form.conf_tipo as any) : null,
      });
      setForm({ nome: "", is_conformidade: false, conf_tipo: "" });
      await refresh();
      alert("Tipo de ativo adicionado!");
    } catch (err: any) {
      alert(`Falha ao adicionar tipo: ${err?.message || err}`);
    }
  }

  async function salvarEdicao(row: AtivoTipoRow) {
    try {
      await updateAtivoTipo(row.id, {
        nome: row.nome,
        is_conformidade: row.is_conformidade,
        conf_tipo: row.conf_tipo,
      });
      await refresh();
      alert("Tipo de ativo salvo!");
    } catch (err: any) {
      alert(`Falha ao salvar: ${err?.message || err}`);
    }
  }

  return (
    <div className="grid gap-4">
      <datalist id="conf-categorias">
        {categorias.map((slug) => (
          <option key={slug} value={slug} />
        ))}
      </datalist>

      <Section
        title="Novo tipo de ativo"
        subtitle="Padronize a nomenclatura. Se marcar conformidade, escolha uma categoria válida."
      >
        <form onSubmit={addTipo} className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label>Nome do tipo (ex.: elevadores, spda, gerador)</Label>
            <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} />
          </div>
          <div>
            <Label>Impacta conformidade?</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_conformidade}
                onChange={(e) => setForm((s) => ({ ...s, is_conformidade: e.target.checked }))}
              />
              <span className="text-sm text-gray-600">Sim</span>
            </div>
          </div>
          <div>
            <Label>Categoria (se aplicável)</Label>
            <Input
              list="conf-categorias"
              placeholder="ex.: spda, incendio…"
              value={form.conf_tipo}
              onChange={(e) => setForm((s) => ({ ...s, conf_tipo: e.target.value }))}
            />
            <div className="text-xs text-gray-500 mt-1">
              Dica: cadastre/edite em “Categorias (conformidade)”.
            </div>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </Section>

      <Section title="Tipos cadastrados">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Conformidade?</th>
                <th className="p-2 text-left">Categoria</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <Input
                      value={r.nome}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === r.id ? { ...x, nome: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={r.is_conformidade}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === r.id ? { ...x, is_conformidade: e.target.checked } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      list="conf-categorias"
                      value={r.conf_tipo ?? ""}
                      onChange={(e) =>
                        setRows((s) =>
                          s.map((x) =>
                            x.id === r.id ? { ...x, conf_tipo: (e.target.value || null) as any } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => salvarEdicao(r)}>
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          const ok = window.confirm("Excluir este tipo de ativo?");
                          if (!ok) return;
                          try {
                            await deleteAtivoTipo(r.id);
                            await refresh();
                            alert("Tipo excluído!");
                          } catch (err: any) {
                            alert(`Falha ao excluir: ${err?.message || err}`);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={4}>
                    Nenhum tipo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

/* ==================== Templates ==================== */
function TemplatesTab() {
  const [filtro, setFiltro] = useState("");
  const [rows, setRows] = useState<ManutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [tipos, setTipos] = useState<AtivoTipoRow[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await listAtivoTipos();
        setTipos(data);
      } catch {
        setTipos([]);
      }
    })();
  }, []);
  const opcoesTipos = useMemo(() => {
    const uniq = Array.from(new Set((tipos ?? []).map((t) => t.nome))).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    return uniq;
  }, [tipos]);

  const [form, setForm] = useState<Partial<ManutTemplate> & { qtd?: number; unidade?: "day" | "month" | "year" }>({
    sistema: "",
    titulo_plano: "",
    descricao: "",
    qtd: 1,
    unidade: "month",
    responsavel: "",
  });

  async function refresh() {
    setLoading(true);
    try {
      const data = await listManutTemplates(filtro);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [filtro]);

  function montarIntervalo(qtd?: number, unidade?: "day" | "month" | "year") {
    const n = Math.max(1, Number(qtd ?? 1));
    const unit = unidade ?? "month";
    const plural = n === 1 ? unit : ((unit + "s") as "days" | "months" | "years");
    return `${n} ${plural}`;
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sistema?.trim() || !form.titulo_plano?.trim()) return;
    try {
      const periodicidade = montarIntervalo(form.qtd, form.unidade);
      await upsertManutTemplate({
        sistema: form.sistema!.toLowerCase().trim(),
        titulo_plano: form.titulo_plano!,
        descricao: form.descricao ?? null,
        periodicidade,
        responsavel: form.responsavel ?? null,
        checklist: [],
      });
      setForm({
        sistema: filtro || "",
        titulo_plano: "",
        descricao: "",
        qtd: 1,
        unidade: "month",
        responsavel: "",
      });
      await refresh();
      alert("Template adicionado!");
    } catch (err: any) {
      alert(`Falha ao adicionar: ${err?.message || err}`);
    }
  }

  async function salvarLinha(t: ManutTemplate) {
    try {
      await upsertManutTemplate({
        id: t.id,
        sistema: (t.sistema || "").toLowerCase().trim(),
        titulo_plano: t.titulo_plano,
        descricao: t.descricao ?? null,
        periodicidade: t.periodicidade,
        responsavel: t.responsavel ?? null,
        checklist: t.checklist ?? [],
      });
      await refresh();
      alert("Template salvo!");
    } catch (err: any) {
      alert(`Falha ao salvar: ${err?.message || err}`);
    }
  }

  return (
    <div className="grid gap-4">
      <datalist id="tipos-ativos-datalist">
        {opcoesTipos.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <Section
        title="Filtro por sistema (opcional)"
        subtitle="Selecione um tipo de ativo para ver apenas os templates desse sistema."
      >
        <div className="flex gap-2 items-center">
          <Input
            list="tipos-ativos-datalist"
            placeholder="ex.: Elevador, SPDA…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => setFiltro("")}>
            Limpar
          </Button>
        </div>
      </Section>

      <Section title="Novo template">
        <form onSubmit={addTemplate} className="grid md:grid-cols-6 gap-3">
          <div>
            <Label>Sistema (tipo do ativo)</Label>
            <Input
              list="tipos-ativos-datalist"
              placeholder="ex.: Elevador, SPDA…"
              value={form.sistema ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, sistema: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Descrição</Label>
            <Input
              value={form.titulo_plano ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, titulo_plano: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Periodicidade</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                className="w-24"
                value={form.qtd ?? 1}
                onChange={(e) => setForm((s) => ({ ...s, qtd: Number(e.target.value) }))}
              />
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.unidade ?? "month"}
                onChange={(e) => setForm((s) => ({ ...s, unidade: e.target.value as any }))}
              >
                <option value="day">Dia(s)</option>
                <option value="month">Mês(es)</option>
                <option value="year">Ano(s)</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Responsável</Label>
            <Input
              placeholder="ex.: Empresa credenciada"
              value={form.responsavel ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, responsavel: e.target.value }))}
            />
          </div>

          <div className="md:col-span-6">
            <Label>O que deve ser feito (descrição)</Label>
            <Textarea
              value={form.descricao ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
            />
          </div>

          <div className="md:col-span-6 flex justify-end">
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </Section>

      <Section title="Templates cadastrados" subtitle="Edite direto nas linhas e salve.">
        <div className="overflow-auto">
          <table className="w-full text-sm align-top">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Sistema</th>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-left">Periodicidade</th>
                <th className="p-2 text-left">Responsável</th>
                <th className="p-2 text-left">O que deve ser feito</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">
                    <Input
                      list="tipos-ativos-datalist"
                      value={t.sistema}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === t.id ? { ...x, sistema: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={t.titulo_plano}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === t.id ? { ...x, titulo_plano: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={t.periodicidade}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === t.id ? { ...x, periodicidade: e.target.value } : x)))
                      }
                    />
                    <div className="text-xs text-gray-500 mt-1">Ex.: 1 month, 6 months, 1 week…</div>
                  </td>
                  <td className="p-2">
                    <Input
                      value={t.responsavel ?? ""}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === t.id ? { ...x, responsavel: e.target.value || null } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Textarea
                      value={t.descricao ?? ""}
                      onChange={(e) =>
                        setRows((s) => s.map((x) => (x.id === t.id ? { ...x, descricao: e.target.value || null } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => salvarLinha(t)}>
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          const ok = window.confirm("Excluir este template?");
                          if (!ok) return;
                          try {
                            await deleteManutTemplate(t.id);
                            await refresh();
                            alert("Template excluído!");
                          } catch (err: any) {
                            alert(`Falha ao excluir: ${err?.message || err}`);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={6}>
                    Nenhum template encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

/* ==================== Locais ==================== */
function LocaisTab() {
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [novo, setNovo] = useState("");

  async function refresh() {
    const data = await listLocais();
    setRows(data);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.trim()) return;
    try {
      await createLocal(novo.trim());
      setNovo("");
      await refresh();
      alert("Local adicionado!");
    } catch (err: any) {
      alert(`Falha ao adicionar local: ${err?.message || err}`);
    }
  }

  return (
    <div className="grid gap-4">
      <Section title="Novo local">
        <form onSubmit={add} className="flex gap-2">
          <Input
            placeholder="Ex.: Casa de máquinas, Garagem…"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
          />
          <Button type="submit">Adicionar</Button>
        </form>
      </Section>

      <Section title="Locais cadastrados">
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Input
                value={r.nome}
                onChange={(e) => setRows((s) => s.map((x) => (x.id === r.id ? { ...x, nome: e.target.value } : x)))}
                className="max-w-md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await updateLocal(r.id, r.nome);
                    await refresh();
                    alert("Local salvo!");
                  } catch (err: any) {
                    alert(`Falha ao salvar: ${err?.message || err}`);
                  }
                }}
              >
                Salvar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  const ok = window.confirm("Excluir este local?");
                  if (!ok) return;
                  try {
                    await deleteLocal(r.id);
                    await refresh();
                    alert("Local excluído!");
                  } catch (err: any) {
                    alert(`Falha ao excluir: ${err?.message || err}`);
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          ))}
          {rows.length === 0 && <div className="text-gray-500 text-sm">Nenhum local.</div>}
        </div>
      </Section>
    </div>
  );
}

/* ==================== Dados do Condomínio ==================== */
function CondominioTab() {
  const [cfg, setCfg] = useState<CondoConfig | null>(null);
  const [form, setForm] = useState<{ nome: string; unidades: string; endereco: string }>({
    nome: "",
    unidades: "",
    endereco: "",
  });

  useEffect(() => {
    (async () => {
      const c = await getCondoConfig();
      setCfg(c);
      setForm({
        nome: c?.nome ?? "",
        unidades: (c?.unidades ?? "") as any,
        endereco: c?.endereco ?? "",
      });
    })();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertCondoConfig({
        nome: form.nome || null,
        unidades: form.unidades ? Number(form.unidades) : null,
        endereco: form.endereco || null,
      });
      const c = await getCondoConfig();
      setCfg(c);
      alert("Dados do condomínio salvos!");
    } catch (err: any) {
      alert(`Falha ao salvar: ${err?.message || err}`);
    }
  }

  return (
    <div className="grid gap-4">
      <Section title="Dados gerais">
        <form onSubmit={salvar} className="grid sm:grid-cols-2 gap-3 max-w-3xl">
          <div className="sm:col-span-2">
            <Label>Nome do condomínio</Label>
            <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} />
          </div>
          <div>
            <Label>Unidades</Label>
            <Input
              type="number"
              min={0}
              value={form.unidades}
              onChange={(e) => setForm((s) => ({ ...s, unidades: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm((s) => ({ ...s, endereco: e.target.value }))} />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
        {cfg?.updated_at && (
          <p className="text-xs text-gray-500 mt-2">
            Atualizado em {new Date(cfg.updated_at).toLocaleString()}
          </p>
        )}
      </Section>
    </div>
  );
}
