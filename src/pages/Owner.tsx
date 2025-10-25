// src/pages/Owner.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";

type ApiState = { loading: boolean; msg: string | null; err: string | null };
type Condo = { id: string; nome: string; endereco: string | null; created_at: string };

export default function OwnerPage() {
  const [isOwner, setIsOwner] = useState<null | boolean>(null);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [sindicoNome, setSindicoNome] = useState("");
  const [sindicoEmail, setSindicoEmail] = useState("");
  const [cpf, setCpf] = useState(""); // <- novo
  const [state, setState] = useState<ApiState>({ loading: false, msg: null, err: null });

  // Verifica se usuário é "system owner"
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsOwner(false); return; }

      // tenta RPC (versão sem parâmetro que usa auth.uid() no SQL)
      const { data: rpc, error: rpcErr } = await supabase.rpc("is_system_owner");
      if (!rpcErr) {
        setIsOwner(!!rpc);
        return;
      }
      
      // fallback: checa user_roles
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
        
      if (usuario?.id) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", usuario.id)
          .maybeSingle();
        setIsOwner(userRole?.role === 'admin');
      } else {
        setIsOwner(false);
      }
    })();
  }, []);

  // Carrega lista de condomínios do dono
  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      const { data, error } = await supabase
        .from("condominios")
        .select("id, nome, endereco, created_at")
        .order("created_at", { ascending: false });

      if (!error) setCondos((data as Condo[]) ?? []);
    })();
  }, [isOwner]);

  // normaliza CPF para apenas dígitos
  function onlyDigits(v: string) {
    return v.replace(/\D/g, "");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true, msg: null, err: null });

    try {
      const name = sindicoNome.trim();
      const email = sindicoEmail.trim();
      const condoName = nome.trim();
      const address = endereco.trim();
      const cpfDigits = onlyDigits(cpf);

      if (!cpfDigits) {
        setState({ loading: false, msg: null, err: "Informe um CPF válido (apenas números)." });
        return;
      }

      const { data: s } = await supabase.auth.getSession();
      const accessToken = s?.session?.access_token;

      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/create-customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ name, email, condoName, address, cpf: cpfDigits }),
        }
      );

      const raw = await resp.text();
      let json: any = null;
      try { json = JSON.parse(raw); } catch { /* fica como texto cru */ }

      if (!resp.ok) {
        const msg = json?.error ? `${json.error}` : raw || `Erro ${resp.status}`;
        setState({ loading: false, msg: null, err: `(${resp.status}) ${msg}` });
        return;
      }

      // Mensagem de sucesso inteligente (invite ou magic link)
      let successMsg = "Condomínio criado/vinculado e síndico associado com sucesso.";
      if (json?.invited) {
        successMsg += " Convite por e-mail enviado.";
      } else if (json?.magiclinkSent && json?.magicLink) {
        successMsg += " Usuário já existia — gerei um Magic Link:";
        successMsg += `\n${json.magicLink}`;
      }

      setState({ loading: false, msg: successMsg, err: null });

      // Recarrega a lista de condomínios
      const { data, error } = await supabase
        .from("condominios")
        .select("id, nome, endereco, created_at")
        .order("created_at", { ascending: false });
      if (!error) setCondos((data as Condo[]) ?? []);

      // limpa campos do formulário (menos o email, se quiser)
      setNome("");
      setEndereco("");
      setSindicoNome("");
      // setSindicoEmail(""); // opcional manter
      setCpf("");
    } catch (err: any) {
      setState({ loading: false, msg: null, err: String(err) });
    }
  }

  if (isOwner === null) return <div className="p-6">Verificando permissão…</div>;
  if (!isOwner) return <div className="p-6 text-red-600">Acesso negado.</div>;

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Painel do Dono</h1>

      <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-5 bg-white">
        <div>
          <label className="block text-sm mb-1">Nome do condomínio</label>
          <input
            className="border rounded w-full p-2"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Endereço</label>
          <input
            className="border rounded w-full p-2"
            value={endereco}
            onChange={e => setEndereco(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nome do síndico</label>
            <input
              className="border rounded w-full p-2"
              value={sindicoNome}
              onChange={e => setSindicoNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">E-mail do síndico</label>
            <input
              type="email"
              className="border rounded w-full p-2"
              value={sindicoEmail}
              onChange={e => setSindicoEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">CPF do síndico</label>
          <input
            inputMode="numeric"
            pattern="\d*"
            maxLength={14}
            className="border rounded w-full p-2"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Somente números"
            required
          />
        </div>

        <button
          type="submit"
          disabled={state.loading}
          className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
        >
          {state.loading ? "Processando…" : "Criar/Vincular condomínio e convidar síndico"}
        </button>

        {state.msg && (
          <p className="text-green-700 text-sm whitespace-pre-wrap mt-2">{state.msg}</p>
        )}
        {state.err && (
          <p className="text-red-600 text-sm whitespace-pre-wrap mt-2">{state.err}</p>
        )}
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Meus condomínios</h2>
        <ul className="space-y-2">
          {condos.map((c) => (
            <li key={c.id} className="border rounded p-3">
              <div className="font-medium">{c.nome}</div>
              <div className="text-sm text-gray-600">{c.endereco ?? "—"}</div>
              <div className="text-xs text-gray-400">
                Criado em {new Date(c.created_at).toLocaleString()}
              </div>
            </li>
          ))}
          {condos.length === 0 && (
            <li className="text-sm text-gray-500">Nenhum condomínio ainda.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
