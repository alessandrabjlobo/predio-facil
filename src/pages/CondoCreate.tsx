import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RequireOwner from "@/components/RequireOwner";


type ApiState = { loading: boolean; msg: string | null; err: string | null; magic?: string | null };

export default function CondoCreate() {
  const [condos, setCondos] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [sindicoNome, setSindicoNome] = useState("");
  const [sindicoEmail, setSindicoEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [state, setState] = useState<ApiState>({ loading: false, msg: null, err: null, magic: null });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("condominios")
        .select("id, nome, endereco, created_at")
        .order("created_at", { ascending: false });
      if (!error) setCondos(data ?? []);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true, msg: null, err: null, magic: null });

    try {
      const name = sindicoNome.trim();
      const email = sindicoEmail.trim().toLowerCase();
      const condoName = nome.trim();
      const address = endereco.trim();
      const cpfNum = cpf.replace(/\D/g, "");

      const { data: s } = await supabase.auth.getSession();
      const accessToken = s?.session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ name, email, condoName, address, cpf: cpfNum }),
      });

      const raw = await resp.text();
      if (!resp.ok) {
        setState({ loading: false, msg: null, err: `(${resp.status}) ${raw}`, magic: null });
        return;
      }

      const json = JSON.parse(raw);
      setState({
        loading: false,
        msg: json.magiclinkSent
          ? "Condomínio criado/vinculado e síndico associado com sucesso. Usuário já existia — gerei um Magic Link:"
          : "Condomínio criado e convite enviado com sucesso!",
        err: null,
        magic: json.magicLink ?? null,
      });

      // Recarrega a lista
      const { data, error } = await supabase
        .from("condominios")
        .select("id, nome, endereco, created_at")
        .order("created_at", { ascending: false });
      if (!error) setCondos(data ?? []);
    } catch (err: any) {
      setState({ loading: false, msg: null, err: String(err), magic: null });
    }
  }

  return (
    <RequireOwner>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Cadastrar Condomínio</h1>

        <form onSubmit={onSubmit} className="space-y-4 card">
          <div>
            <label className="label">Nome do condomínio</label>
            <input className="input" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>

          <div>
            <label className="label">Endereço</label>
            <input className="input" value={endereco} onChange={e => setEndereco(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome do síndico</label>
              <input className="input" value={sindicoNome} onChange={e => setSindicoNome(e.target.value)} required />
            </div>
            <div>
              <label className="label">E-mail do síndico</label>
              <input type="email" className="input" value={sindicoEmail} onChange={e => setSindicoEmail(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="label">CPF do síndico</label>
            <input className="input" inputMode="numeric" placeholder="Somente números"
                   value={cpf} onChange={e => setCpf(e.target.value)} required />
          </div>

          <button type="submit" className="btn" disabled={state.loading}>
            {state.loading ? "Criando…" : "Criar/Vincular condomínio e convidar síndico"}
          </button>

          {state.msg && (
            <p className="text-green-700 text-sm">
              {state.msg}{state.magic ? <> <a className="underline break-all" href={state.magic}>{state.magic}</a></> : null}
            </p>
          )}
          {state.err && <p className="text-red-600 text-sm whitespace-pre-wrap">{state.err}</p>}
        </form>

        <div>
          <h2 className="text-lg font-semibold mb-2">Meus condomínios</h2>
          <ul className="space-y-2">
            {condos.map((c) => (
              <li key={c.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.nome}</div>
                  <div className="text-sm text-gray-600">{c.endereco ?? "—"}</div>
                  <div className="text-xs text-gray-400">Criado em {new Date(c.created_at).toLocaleString()}</div>
                </div>
                <a className="text-indigo-600 hover:underline text-sm" href={`/condos/${c.id}/edit`}>Editar</a>
              </li>
            ))}
            {condos.length === 0 && <li className="text-sm text-gray-500">Nenhum condomínio ainda.</li>}
          </ul>
        </div>
      </div>
    </RequireOwner>
  );
}
