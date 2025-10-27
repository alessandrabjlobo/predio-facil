// src/pages/SignUp.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function SignUp() {
  const nav = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function validar(): string | null {
    if (!nome.trim()) return "Informe seu nome.";
    if (!email.trim()) return "Informe seu e-mail.";
    const okEmail = /\S+@\S+\.\S+/.test(email);
    if (!okEmail) return "E-mail inválido.";
    if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (senha !== confirmSenha) return "As senhas não conferem.";
    return null;
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome },
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;

      const temSessao = !!data.session;

      if (temSessao) {
        alert("Conta criada com sucesso! Um administrador precisará atribuir suas permissões.");
        nav("/", { replace: true });
      } else {
        alert("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        nav("/login", { replace: true });
      }
    } catch (err: any) {
      setErro(err?.message ?? "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Criar conta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Cadastre-se para acessar o sistema do condomínio.
        </p>

        {erro && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={registrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                onClick={() => setMostrarSenha((s) => !s)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type={mostrarSenha ? "text" : "password"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              placeholder="Repita a senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-2">
            Após o cadastro, um administrador atribuirá suas permissões de acesso.
          </p>
        </form>

        <div className="mt-6 text-center text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-gray-900 font-medium underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
