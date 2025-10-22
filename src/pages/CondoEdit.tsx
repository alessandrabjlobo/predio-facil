import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import RequireOwner from "@/components/RequireOwner";

type Condo = { id: string; nome: string; endereco: string | null; created_at: string };

export default function CondoEdit() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [condo, setCondo] = useState<Condo | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cpfAdmin, setCpfAdmin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("condominios")
        .select("id, nome, endereco, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        setCondo(data);
        setNome(data.nome);
        setEndereco(data.endereco ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  async function saveBasics(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.from("condominios").update({ nome, endereco }).eq("id", id);
    if (error) setErr(error.message);
    else setMsg("Dados do condomínio salvos!");
  }

  async function setAdminByCpf() {
    setMsg(null); setErr(null);
    const cpf = (cpfAdmin ?? "").replace(/\D/g, "");
    if (!cpf) { setErr("Informe um CPF"); return; }

    // busca pessoa pelo CPF
    const { data: pessoa, error: pessoaErr } = await supabase
      .from("usuarios")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();
    if (pessoaErr) { setErr(pessoaErr.message); return; }
    if (!pessoa?.id) { setErr("CPF não encontrado em 'usuarios'."); return; }

    const usuarioId = pessoa.id as string;
    const { error: linkErr } = await supabase
      .from("usuarios_condominios")
      .upsert({ usuario_id: usuarioId, condominio_id: id, papel: "admin", is_principal: true });
    if (linkErr) setErr(linkErr.message);
    else setMsg("Síndico principal definido para este condomínio!");
  }

  async function ensureBasicAssets() {
    setMsg(null); setErr(null);
    // verifica se já tem algum ativo
    const { data: anyAtivo, error: selErr } = await supabase
      .from("ativos").select("id").eq("condominio_id", id!).limit(1);
    if (selErr) { setErr(selErr.message); return; }

    if (anyAtivo && anyAtivo.length > 0) {
      setMsg("Este condomínio já possui ativos; nada foi criado.");
      return;
    }

    const basicos = [
      { condominio_id: id, nome: "Conta padrão", tipo: "conta" },
      { condominio_id: id, nome: "Centro de custo geral", tipo: "centro_custo" },
      { condominio_id: id, nome: "Fornecedor genérico", tipo: "fornecedor" },
    ];
    const { error: insErr } = await supabase.from("ativos").insert(basicos);
    if (insErr) setErr(insErr.message);
    else setMsg("Ativos básicos criados!");
  }

  if (loading) return <div>Carregando…</div>;
  if (!condo) return <div>Condomínio não encontrado.</div>;

  return (
    <RequireOwner>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar condomínio</h1>
          <Link className="text-sm text-gray-600 hover:underline" to="/owner">Voltar ao Dashboard</Link>
        </div>

        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Dados básicos</h2>
          <form onSubmit={saveBasics} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div>
              <label className="label">Endereço</label>
              <input className="input" value={endereco} onChange={e => setEndereco(e.target.value)} />
            </div>
            <button className="btn">Salvar</button>
          </form>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Síndico / Equipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">Definir síndico principal por CPF</label>
              <input className="input" placeholder="Somente números" value={cpfAdmin} onChange={e => setCpfAdmin(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={setAdminByCpf} className="btn">Definir</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Dica: para adicionar mais membros use a tabela <code>usuarios_condominios</code> com papel
            <em> sindico/zelador/morador/fornecedor/admin</em>.
          </p>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Ativos</h2>
          <button onClick={ensureBasicAssets} className="btn">Garantir ativos básicos</button>
        </section>

        {msg && <p className="text-green-700 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm whitespace-pre-wrap">{err}</p>}
      </div>
    </RequireOwner>
  );
}
