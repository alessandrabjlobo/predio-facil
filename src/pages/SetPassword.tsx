// src/pages/SetPassword.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SetPasswordPage() {
  const [hasSession, setHasSession] = useState<null | boolean>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Quando o usuário chega pelo link do e-mail, o Supabase cria uma sessão temporária.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (password.length < 8) {
      setErr("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("As senhas não conferem.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setErr(error.message);
    } else {
      setMsg("Senha atualizada com sucesso! Você já pode usar e-mail e senha para entrar.");
      // opcional: redirecionar após alguns segundos
      setTimeout(() => nav("/"), 1200);
    }
  }

  if (hasSession === null) return <div className="p-6">Carregando…</div>;
  if (!hasSession)
    return (
      <div className="p-6 text-red-600">
        Link inválido ou expirado. Peça um novo convite ou redefinição de senha.
      </div>
    );

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Definir senha</h1>
      <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-5 bg-white">
        <div>
          <label className="block text-sm mb-1">Nova senha</label>
          <input
            type="password"
            className="border rounded w-full p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mín. 8 caracteres"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirmar senha</label>
          <input
            type="password"
            className="border rounded w-full p-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button
          disabled={saving}
          className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar senha"}
        </button>

        {msg && <p className="text-green-700 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>

      <p className="text-xs text-gray-500 mt-3">
        Dica: configure em <strong>Auth &rarr; URL Configuration</strong> do Supabase o Redirect
        para <code>/auth/set-password</code>.
      </p>
    </div>
  );
}
