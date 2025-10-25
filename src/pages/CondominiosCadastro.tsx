// src/pages/CondominiosCadastro.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ApiState = { loading: boolean; msg: string | null; err: string | null };

export default function CondominiosCadastroPage() {
  const [isOwner, setIsOwner] = useState<null | boolean>(null);

  // form
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [sindicoNome, setSindicoNome] = useState("");
  const [sindicoEmail, setSindicoEmail] = useState("");

  const [state, setState] = useState<ApiState>({ loading: false, msg: null, err: null });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setIsOwner(false);
        return;
      }

      const { data: rpcData, error: rpcErr } = await supabase.rpc("is_system_owner");
      if (!rpcErr) {
        setIsOwner(!!rpcData);
        return;
      }

      // Fallback: usar user_roles
      const { data: userRoles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (await supabase.from("usuarios").select("id").eq("auth_user_id", user.id).maybeSingle()).data?.id ?? "")
        .maybeSingle();

      if (rolesErr) {
        setIsOwner(false);
      } else {
        setIsOwner(userRoles?.role === "admin");
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ loading: true, msg: null, err: null });

    try {
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();

      if (sessErr || !session) {
        setState({
          loading: false,
          msg: null,
          err: "Você não está logado. Faça login novamente.",
        });
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          condominio: { nome, endereco: endereco || null },
          sindico: { nome: sindicoNome, email: sindicoEmail },
        }),
      });

      const text = await res.text();
      let payload: any = null;
      try {
        payload = JSON.parse(text);
      } catch {}

      console.groupCollapsed("create-customer → resposta");
      console.log("status:", res.status);
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log("headers:", headersObj);
      console.log("body:", text);
      console.groupEnd();

      if (!res.ok) {
        const msg = payload?.error
          ? `${payload.error}${payload?.step ? ` (step: ${payload.step})` : ""}`
          : text || "Falha ao criar condomínio";
        setState({ loading: false, msg: null, err: msg });
        return;
      }

      setState({
        loading: false,
        msg: `Condomínio criado e convite enviado para ${sindicoEmail}.`,
        err: null,
      });

      setNome("");
      setEndereco("");
      setSindicoNome("");
      setSindicoEmail("");
    } catch (err: any) {
      setState({
        loading: false,
        msg: null,
        err: err?.message ?? String(err),
      });
    }
  }

  if (isOwner === null) return <div className="p-6">Verificando permissão…</div>;
  if (!isOwner)
    return (
      <div className="p-6 text-red-600">
        Acesso negado. Esta área é exclusiva do dono do sistema.
      </div>
    );

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Cadastrar Condomínio</h1>

      <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-5 bg-white">
        <div>
          <label className="block text-sm mb-1">Nome do condomínio</label>
          <input
            className="border rounded w-full p-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex.: Cond. Flor de Lis"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Endereço</label>
          <input
            className="border rounded w-full p-2"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, bairro…"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nome do síndico</label>
            <input
              className="border rounded w-full p-2"
              value={sindicoNome}
              onChange={(e) => setSindicoNome(e.target.value)}
              required
              placeholder="Maria Silva"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">E-mail do síndico</label>
            <input
              type="email"
              className="border rounded w-full p-2"
              value={sindicoEmail}
              onChange={(e) => setSindicoEmail(e.target.value)}
              required
              placeholder="maria@exemplo.com"
            />
          </div>
        </div>

        <button
          disabled={state.loading}
          className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
        >
          {state.loading ? "Criando…" : "Criar condomínio e convidar síndico"}
        </button>

        {state.msg && <p className="text-green-700 text-sm">{state.msg}</p>}
        {state.err && <p className="text-red-600 text-sm">{state.err}</p>}
      </form>

      <div className="text-sm text-gray-600">
        Após o convite, o síndico acessa o link do e-mail, define a senha e já entra no sistema.
      </div>
    </div>
  );
}
