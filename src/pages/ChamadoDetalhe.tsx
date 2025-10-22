// src/pages/ChamadoDetalhe.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getChamado, listAnexos, updateChamado, type Status, type Prioridade } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ChamadoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [item, setItem] = useState<any | null>(null);
  const [anexos, setAnexos] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Status | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    if (!id) return;
    setLoading(true);
    setErro(null);
    try {
      const d = await getChamado(id);
      setItem(d);
      const lst = await listAnexos(id);
      setAnexos(lst);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar chamado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const createdAt = useMemo(
    () => (item ? new Date(item.created_at ?? item.criado_em ?? Date.now()).toLocaleString() : ""),
    [item]
  );

  async function alterarStatus(novo: Status) {
    if (!id) return;
    setSaving(novo);
    try {
      const d = await updateChamado(id, { status: novo });
      setItem(d);
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao atualizar status");
    } finally {
      setSaving(null);
    }
  }

  function Badge({ text, className = "" }: { text: string; className?: string }) {
    return <span className={`text-xs px-2 py-1 rounded border ${className}`}>{text}</span>;
  }

  function BadgeStatus({ s }: { s: Status }) {
    const map: Record<Status, string> = {
      aberto: "bg-blue-50 text-blue-700 border-blue-200",
      em_andamento: "bg-amber-50 text-amber-700 border-amber-200",
      concluido: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelado: "bg-red-50 text-red-700 border-red-200",
    };
    return <Badge text={s.replace("_", " ")} className={map[s]} />;
  }

  function BadgePrioridade({ p }: { p: Prioridade }) {
    const map: Record<Prioridade, string> = {
      baixa: "bg-gray-100 text-gray-700 border-gray-200",
      media: "bg-sky-100 text-sky-700 border-sky-200",
      alta: "bg-orange-100 text-orange-700 border-orange-200",
      urgente: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return <Badge text={p} className={map[p]} />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-xl font-semibold">Detalhes do chamado</h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : erro ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>
      ) : !item ? (
        <div className="text-sm text-gray-600">Chamado não encontrado.</div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg">{item.titulo}</CardTitle>
              <div className="flex items-center gap-2">
                <BadgePrioridade p={(item.prioridade || "baixa") as Prioridade} />
                <BadgeStatus s={item.status as Status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {item.descricao && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Descrição</div>
                <p className="whitespace-pre-wrap">{item.descricao}</p>
              </div>
            )}

            {/* Local: só mostra se existir a coluna/valor; senão esconde */}
            {typeof item.local !== "undefined" && (
              <div className="text-gray-700">
                <span className="text-xs text-gray-500">Local:</span>{" "}
                {item.local?.trim() ? item.local : <span className="text-gray-400">—</span>}
              </div>
            )}

            {/* Categoria, se existir */}
            {typeof item.categoria !== "undefined" && item.categoria && (
              <div className="text-gray-700">
                <span className="text-xs text-gray-500">Categoria:</span> {item.categoria}
              </div>
            )}

            <div className="text-xs text-gray-500">Criado em {createdAt}</div>

            {anexos.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Anexos</div>
                <ul className="list-disc pl-5">
                  {anexos.map((a) => (
                    <li key={a.name}>
                      <a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-2">
              {(["aberto", "em_andamento", "concluido", "cancelado"] as Status[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={item.status === s ? "default" : "outline"}
                  onClick={() => alterarStatus(s)}
                  disabled={saving !== null}
                >
                  {saving === s ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
