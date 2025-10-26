// src/pages/OSNovo.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createOS, OSRow, OSStatus } from "@/lib/api";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OSNovo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // pré-preenchidos via query
  const pre = useMemo(() => {
    return {
      titulo: params.get("titulo") || "",
      ativo_id: params.get("ativo") || "",
      origem: params.get("origem") || "manual",
      vencimento: params.get("vencimento") || "",
    };
  }, [params]);

  // form state
  const [form, setForm] = useState<{
    titulo: string;
    descricao: string;
    responsavel: string;
    prioridade: "baixa" | "media" | "alta" | "urgente";
    ativo_id: string;
    origem: string;
    data_prevista: string; // opcional
  }>({
    titulo: pre.titulo,
    descricao: "",
    responsavel: "",
    prioridade: "media",
    ativo_id: pre.ativo_id,
    origem: pre.origem,
    data_prevista: pre.vencimento,
  });

  useEffect(() => {
    setForm((s) => ({
      ...s,
      titulo: pre.titulo,
      ativo_id: pre.ativo_id,
      origem: pre.origem,
      data_prevista: pre.vencimento,
    }));
  }, [pre]);

  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSubmitting(true);
    try {
      // Chamada "segura": envia colunas que certamente existem + extras opcionais
      const novo = await createOS({
        titulo: form.titulo,
        descricao: form.descricao || null,
        ativo_id: form.ativo_id || null,
        responsavel: form.responsavel || null, // será aplicado se a coluna existir
        prioridade: form.prioridade,           // idem
        origem: form.origem || "manual",       // idem
        // se sua tabela tiver 'data_prevista' use createOS que aceite esse campo
        // data_prevista: form.data_prevista || null,
      } as any);

      // navega para lista filtrada por ativo, ou para a lista geral
      if (novo?.ativo_id) navigate(`/os?ativo=${novo.ativo_id}`);
      else navigate(`/os`);
    } catch (e: any) {
      alert(e?.message || "Falha ao criar OS");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
        <p className="text-gray-600">Preencha os dados da OS e salve.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da OS</CardTitle>
          <CardDescription>Campos marcados com * são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <textarea
                className="border rounded w-full p-2 text-sm"
                rows={4}
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Responsável</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm((s) => ({ ...s, responsavel: e.target.value }))}
                  placeholder="ex.: Manutenção"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se a coluna não existir no banco, este campo será ignorado.
                </p>
              </div>

              <div>
                <Label>Prioridade</Label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={form.prioridade}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, prioridade: e.target.value as any }))
                  }
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <Label>Origem</Label>
                <Input
                  value={form.origem}
                  onChange={(e) => setForm((s) => ({ ...s, origem: e.target.value }))}
                  placeholder="manual / manutencao / plano"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Ativo (ID)</Label>
                <Input
                  value={form.ativo_id}
                  onChange={(e) => setForm((s) => ({ ...s, ativo_id: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Data prevista</Label>
                <Input
                  type="date"
                  value={form.data_prevista || ""}
                  onChange={(e) => setForm((s) => ({ ...s, data_prevista: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado apenas se sua tabela tiver a coluna <code>data_prevista</code>.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                Salvar OS
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
